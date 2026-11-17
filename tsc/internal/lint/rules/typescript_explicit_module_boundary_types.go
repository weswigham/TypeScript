package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptExplicitModuleBoundaryTypesRule struct {
	helpers.TypescriptScopeRuleContext
	visited map[*ast.Node]bool
}

func (rule *typescriptExplicitModuleBoundaryTypesRule) OnEnterNode(node *ast.Node) bool {
	return true
}

func (rule *typescriptExplicitModuleBoundaryTypesRule) OnExitNode(node *ast.Node) {
	if node.Kind != ast.KindSourceFile {
		return
	}
	rule.moduleBoundaries()
}

func (rule *typescriptExplicitModuleBoundaryTypesRule) moduleBoundaries() {
	rule.visited = make(map[*ast.Node]bool)
	for _, statement := range rule.Context.File.Statements.Nodes {
		if statement.Kind == ast.KindExportAssignment {
			rule.boundaryNode(statement.Expression())
		} else if statement.Kind == ast.KindExportDeclaration {
			export := statement.AsExportDeclaration()
			if export.ModuleSpecifier == nil && export.ExportClause != nil && export.ExportClause.Kind == ast.KindNamedExports {
				for _, specifier := range export.ExportClause.AsNamedExports().Elements.Nodes {
					name := specifier.AsExportSpecifier().PropertyName
					if name == nil {
						name = specifier.Name()
					}
					rule.boundaryNode(name)
				}
			}
		} else if ast.HasSyntacticModifier(statement, ast.ModifierFlagsExport) {
			rule.boundaryNode(statement)
		}
	}
}

func (rule *typescriptExplicitModuleBoundaryTypesRule) boundaryNode(node *ast.Node) {
	if node == nil || rule.visited[node] {
		return
	}
	rule.visited[node] = true
	switch node.Kind {
	case ast.KindIdentifier:
		binding := rule.Bindings().Nodes[node].Find(node.Text())
		if binding != nil {
			for _, declaration := range binding.Declarations {
				if !helpers.TsScopeImport(declaration) && declaration.Kind != ast.KindParameter {
					rule.boundaryNode(declaration)
				}
			}
			for _, reference := range binding.References {
				if reference.Write && reference.Node.Parent.Kind == ast.KindBinaryExpression {
					rule.boundaryNode(reference.Node.Parent.AsBinaryExpression().Right)
				}
			}
		}
	case ast.KindVariableStatement:
		for _, declaration := range node.AsVariableStatement().DeclarationList.AsVariableDeclarationList().Declarations.Nodes {
			rule.boundaryNode(declaration)
		}
	case ast.KindVariableDeclaration, ast.KindPropertyAssignment, ast.KindPropertyDeclaration:
		if node.Kind == ast.KindPropertyDeclaration && (ast.HasSyntacticModifier(node, ast.ModifierFlagsPrivate) || node.Name().Kind == ast.KindPrivateIdentifier) {
			return
		}
		if node.Type() != nil && rule.Boolean("allowTypedFunctionExpressions", true) {
			return
		}
		if rule.boundaryAllowed(node) {
			return
		}
		rule.boundaryNode(node.Initializer())
	case ast.KindShorthandPropertyAssignment:
		rule.boundaryNode(node.Name())
	case ast.KindClassDeclaration, ast.KindClassExpression:
		for _, member := range node.Members() {
			rule.boundaryNode(member)
		}
	case ast.KindArrayLiteralExpression:
		for _, element := range node.Elements() {
			rule.boundaryNode(element)
		}
	case ast.KindObjectLiteralExpression:
		for _, property := range node.AsObjectLiteralExpression().Properties.Nodes {
			rule.boundaryNode(property)
		}
	case ast.KindFunctionDeclaration, ast.KindFunctionExpression, ast.KindArrowFunction, ast.KindMethodDeclaration, ast.KindGetAccessor, ast.KindSetAccessor, ast.KindConstructor:
		if node.Name() != nil && node.Name().Kind == ast.KindPrivateIdentifier || ast.HasSyntacticModifier(node, ast.ModifierFlagsPrivate) || rule.boundaryAllowed(node) {
			return
		}
		if node.Kind != ast.KindFunctionDeclaration && rule.Boolean("allowTypedFunctionExpressions", true) {
			other := typescriptExplicitFunctionReturnTypeRule{context: rule.Context}
			if other.typedFunction(node) {
				return
			}
		}
		if rule.Boolean("allowOverloadFunctions", false) && node.Body() != nil {
			symbol := node.Symbol()
			if node.Name() != nil {
				symbol = rule.Context.GetChecker().GetSymbolAtLocation(node.Name())
			}
			if symbol != nil {
				for _, declaration := range symbol.Declarations() {
					if ast.IsFunctionLike(declaration) && declaration.Body() == nil {
						return
					}
				}
			}
		}
		rule.boundaryFunction(node)
	case ast.KindParenthesizedExpression:
		rule.boundaryNode(node.Expression())
	}
}

func (rule *typescriptExplicitModuleBoundaryTypesRule) boundaryAllowed(node *ast.Node) bool {
	if node.Name() == nil {
		return false
	}
	name := node.Name()
	if name.Kind == ast.KindComputedPropertyName {
		name = name.Expression()
	}
	text := ""
	switch name.Kind {
	case ast.KindIdentifier, ast.KindStringLiteral, ast.KindNumericLiteral, ast.KindNoSubstitutionTemplateLiteral:
		text = name.Text()
	case ast.KindNullKeyword, ast.KindTrueKeyword, ast.KindFalseKeyword:
		text = rule.Text(name)
	default:
		return false
	}
	return slices.Contains(helpers.TsScopeStrings(rule.Options()["allowedNames"]), text)
}

func (rule *typescriptExplicitModuleBoundaryTypesRule) boundaryFunction(node *ast.Node) {
	var returns []*ast.Node
	body := node.Body()
	if body != nil {
		body = ast.SkipParentheses(body)
	}
	if body != nil {
		if node.Kind == ast.KindArrowFunction && body.Kind != ast.KindBlock {
			returns = append(returns, body)
		} else {
			helpers.TsScopeWalk(body, func(child *ast.Node) bool {
				if ast.IsFunctionLike(child) || ast.IsClassLike(child) {
					return false
				}
				if child.Kind == ast.KindReturnStatement && child.Expression() != nil {
					returns = append(returns, ast.SkipParentheses(child.Expression()))
				}
				return true
			})
		}
	}
	higherOrder := len(returns) > 0
	for _, expression := range returns {
		higherOrder = higherOrder && (expression.Kind == ast.KindArrowFunction || expression.Kind == ast.KindFunctionExpression)
	}
	constArrow := false
	if node.Kind == ast.KindArrowFunction && body != nil {
		assertion := body
		for assertion.Kind == ast.KindSatisfiesExpression {
			assertion = ast.SkipParentheses(assertion.Expression())
		}
		constArrow = (assertion.Kind == ast.KindAsExpression || assertion.Kind == ast.KindTypeAssertionExpression) && helpers.TsAConstAssertion(assertion.Type())
	}
	if node.Type() == nil && node.Kind != ast.KindConstructor && node.Kind != ast.KindSetAccessor && !(higherOrder && rule.Boolean("allowHigherOrderFunctions", true)) && !(constArrow && rule.Boolean("allowDirectConstAssertionInArrowFunctions", true)) {

		start, end := rule.Start(node), node.End()
		if node.Name() != nil {
			end = node.Name().End()
		} else if node.Kind == ast.KindArrowFunction {
			start, end = rule.Start(node.AsArrowFunction().EqualsGreaterThanToken), node.AsArrowFunction().EqualsGreaterThanToken.End()
		} else if node.Body() != nil {
			end = node.Body().Pos()
		}
		rule.Context.Report(

			core.NewTextRange(start, end), diagnostics.Missing_return_type_on_function)

	}
	for _, parameter := range node.Parameters() {
		if parameter.Initializer() != nil {
			continue
		}
		missing := parameter.Type() == nil
		if !missing && (parameter.Type().Kind != ast.KindAnyKeyword || rule.Boolean("allowArgumentsExplicitlyTypedAsAny", false)) {
			continue
		}
		name := parameter.Name()
		if name.Kind == ast.KindIdentifier || name.Kind == ast.KindThisKeyword {
			if missing {
				rule.Context.Report(rule.Context.Range(parameter), diagnostics.Argument_0_should_be_typed, name.Text())
			} else {
				rule.Context.Report(rule.Context.Range(parameter), diagnostics.Argument_0_should_be_typed_with_a_non_any_type, name.Text())
			}
		} else {
			description := "Object pattern"
			if name.Kind == ast.KindArrayBindingPattern {
				description = "Array pattern"
			}
			if missing {
				rule.Context.Report(rule.Context.Range(parameter), diagnostics.X_0_argument_should_be_typed, description)
			} else {
				rule.Context.Report(rule.Context.Range(parameter), diagnostics.X_0_argument_should_be_typed_with_a_non_any_type, description)
			}
		}
	}
	if higherOrder && node.Type() == nil {
		for _, expression := range returns {
			rule.boundaryNode(expression)
		}
	}
}

func newTypeScriptExplicitModuleBoundaryTypes(context Context) Rule {
	return &typescriptExplicitModuleBoundaryTypesRule{Context: context, Name: "explicit-module-boundary-types"}
}
