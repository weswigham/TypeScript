package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type preferPromiseRejectErrorsRule struct{ context Context }

func newPreferPromiseRejectErrorsRule(context Context) Rule {
	rule := &preferPromiseRejectErrorsRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindCallExpression},
	}
}

func (rule *preferPromiseRejectErrorsRule) OnEnterNode(node *ast.Node) bool {
	rule.promiseRejection(node)
	return true
}

func (rule *preferPromiseRejectErrorsRule) promiseRejection(node *ast.Node) {
	if node.Kind != ast.KindCallExpression {
		return
	}
	callee := ast.SkipParentheses(node.Expression())
	reject := false
	if ast.IsAccessExpression(callee) && helpers.StatementPropertyName(callee) == "reject" {
		object := ast.SkipParentheses(callee.Expression())
		reject = object.Kind == ast.KindIdentifier && object.Text() == "Promise" && helpers.StatementBuiltin(rule.context, object, true)
	} else if callee.Kind == ast.KindIdentifier {
		checker := rule.context.GetChecker()
		symbol := checker.ResolveName(callee.Text(), callee, ast.SymbolFlagsValue, false)
		if symbol != nil {
			for _, declaration := range symbol.Declarations() {
				if declaration.Kind != ast.KindParameter || declaration.Name().Kind != ast.KindIdentifier || declaration.Initializer() != nil || declaration.AsParameterDeclaration().DotDotDotToken != nil {
					continue
				}
				function := declaration.Parent
				if function.Kind != ast.KindFunctionExpression && function.Kind != ast.KindArrowFunction {
					continue
				}
				parameters := function.FunctionLikeData().Parameters.Nodes
				if len(parameters) < 2 || parameters[1].Name().Kind != ast.KindIdentifier || parameters[1].Name().Text() != callee.Text() || parameters[1].Initializer() != nil || parameters[1].AsParameterDeclaration().DotDotDotToken != nil {
					continue
				}
				outer, constructor := helpers.OuterParenthesizedNodeAndParent(function)
				if constructor == nil || constructor.Kind != ast.KindNewExpression || len(constructor.Arguments()) == 0 || constructor.Arguments()[0] != outer {
					continue
				}
				constructorName := ast.SkipParentheses(constructor.Expression())
				reject = constructorName.Kind == ast.KindIdentifier && constructorName.Text() == "Promise" && helpers.StatementBuiltin(rule.context, constructorName, true)
				if reject {
					break
				}
			}
		}
	}
	if !reject {
		return
	}
	arguments := node.Arguments()
	if len(arguments) == 0 {
		if !helpers.SharedRuleBoolean(rule.context.Options, "allowEmptyReject", false) {
			rule.context.Report(rule.context.Range(node), diagnostics.Expected_the_Promise_rejection_reason_to_be_an_Error)
		}
		return
	}
	reason := ast.SkipParentheses(arguments[0])
	if !helpers.ExpressionCouldBeError(reason) || reason.Kind == ast.KindIdentifier && reason.Text() == "undefined" && helpers.StatementBuiltin(rule.context, reason, true) {
		rule.context.Report(rule.context.Range(node), diagnostics.Expected_the_Promise_rejection_reason_to_be_an_Error)
	}
}
