package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noUselessReturn struct{ helpers.ReturnRuleContext }

func (rule *noUselessReturn) OnEnterNode(node *ast.Node) bool { return true }
func (rule *noUselessReturn) OnExitNode(node *ast.Node) {
	if !helpers.ReturnFunction(node) {
		return
	}
	returns, _, flow := helpers.AnalyzeFunctionReturns(node)
	rule.useless(node, returns, flow)
}

func completionUselessLoopOrFinally(node, owner *ast.Node) bool {
	for current := node; current != nil && current != owner; current = current.Parent {
		if ast.IsIterationStatement(current, false) {
			return true
		}
		if current.Parent != nil && current.Parent.Kind == ast.KindTryStatement && current.Parent.AsTryStatement().FinallyBlock == current {
			return true
		}
	}
	return false
}

func completionUselessBreakTarget(node *ast.Node) *ast.Node {
	label := node.AsBreakStatement().Label
	for parent := node.Parent; parent != nil; parent = parent.Parent {
		if label == nil && (parent.Kind == ast.KindSwitchStatement || ast.IsIterationStatement(parent, false)) || label != nil && parent.Kind == ast.KindLabeledStatement && parent.AsLabeledStatement().Label.Text() == label.Text() {
			return parent
		}
	}
	return nil
}

func completionUselessContinuation(node, owner *ast.Node) bool {
	var tail func([]*ast.Node) (bool, *ast.Node)
	tail = func(statements []*ast.Node) (bool, *ast.Node) {
		for _, statement := range statements {
			switch statement.Kind {
			case ast.KindFunctionDeclaration:
				continue
			case ast.KindReturnStatement:
				if statement.Expression() != nil {
					return false, nil
				}
			case ast.KindBlock:
				if safe, jump := tail(statement.AsBlock().Statements.Nodes); !safe || jump != nil {
					return safe, jump
				}
			case ast.KindBreakStatement:
				return true, completionUselessBreakTarget(statement)
			default:
				return false, nil
			}
		}
		return true, nil
	}
	for current := node; current != nil && current != owner; {
		parent := current.Parent
		if parent == nil {
			break
		}
		if helpers.ReturnListParent(parent) {
			statements := helpers.ReturnList(parent)
			for index, statement := range statements {
				if statement != current {
					continue
				}
				safe, jump := tail(statements[index+1:])
				if !safe {
					return false
				}
				if jump != nil {
					current = jump
					parent = nil
				}
				break
			}
			if parent == nil {
				continue
			}
		}
		if parent.Kind == ast.KindCaseBlock {
			clauses := parent.AsCaseBlock().Clauses.Nodes
			for index, clause := range clauses {
				if clause == current {
					var statements []*ast.Node
					for _, following := range clauses[index+1:] {
						statements = append(statements, following.AsCaseOrDefaultClause().Statements.Nodes...)
					}
					safe, jump := tail(statements)
					if !safe {
						return false
					}
					if jump != nil {
						current, parent = jump, nil
					}
					break
				}
			}
			if parent == nil {
				continue
			}
		}
		if parent.Kind == ast.KindTryStatement && current == parent.AsTryStatement().CatchClause && parent.AsTryStatement().FinallyBlock != nil {
			if safe, _ := tail(parent.AsTryStatement().FinallyBlock.AsBlock().Statements.Nodes); !safe {
				return false
			}
		}
		if parent.Kind == ast.KindTryStatement && current == parent.AsTryStatement().TryBlock && parent.AsTryStatement().FinallyBlock != nil {
			flow := &helpers.ReturnFlowAnalysis{}
			if !helpers.CompletionHasNormal(flow.Statement(parent.AsTryStatement().FinallyBlock, nil)) {
				return true
			}
		}
		current = parent
	}
	return true
}

func (rule *noUselessReturn) useless(owner *ast.Node, returns []*ast.Node, flow *helpers.ReturnFlowAnalysis) {
	for _, statement := range returns {
		if statement.Expression() != nil || !flow.Reachable[statement] || completionUselessLoopOrFinally(statement, owner) || !completionUselessContinuation(statement, owner) {
			continue
		}
		report := rule.Context.Report(rule.Context.Range(statement), diagnostics.Unnecessary_return_statement)
		if !helpers.ReturnListParent(statement.Parent) {
			continue
		}
		lexer := scanner.NewScanner()
		lexer.SetText(rule.Context.File.Text()[rule.Start(statement):statement.End()])
		lexer.SetSkipTrivia(false)
		comments := false
		for kind := lexer.Scan(); kind != ast.KindEndOfFile; kind = lexer.Scan() {
			comments = comments || kind == ast.KindSingleLineCommentTrivia || kind == ast.KindMultiLineCommentTrivia
		}
		if !comments {
			rule.RetainedFix("no-useless-return", report, statement, rule.Start(statement), statement.End(), "")
		}
	}
}

func newNoUselessReturn(context Context) Rule {
	return &noUselessReturn{Context: context}
}
