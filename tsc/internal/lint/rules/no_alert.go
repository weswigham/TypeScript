package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noAlert struct {
	context Context
}

func (rule *noAlert) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindCallExpression {
		callee := ast.SkipParentheses(node.Expression())
		name := ""
		if callee.Kind == ast.KindIdentifier && helpers.StatementBuiltin(rule.context, callee, false) {
			name = callee.Text()
		} else if ast.IsAccessExpression(callee) && rule.isGlobalObject(ast.SkipParentheses(callee.Expression()), node) {
			name = helpers.StatementPropertyName(callee)
		}
		if name == "alert" || name == "confirm" || name == "prompt" {
			rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_0, name)
		}
	}
	return true
}

func (rule *noAlert) OnExitNode(node *ast.Node) {}

func (rule *noAlert) isGlobalObject(object *ast.Node, call *ast.Node) bool {
	if object.Kind == ast.KindIdentifier {
		return object.Text() == "window" && helpers.StatementBuiltin(rule.context, object, false) || object.Text() == "globalThis" && helpers.StatementBuiltin(rule.context, object, true)
	}
	if object.Kind != ast.KindThisKeyword || ast.IsExternalModule(rule.context.File) {
		return false
	}
	for child, parent := call, call.Parent; parent != nil; child, parent = parent, parent.Parent {
		if ast.IsFunctionLike(parent) && child != parent.Name() || ast.IsClassLike(parent) {
			return false
		}
		switch parent.Kind {
		case ast.KindBlock, ast.KindCaseBlock, ast.KindCatchClause, ast.KindWithStatement, ast.KindModuleDeclaration:
			return false
		case ast.KindForStatement, ast.KindForInStatement, ast.KindForOfStatement:
			initializer := parent.Initializer()
			if initializer != nil && initializer.Kind == ast.KindVariableDeclarationList && initializer.Flags&ast.NodeFlagsBlockScoped != 0 {
				return false
			}
		}
	}
	return true
}

func newNoAlert(context Context) Rule { return &noAlert{context: context} }
