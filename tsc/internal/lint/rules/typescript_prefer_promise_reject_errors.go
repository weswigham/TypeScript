package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptPreferPromiseRejectErrorsRule struct{ context Context }

func newTypeScriptPreferPromiseRejectErrors(context Context) Rule {
	rule := &typescriptPreferPromiseRejectErrorsRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindCallExpression, ast.KindNewExpression},
	}
}

func (rule *typescriptPreferPromiseRejectErrorsRule) OnEnterNode(node *ast.Node) bool {
	rule.checkReject(node)
	return true
}

func (rule *typescriptPreferPromiseRejectErrorsRule) errorLike(value *checker.Type) bool {
	if value == nil {
		return false
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
	if helpers.PromiseBuiltin(rule.context, value, "Error") {
		return true
	}
	if alias := value.Alias(); alias != nil && alias.Symbol().Name() == "Readonly" && helpers.PromiseLibrary(rule.context, alias.Symbol()) {
		arguments := alias.TypeArguments()
		return len(arguments) == 1 && rule.errorLike(arguments[0])
	}
	return false
}

func (rule *typescriptPreferPromiseRejectErrorsRule) rejectCall(node *ast.Node) {
	arguments := node.Arguments()
	if len(arguments) == 0 {
		if helpers.PromiseBoolean(rule.context, "allowEmptyReject", false) {
			return
		}
	} else {
		value := rule.context.GetChecker().GetTypeAtLocation(arguments[0])
		if helpers.PromiseAllowed(rule.context, arguments[0], value, "allow", false) || helpers.PromiseBoolean(rule.context, "allowThrowingAny", false) && value.Flags()&checker.TypeFlagsAny != 0 || helpers.PromiseBoolean(rule.context, "allowThrowingUnknown", false) && value.Flags()&checker.TypeFlagsUnknown != 0 || rule.errorLike(value) {
			return
		}
	}
	rule.context.Report(rule.context.Range(node), diagnostics.Expected_the_Promise_rejection_reason_to_be_an_Error)
}

func (rule *typescriptPreferPromiseRejectErrorsRule) checkReject(node *ast.Node) {
	typeChecker := rule.context.GetChecker()
	if node.Kind == ast.KindCallExpression {
		object, method := helpers.PromiseMember(rule.context, node.Expression())
		if object != nil && method == "reject" {
			value := typeChecker.GetTypeAtLocation(object)
			if helpers.PromiseBuiltin(rule.context, value, "PromiseConstructor") || helpers.PromiseBuiltin(rule.context, value, "Promise") {
				rule.rejectCall(node)
			}
		}
	}
	if node.Kind != ast.KindNewExpression || !helpers.PromiseBuiltin(rule.context, typeChecker.GetTypeAtLocation(node.Expression()), "PromiseConstructor") || len(node.Arguments()) == 0 {
		return
	}
	executor := node.Arguments()[0]
	if executor.Kind != ast.KindFunctionExpression && executor.Kind != ast.KindArrowFunction || len(executor.Parameters()) < 2 {
		return
	}
	parameter := executor.Parameters()[1].Name()
	if parameter == nil || parameter.Kind != ast.KindIdentifier {
		return
	}
	symbol := typeChecker.GetSymbolAtLocation(parameter)
	var visit func(*ast.Node)
	visit = func(child *ast.Node) {
		if child.Kind == ast.KindCallExpression {
			callee := ast.SkipParentheses(child.Expression())
			if callee.Kind == ast.KindIdentifier && typeChecker.GetSymbolAtLocation(callee) == symbol {
				rule.rejectCall(child)
			}
		}
		child.ForEachChild(func(next *ast.Node) bool { visit(next); return false })
	}
	visit(executor)
}
