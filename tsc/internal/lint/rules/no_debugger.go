package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noDebugger struct {
	context Context
}

func (rule *noDebugger) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindDebuggerStatement {
		diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_debugger_statement)
		tracker := rule.context.NewTracker()
		if node.Parent.Kind == ast.KindBlock && !tracker.NodeHasComments(rule.context.File, node) {
			tracker.Delete(rule.context.File, node)
		} else {
			tracker.ReplaceNodePreservingComments(rule.context.File, node, tracker.NewEmptyStatement())
		}
		diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("no-debugger", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Remove_debugger_statement), "no-debugger", ast.NewCompilerDiagnostic(diagnostics.Remove_all_debugger_statements)))
		return false
	}
	return true
}

func (rule *noDebugger) OnExitNode(node *ast.Node) {}

func newNoDebugger(context Context) Rule { return &noDebugger{context: context} }
