package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type maxDepthRule struct {
	context Context
}

func (rule *maxDepthRule) OnEnterNode(node *ast.Node) bool {
	if !maxDepthNode(node) {
		return true
	}
	depth := 1
	for parent := node.Parent; parent != nil; parent = parent.Parent {
		if helpers.FunctionHasBody(parent) || parent.Kind == ast.KindClassStaticBlockDeclaration {
			break
		}
		if maxDepthNode(parent) {
			depth++
		}
	}
	if maximum := helpers.SyntaxMaximum(rule.context, 4); depth > maximum {
		rule.context.Report(rule.context.Range(node), diagnostics.Blocks_are_nested_too_deeply_0_Maximum_allowed_is_1, depth, maximum)
	}
	return true
}

func (rule *maxDepthRule) OnExitNode(node *ast.Node) {
}

func maxDepthNode(node *ast.Node) bool {
	switch node.Kind {
	case ast.KindIfStatement:
		return node.Parent.Kind != ast.KindIfStatement || node.Parent.AsIfStatement().ElseStatement != node
	case ast.KindSwitchStatement, ast.KindTryStatement, ast.KindDoStatement, ast.KindWhileStatement, ast.KindWithStatement, ast.KindForStatement, ast.KindForInStatement, ast.KindForOfStatement:
		return true
	}
	return false
}

func newMaxDepth(context Context) Rule {
	return &maxDepthRule{context: context}
}
