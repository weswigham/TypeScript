package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"

	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptOnlyThrowErrorRule struct{ context Context }

func newTypeScriptOnlyThrowError(context Context) Rule {
	rule := &typescriptOnlyThrowErrorRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindThrowStatement},
	}
}

func (rule *typescriptOnlyThrowErrorRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindThrowStatement {
		rule.throwError(node.Expression())
	}
	return true
}

func (rule *typescriptOnlyThrowErrorRule) errorLike(value *checker.Type) bool {
	if value.Flags()&checker.TypeFlagsTypeParameter != 0 {
		constraint := rule.context.GetChecker().GetBaseConstraintOfType(value)
		return constraint != nil && rule.errorLike(constraint)
	}
	if value.IsUnion() {
		for _, part := range value.Types() {
			if !rule.errorLike(part) {
				return false
			}
		}
		return true
	}
	if value.IsIntersection() {
		return slices.ContainsFunc(value.Types(), rule.errorLike)
	}
	if helpers.SemanticMatchesBase(rule.context,

		value, func(part *checker.Type) bool {
			return part.Symbol() != nil && part.Symbol().Name() == "Error" && helpers.SemanticLibrarySymbol(rule.context,

				part.Symbol())
		}, make(map[*checker.Type]bool)) {
		return true
	}
	return false
}

func (rule *typescriptOnlyThrowErrorRule) rethrown(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	if node.Kind != ast.KindIdentifier {
		return false
	}
	c := rule.context.GetChecker()
	symbol := c.GetSymbolAtLocation(node)
	if symbol == nil || len(symbol.Declarations()) != 1 {
		return false
	}
	declaration := symbol.Declarations()[0]
	root := ast.GetRootDeclaration(declaration)
	if root.Kind == ast.KindVariableDeclaration && root.Parent.Kind == ast.KindCatchClause {
		return true
	}
	if declaration.Kind != ast.KindParameter || declaration.Name().Kind != ast.KindIdentifier || declaration.AsParameterDeclaration().DotDotDotToken != nil {
		return false
	}
	function := declaration.Parent
	if function.Kind != ast.KindArrowFunction || len(function.Parameters()) == 0 || function.Parameters()[0] != declaration {
		return false
	}
	parent := function.Parent
	for parent.Kind == ast.KindParenthesizedExpression {
		parent = parent.Parent
	}
	if parent.Kind != ast.KindCallExpression {
		return false
	}
	callee := ast.SkipParentheses(parent.Expression())
	if callee.Kind != ast.KindPropertyAccessExpression && callee.Kind != ast.KindElementAccessExpression {
		return false
	}
	method := ""
	if callee.Kind == ast.KindPropertyAccessExpression {
		method = callee.Name().Text()
	} else {
		argument := ast.SkipParentheses(callee.AsElementAccessExpression().ArgumentExpression)
		if argument.Kind == ast.KindStringLiteral {
			method = argument.Text()
		}
	}
	index := 0
	if method == "then" {
		index = 1
	} else if method != "catch" {
		return false
	}
	if len(parent.Arguments()) <= index || ast.SkipParentheses(parent.Arguments()[index]) != function {
		return false
	}
	return (&helpers.PromiseQueryContext{Context: rule.context}).Thenable(callee.Expression(), c.GetTypeAtLocation(callee.Expression()), false)
}

func (rule *typescriptOnlyThrowErrorRule) throwError(node *ast.Node) {
	if helpers.SemanticBooleanOption(rule.context,

		"allowRethrowing", true) && rule.rethrown(node) {
		return
	}
	value := rule.context.GetChecker().GetTypeAtLocation(node)
	if helpers.SemanticAllowedType(rule.context,

		value, nil) {
		return
	}
	if value.Flags()&checker.TypeFlagsUndefined != 0 {
		rule.context.Report(rule.context.Range(ast.SkipParentheses(node)), diagnostics.Do_not_throw_undefined)
		return
	}
	if helpers.SemanticBooleanOption(rule.context,

		"allowThrowingAny", true) && value.Flags()&checker.TypeFlagsAny != 0 || helpers.SemanticBooleanOption(rule.context,

		"allowThrowingUnknown", true) && value.Flags()&checker.TypeFlagsUnknown != 0 || rule.errorLike(value) {
		return
	}
	rule.context.Report(rule.context.Range(ast.SkipParentheses(node)), diagnostics.Expected_an_error_object_to_be_thrown)
}
