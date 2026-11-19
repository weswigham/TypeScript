package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noAwaitInLoop struct {
	context Context
}

func newNoAwaitInLoop(context Context) Rule {
	rule := &noAwaitInLoop{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindAwaitExpression, ast.KindForOfStatement, ast.KindVariableDeclarationList},
	}
}

func (rule *noAwaitInLoop) OnEnterNode(node *ast.Node) bool {
	await := node.Kind == ast.KindAwaitExpression || node.Kind == ast.KindForOfStatement && node.AsForInOrOfStatement().AwaitModifier != nil || node.Kind == ast.KindVariableDeclarationList && node.Flags&ast.NodeFlagsAwaitUsing == ast.NodeFlagsAwaitUsing
	if await {
		for child, parent := node, node.Parent; parent != nil; child, parent = parent, parent.Parent {
			if ast.IsFunctionLike(parent) && child != parent.Name() || parent.Kind == ast.KindForOfStatement && parent.AsForInOrOfStatement().AwaitModifier != nil {
				break
			}
			looped := false
			switch parent.Kind {
			case ast.KindForStatement:
				loop := parent.AsForStatement()
				looped = child == loop.Condition || child == loop.Incrementor || child == loop.Statement
			case ast.KindForInStatement, ast.KindForOfStatement:
				loop := parent.AsForInOrOfStatement()
				looped = child == loop.Statement || child == loop.Initializer && child.Kind == ast.KindVariableDeclarationList && child.Flags&ast.NodeFlagsAwaitUsing == ast.NodeFlagsAwaitUsing
			case ast.KindWhileStatement, ast.KindDoStatement:
				looped = true
			}
			if looped {
				rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_await_inside_a_loop)
				break
			}
		}
	}

	return true
}
