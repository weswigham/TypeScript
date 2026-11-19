package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type guardForInRule struct {
	context Context
}

func newGuardForIn(context Context) Rule {
	rule := &guardForInRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindForInStatement},
	}
}

func (rule *guardForInRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindForInStatement {
		body := node.Statement()
		if body.Kind == ast.KindEmptyStatement || body.Kind == ast.KindIfStatement {
			return true
		}
		if body.Kind == ast.KindBlock {
			statements := body.Statements()
			if len(statements) == 0 {
				return true
			}
			if statements[0].Kind == ast.KindIfStatement {
				guard := statements[0].AsIfStatement().ThenStatement
				if len(statements) == 1 || guard.Kind == ast.KindContinueStatement || guard.Kind == ast.KindBlock && len(guard.Statements()) == 1 && guard.Statements()[0].Kind == ast.KindContinueStatement {
					return true
				}
			}
		}
		rule.context.Report(rule.context.Range(node), diagnostics.The_body_of_a_for_in_should_be_wrapped_in_an_if_statement_to_filter_unwanted_properties_from_the_prototype)
	}
	return true
}
