package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

func (rule *SharedControlFlowContext) EnterGraph(node *ast.Node, transfer func(*ControlFlowSegment, uint8) uint8) bool {
	if node.Kind == ast.KindSourceFile || ast.IsFunctionLike(node) && node.Body() != nil || node.Kind == ast.KindClassStaticBlockDeclaration {
		graph := &ControlFlowGraph{context: rule.Context, transfer: transfer, Owner: node}
		graph.build()
		rule.Graphs = append(rule.Graphs, graph)
	}
	return true
}

type SharedControlFlowContext struct {
	Context  Context
	reported map[*ast.Node]bool
	Graphs   []*ControlFlowGraph
}

func (rule *SharedControlFlowContext) ReportOnce(node *ast.Node, message *diagnostics.Message, args ...any) {
	if rule.reported == nil {
		rule.reported = make(map[*ast.Node]bool)
	}
	if !rule.reported[node] {
		rule.reported[node] = true
		rule.Context.Report(rule.Context.Range(node), message, args...)
	}
}

func (rule *SharedControlFlowContext) Options() map[string]any {
	if len(rule.Context.Options) > 0 {
		if options, ok := rule.Context.Options[0].(map[string]any); ok {
			return options
		}
	}
	return nil
}
