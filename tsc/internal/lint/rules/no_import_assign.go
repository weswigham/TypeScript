package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noImportAssignRule struct{ context Context }

func newNoImportAssignRule(context Context) Rule {
	rule := &noImportAssignRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindIdentifier},
	}
}

func (rule *noImportAssignRule) OnEnterNode(node *ast.Node) bool {
	rule.checkBindingWrite(node)
	return true
}

func noImportAssignWriteNode(node *ast.Node) *ast.Node {
	for current := node.Parent; current != nil; current = current.Parent {
		switch current.Kind {
		case ast.KindBinaryExpression:
			if ast.IsAssignmentOperator(current.AsBinaryExpression().OperatorToken.Kind) {
				return current
			}
		case ast.KindPrefixUnaryExpression, ast.KindPostfixUnaryExpression, ast.KindDeleteExpression, ast.KindCallExpression, ast.KindForInStatement, ast.KindForOfStatement:
			return current
		}
	}
	return node
}

func (rule *noImportAssignRule) checkBindingWrite(node *ast.Node) {
	if !helpers.SharedBindingReference(node) {
		return
	}
	symbol := helpers.SharedBindingSymbol(rule.context, node)
	if symbol == nil || len(symbol.Declarations()) == 0 {
		return
	}
	declaration := ast.GetRootDeclaration(symbol.Declarations()[0])
	written := ast.IsAssignmentTarget(node)
	if declaration.Kind != ast.KindImportSpecifier && declaration.Kind != ast.KindNamespaceImport && declaration.Kind != ast.KindImportClause {
		return
	}
	if written {
		rule.context.Report(rule.context.Range(noImportAssignWriteNode(node)), diagnostics.X_0_is_read_only, node.Text())
	} else if declaration.Kind == ast.KindNamespaceImport && rule.namespaceWrite(node) {
		rule.context.Report(rule.context.Range(noImportAssignWriteNode(node)), diagnostics.The_members_of_0_are_read_only, node.Text())
	}
}

func (rule *noImportAssignRule) namespaceWrite(node *ast.Node) bool {
	outer := helpers.SharedParenthesizedOuter(node)
	parent := outer.Parent
	if parent == nil {
		return false
	}
	if ast.IsAccessExpression(parent) && parent.Expression() == outer {
		member := helpers.SharedParenthesizedOuter(parent)
		if ast.IsAssignmentTarget(member) || member.Parent != nil && member.Parent.Kind == ast.KindDeleteExpression {
			return true
		}
	}
	if parent.Kind != ast.KindCallExpression || len(parent.Arguments()) == 0 || parent.Arguments()[0] != outer {
		return false
	}
	callee := ast.SkipParentheses(parent.Expression())
	if !ast.IsAccessExpression(callee) {
		return false
	}
	object := ast.SkipParentheses(callee.Expression())
	if object.Kind != ast.KindIdentifier || !helpers.StatementBuiltin(rule.context, object, true) {
		return false
	}
	name := helpers.StatementPropertyName(callee)
	return object.Text() == "Object" && slices.Contains([]string{"assign", "defineProperty", "defineProperties", "freeze", "setPrototypeOf"}, name) || object.Text() == "Reflect" && slices.Contains([]string{"defineProperty", "deleteProperty", "set", "setPrototypeOf"}, name)
}
