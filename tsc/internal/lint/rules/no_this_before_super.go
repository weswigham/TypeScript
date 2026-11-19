package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noThisBeforeSuper struct {
	helpers.SharedControlFlowContext
}

func newNoThisBeforeSuper(context Context) Rule {
	rule := &noThisBeforeSuper{Context: context}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindFunctionDeclaration,
			ast.KindFunctionExpression,
			ast.KindArrowFunction,
			ast.KindMethodDeclaration,
			ast.KindGetAccessor,
			ast.KindSetAccessor,
			ast.KindConstructor,
			ast.KindMethodSignature,
			ast.KindCallSignature,
			ast.KindJSDocSignature,
			ast.KindConstructSignature,
			ast.KindIndexSignature,
			ast.KindFunctionType,
			ast.KindConstructorType,
			ast.KindSourceFile,
			ast.KindClassStaticBlockDeclaration,
		},
		Exit:      rule.OnExitNode,
		ExitKinds: []ast.Kind{ast.KindSourceFile},
	}
}

func (rule *noThisBeforeSuper) OnEnterNode(node *ast.Node) bool {
	return rule.EnterGraph(node, rule.transferState)
}

func (rule *noThisBeforeSuper) OnExitNode(node *ast.Node) {
	if node.Kind != ast.KindSourceFile {
		return
	}
	for _, graph := range rule.Graphs {
		rule.checkGraph(graph)
	}
}

func (rule *noThisBeforeSuper) transferState(segment *helpers.ControlFlowSegment, state uint8) uint8 {
	if state != 0 && segment.Op == ast.KindSuperKeyword {
		return 2
	}
	return state
}

func (rule *noThisBeforeSuper) checkGraph(graph *helpers.ControlFlowGraph) {
	base := helpers.ControlFlowBase(graph.Owner)
	if base == nil || base.Kind == ast.KindNullKeyword || base.Kind == ast.KindIdentifier && base.Text() == "undefined" || base.Kind == ast.KindVoidExpression {
		return
	}
	for _, segment := range graph.Segments {
		if segment.Op == ast.KindThisKeyword && segment.State&1 != 0 {
			kind := "this"
			if segment.Node.Kind == ast.KindSuperKeyword {
				kind = "super"
			}
			rule.ReportOnce(segment.Node, diagnostics.X_0_is_not_allowed_before_super, kind)
		}
	}
}
