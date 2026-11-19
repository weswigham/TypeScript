package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptPreferReturnThisTypeRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func newTypeScriptPreferReturnThisType(context Context) Rule {
	rule := &typescriptPreferReturnThisTypeRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindMethodDeclaration, ast.KindGetAccessor, ast.KindSetAccessor, ast.KindPropertyDeclaration},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptPreferReturnThisTypeRule) OnEnterNode(node *ast.Node) bool {
	var function, class *ast.Node
	if node.Parent != nil && ast.IsClassLike(node.Parent) {
		if node.Kind == ast.KindMethodDeclaration || node.Kind == ast.KindGetAccessor || node.Kind == ast.KindSetAccessor {
			function, class = node, node.Parent
		} else if node.Kind == ast.KindPropertyDeclaration && node.Initializer() != nil {
			initializer := node.Initializer()
			if initializer.Kind == ast.KindFunctionExpression || initializer.Kind == ast.KindArrowFunction {
				function, class = initializer, node.Parent
			}
		}
	}
	if function == nil || function.Body() == nil || function.Type() == nil || class.Name() == nil {
		return true
	}
	parameters := function.Parameters()
	if len(parameters) > 0 && parameters[0].Name().Kind == ast.KindIdentifier && parameters[0].Name().Text() == "this" {
		return true
	}
	annotation := typeSafetyClassReference(function.Type(), class.Name().Text())
	if annotation == nil {
		return true
	}
	c := rule.context.GetChecker()
	classType := c.GetTypeAtLocation(class)
	thisType := classType.AsInterfaceType().ThisType()
	hasThis, hasClass := false, false
	if function.Body().Kind != ast.KindBlock {
		hasThis = c.GetTypeAtLocation(function.Body()) == thisType
	} else {
		var visit func(*ast.Node)
		visit = func(current *ast.Node) {
			if hasClass || ast.IsFunctionLike(current) || ast.IsClassLike(current) {
				return
			}
			if current.Kind == ast.KindReturnStatement && current.Expression() != nil {
				expression := current.Expression()
				if expression.Kind == ast.KindThisKeyword {
					hasThis = true
				} else {
					value := c.GetTypeAtLocation(expression)
					if value == thisType {
						hasThis = true
					}
					for _, part := range helpers.TypeSafetyUnionParts(value) {
						if part == classType {
							hasClass = true
						}
					}
				}
				return
			}
			current.ForEachChild(func(child *ast.Node) bool { visit(child); return hasClass })
		}
		visit(function.Body())
	}
	if hasThis && !hasClass {
		diagnostic := rule.context.Report(rule.context.Range(annotation), diagnostics.Use_this_type_instead)
		if rule.context.NewTracker != nil {
			tracker := rule.context.NewTracker()
			tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(scanner.GetTokenPosOfNode(annotation, rule.context.File, false), annotation.End()), "this")
			rule.AddSuggestion(diagnostic, "@typescript-eslint/prefer-return-this-type", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Use_the_this_return_type))
		}
	}
	return true
}

func typeSafetyClassReference(annotation *ast.Node, name string) *ast.Node {
	if annotation.Kind == ast.KindTypeReference {
		typeName := annotation.AsTypeReferenceNode().TypeName
		if typeName.Kind == ast.KindIdentifier && typeName.Text() == name {
			return annotation
		}
	}
	if annotation.Kind == ast.KindUnionType {
		for _, part := range annotation.AsUnionTypeNode().Types.Nodes {
			if found := typeSafetyClassReference(part, name); found != nil {
				return found
			}
		}
	}
	return nil
}
