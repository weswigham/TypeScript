package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noReturnAssign struct {
	context Context
}

func (rule *noReturnAssign) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindBinaryExpression && ast.IsAssignmentOperator(node.AsBinaryExpression().OperatorToken.Kind) {
		always := len(rule.context.Options) > 0 && rule.context.Options[0] == "always"
		if !always && node.Parent != nil && node.Parent.Kind == ast.KindParenthesizedExpression {
			return true
		}
		child := node
		for parent := node.Parent; parent != nil; child, parent = parent, parent.Parent {
			if parent.Kind == ast.KindReturnStatement {
				rule.context.Report(rule.context.Range(parent), diagnostics.Return_statement_should_not_contain_assignment)
				break
			}
			if parent.Kind == ast.KindArrowFunction {
				if parent.Body() == child {
					rule.context.Report(rule.context.Range(parent), diagnostics.Arrow_function_should_not_return_assignment)
				}
				break
			}
			if ast.IsStatement(parent) || ast.IsFunctionLike(parent) || ast.IsClassLike(parent) {
				break
			}
		}
	}
	return true
}

func (rule *noReturnAssign) OnExitNode(node *ast.Node) {}

func newNoReturnAssign(context Context) Rule { return &noReturnAssign{context: context} }
