package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noUnsafeFinallyRule struct {
	context Context
}

func newNoUnsafeFinally(context Context) Rule {
	rule := &noUnsafeFinallyRule{
		context: context,
	}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindBreakStatement, ast.KindContinueStatement, ast.KindReturnStatement, ast.KindThrowStatement},
	}
}

func (rule *noUnsafeFinallyRule) OnEnterNode(node *ast.Node) bool {
	rule.checkFinally(node)
	return true
}

func (rule *noUnsafeFinallyRule) checkFinally(node *ast.Node) {
	var nodeType string
	var label *ast.Node
	switch node.Kind {
	case ast.KindReturnStatement:
		nodeType = "ReturnStatement"
	case ast.KindThrowStatement:
		nodeType = "ThrowStatement"
	case ast.KindBreakStatement, ast.KindContinueStatement:
		if node.Kind == ast.KindBreakStatement {
			label = node.AsBreakStatement().Label
			nodeType = "BreakStatement"
		} else {
			label = node.AsContinueStatement().Label
			nodeType = "ContinueStatement"
		}
	default:
		return
	}
	labelInside := false
	for current := node; current != nil; current = current.Parent {
		if current.Kind == ast.KindSourceFile || ast.IsFunctionLike(current) || ast.IsClassLike(current) {
			return
		}
		if label == nil {
			if (node.Kind == ast.KindBreakStatement || node.Kind == ast.KindContinueStatement) && ast.IsIterationStatement(current, false) || node.Kind == ast.KindBreakStatement && current.Kind == ast.KindSwitchStatement {
				return
			}
		} else if current.Parent != nil && current.Parent.Kind == ast.KindLabeledStatement && current.Parent.AsLabeledStatement().Label.Text() == label.Text() {
			labelInside = true
		}
		if current.Parent != nil && current.Parent.Kind == ast.KindTryStatement && current.Parent.AsTryStatement().FinallyBlock == current {
			if !labelInside {
				rule.context.Report(rule.context.Range(node), diagnostics.Unsafe_usage_of_0, nodeType)
			}
			return
		}
	}
}
