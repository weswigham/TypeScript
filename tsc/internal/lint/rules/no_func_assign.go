package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noFuncAssignRule struct{ context Context }

func newNoFuncAssignRule(context Context) Rule {
	return &noFuncAssignRule{context: context}
}

func (rule *noFuncAssignRule) OnEnterNode(node *ast.Node) bool {
	rule.checkBindingWrite(node)
	return true
}

func (rule *noFuncAssignRule) OnExitNode(node *ast.Node) {}

func (rule *noFuncAssignRule) checkBindingWrite(node *ast.Node) {
	if !helpers.SharedBindingReference(node) {
		return
	}
	symbol := helpers.SharedBindingSymbol(rule.context, node)
	if symbol == nil || len(symbol.Declarations()) == 0 {
		return
	}
	declaration := ast.GetRootDeclaration(symbol.Declarations()[0])
	written := ast.IsAssignmentTarget(node)
	if written && (declaration.Kind == ast.KindFunctionDeclaration || declaration.Kind == ast.KindFunctionExpression) {
		rule.context.Report(rule.context.Range(node), diagnostics.X_0_is_a_function, node.Text())
	}
}
