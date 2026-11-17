package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noUnreachableLoop struct {
	helpers.SharedControlFlowContext
}

func (rule *noUnreachableLoop) OnEnterNode(node *ast.Node) bool { return rule.EnterGraph(node, nil) }

func (rule *noUnreachableLoop) OnExitNode(node *ast.Node) {
	if node.Kind != ast.KindSourceFile {
		return
	}
	for _, graph := range rule.Graphs {
		rule.checkGraph(graph)
	}
}

func (rule *noUnreachableLoop) checkGraph(graph *helpers.ControlFlowGraph) {
	for _, loop := range graph.Loops {
		if helpers.ControlFlowState(loop.Entry) != 0 && helpers.ControlFlowState(loop.Back) == 0 && !rule.ignoreLoop(loop.Node) {
			rule.ReportOnce(loop.Node, diagnostics.Invalid_loop_Its_body_allows_only_one_iteration)
		}
	}
}

func (rule *noUnreachableLoop) ignoreLoop(node *ast.Node) bool {
	names := map[ast.Kind]string{ast.KindWhileStatement: "WhileStatement", ast.KindDoStatement: "DoWhileStatement", ast.KindForStatement: "ForStatement", ast.KindForInStatement: "ForInStatement", ast.KindForOfStatement: "ForOfStatement"}
	switch ignored := rule.Options()["ignore"].(type) {
	case []any:
		for _, name := range ignored {
			if name == names[node.Kind] {
				return true
			}
		}
	case []string:
		return slices.Contains(ignored, names[node.Kind])
	}
	return false
}

func newNoUnreachableLoop(context Context) Rule {
	return &noUnreachableLoop{Context: context}
}
