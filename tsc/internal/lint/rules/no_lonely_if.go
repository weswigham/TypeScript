package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noLonelyIf struct {
	context Context
}

func newNoLonelyIf(context Context) Rule { return &noLonelyIf{context: context} }

func (rule *noLonelyIf) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindIfStatement {
		rule.lonelyIf(node)
	}

	return true
}

func (rule *noLonelyIf) OnExitNode(node *ast.Node) {
}

func (rule *noLonelyIf) lonelyIf(node *ast.Node) {
	block := node.Parent
	if block == nil || block.Kind != ast.KindBlock || len(block.AsBlock().Statements.Nodes) != 1 || block.Parent == nil || block.Parent.Kind != ast.KindIfStatement || block.Parent.AsIfStatement().ElseStatement != block {
		return
	}
	if lonelyIfHasDanglingElse(node) {
		for child, parent := block.Parent, block.Parent.Parent; parent != nil; child, parent = parent, parent.Parent {
			if parent.Kind == ast.KindIfStatement {
				if parent.AsIfStatement().ThenStatement == child && parent.AsIfStatement().ElseStatement != nil {
					return
				}
			} else if parent.Kind != ast.KindLabeledStatement && !ast.IsIterationStatement(parent, false) && parent.Kind != ast.KindWithStatement {
				break
			}
		}
	}
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_if_as_the_only_statement_in_an_else_block)
	text := rule.context.File.Text()
	start := scanner.GetTokenPosOfNode(block, rule.context.File, false)
	if strings.TrimSpace(text[start+1:scanner.GetTokenPosOfNode(node, rule.context.File, false)]) != "" || strings.TrimSpace(text[node.End():block.End()-1]) != "" || rule.context.NewTracker == nil {
		return
	}
	then := node.AsIfStatement().ThenStatement
	if then.Kind != ast.KindBlock && !strings.HasSuffix(helpers.SourceNodeText(rule.context, then), ";") && strings.TrimSpace(text[block.End():]) != "" {
		return
	}
	tracker := rule.context.NewTracker()
	tracker.ReplaceNodePreservingComments(rule.context.File, block, tracker.DeepCloneReparse(node))
	rule.fix(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.Replace_else_block_with_else_if))
}

func (rule *noLonelyIf) fix(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("no-lonely-if", tracker.GetTextChanges(), description, "no-lonely-if", description))
}

func lonelyIfHasDanglingElse(node *ast.Node) bool {
	for node != nil {
		switch node.Kind {
		case ast.KindIfStatement:
			if node.AsIfStatement().ElseStatement == nil {
				return true
			}
			node = node.AsIfStatement().ElseStatement
		case ast.KindLabeledStatement:
			node = node.AsLabeledStatement().Statement
		case ast.KindForStatement:
			node = node.AsForStatement().Statement
		case ast.KindForOfStatement, ast.KindForInStatement:
			node = node.AsForInOrOfStatement().Statement
		case ast.KindWhileStatement:
			node = node.AsWhileStatement().Statement
		case ast.KindWithStatement:
			node = node.AsWithStatement().Statement
		default:
			return false
		}
	}
	return false
}
