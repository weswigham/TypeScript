package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type constructorSuper struct {
	helpers.SharedControlFlowContext
}

func newConstructorSuper(context Context) Rule {
	rule := &constructorSuper{Context: context}

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

func (rule *constructorSuper) OnEnterNode(node *ast.Node) bool {
	return rule.EnterGraph(node, rule.transferState)
}

func (rule *constructorSuper) OnExitNode(node *ast.Node) {
	if node.Kind != ast.KindSourceFile {
		return
	}
	for _, graph := range rule.Graphs {
		rule.checkGraph(graph)
	}
}

func (rule *constructorSuper) transferState(segment *helpers.ControlFlowSegment, state uint8) uint8 {
	if state != 0 && (segment.Op == ast.KindSuperKeyword || segment.Op == ast.KindReturnStatement) {
		return 2
	}
	return state
}

func controlFlowPossibleConstructor(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	switch node.Kind {
	case ast.KindClassExpression, ast.KindFunctionExpression, ast.KindThisKeyword, ast.KindPropertyAccessExpression, ast.KindElementAccessExpression, ast.KindCallExpression, ast.KindNewExpression, ast.KindYieldExpression, ast.KindTaggedTemplateExpression, ast.KindMetaProperty:
		return true
	case ast.KindIdentifier:
		return node.Text() != "undefined"
	case ast.KindBinaryExpression:
		expression := node.AsBinaryExpression()
		switch expression.OperatorToken.Kind {
		case ast.KindEqualsToken, ast.KindAmpersandAmpersandEqualsToken, ast.KindAmpersandAmpersandToken, ast.KindCommaToken:
			return controlFlowPossibleConstructor(expression.Right)
		case ast.KindBarBarToken, ast.KindQuestionQuestionToken, ast.KindBarBarEqualsToken, ast.KindQuestionQuestionEqualsToken:
			return controlFlowPossibleConstructor(expression.Left) || controlFlowPossibleConstructor(expression.Right)
		}
	case ast.KindConditionalExpression:
		return controlFlowPossibleConstructor(node.AsConditionalExpression().WhenTrue) || controlFlowPossibleConstructor(node.AsConditionalExpression().WhenFalse)
	}
	return false
}

func (rule *constructorSuper) checkGraph(graph *helpers.ControlFlowGraph) {
	base := helpers.ControlFlowBase(graph.Owner)
	if base == nil {
		return
	}
	state := helpers.ControlFlowState(graph.Returns)
	if state&1 != 0 {
		message := diagnostics.Expected_to_call_super
		if state&2 != 0 {
			message = diagnostics.Lacked_a_call_of_super_in_some_code_paths
		}
		rule.ReportOnce(graph.Owner, message)
	}
	for _, segment := range graph.Segments {
		if segment.Op != ast.KindSuperKeyword || segment.State == 0 {
			continue
		}
		if helpers.ControlFlowInput(segment)&2 != 0 {
			rule.ReportOnce(segment.Node, diagnostics.Unexpected_duplicate_super)
		} else if !controlFlowPossibleConstructor(base) {
			rule.ReportOnce(segment.Node, diagnostics.Unexpected_super_because_super_is_not_a_constructor)
		}
	}
}
