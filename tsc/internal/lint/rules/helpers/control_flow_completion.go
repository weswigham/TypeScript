package helpers

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
)

type ReturnCompletionKind uint8

const (
	CompletionNormal ReturnCompletionKind = iota
	CompletionReturn
	CompletionThrow
	completionBreak
	completionContinue
)

type ReturnCompletion struct {
	Kind   ReturnCompletionKind
	target string
	origin *ast.Node
}

type ReturnFlowAnalysis struct {
	Reachable map[*ast.Node]bool
	returns   []*ast.Node
}

func CompletionHasNormal(flow []ReturnCompletion) bool {
	for _, completion := range flow {
		if completion.Kind == CompletionNormal {
			return true
		}
	}
	return false
}

func (flow *ReturnFlowAnalysis) Statement(node *ast.Node, _ []string) []ReturnCompletion {
	flow.Reachable, flow.returns = nil, nil
	if node == nil {
		return []ReturnCompletion{{Kind: CompletionNormal}}
	}
	owner := node.Parent
	if owner != nil && ast.IsFunctionLike(owner) && owner.Body() == node {
		if bound, ok := ControlFlowBinderStatements(owner); ok {
			flow.Reachable, flow.returns = bound.Statements, bound.returns
			result := bound.abrupt
			if owner.Flags&ast.NodeFlagsHasImplicitReturn != 0 {
				result = append(result, ReturnCompletion{Kind: CompletionNormal})
			}
			return result
		}
	}

	// ESLint does not inline IIFEs, treats literal conditions differently, and only
	// enters catch blocks for potentially throwing expressions. Share its graph
	// with the other flow rules rather than rebuilding completion flow separately.
	graph := &ControlFlowGraph{root: node, returnCompletion: true}
	graph.build()
	flow.Reachable = make(map[*ast.Node]bool)
	for statement, segments := range graph.Statements {
		flow.Reachable[statement] = ControlFlowState(segments) != 0
		if statement.Kind == ast.KindReturnStatement {
			flow.returns = append(flow.returns, statement)
		}
	}
	slices.SortFunc(flow.returns, func(left, right *ast.Node) int { return left.Pos() - right.Pos() })
	var result []ReturnCompletion
	if ControlFlowState(graph.result.normal) != 0 {
		result = append(result, ReturnCompletion{Kind: CompletionNormal})
	}
	for _, exit := range graph.result.exits {
		if ControlFlowState(exit.segments) == 0 {
			continue
		}
		var kind ReturnCompletionKind
		switch exit.kind {
		case ast.KindReturnStatement:
			kind = CompletionReturn
		case ast.KindThrowStatement:
			kind = CompletionThrow
		case ast.KindBreakStatement:
			kind = completionBreak
		case ast.KindContinueStatement:
			kind = completionContinue
		default:
			continue
		}
		result = append(result, ReturnCompletion{Kind: kind, target: exit.label, origin: exit.node})
	}
	return result
}

// The binder already records syntactic statement reachability and function
// completion. Keep ESLint's distinct execution model at the boundary, without
// using checker reachability (which also prunes never calls/exhaustive switches).
type ControlFlowBinderInfo struct {
	Statements map[*ast.Node]bool
	returns    []*ast.Node
	abrupt     []ReturnCompletion
}

func ControlFlowBinderStatements(owner *ast.Node) (*ControlFlowBinderInfo, bool) {
	file := ast.GetSourceFileOfNode(owner)
	if file == nil || !file.IsBound() || owner.Kind == ast.KindClassStaticBlockDeclaration || ast.GetImmediatelyInvokedFunctionExpression(owner) != nil {
		return nil, false
	}
	info := &ControlFlowBinderInfo{Statements: make(map[*ast.Node]bool)}
	var visit func(*ast.Node) bool
	visit = func(node *ast.Node) bool {
		if node == nil || ast.IsTypeNode(node) {
			return false
		}
		if ast.IsFunctionLike(node) {
			return ast.GetImmediatelyInvokedFunctionExpression(node) != nil
		}
		switch node.Kind {
		case ast.KindTryStatement, ast.KindClassDeclaration, ast.KindClassExpression, ast.KindModuleDeclaration,
			ast.KindExportDeclaration, ast.KindExportAssignment:
			return true
		case ast.KindIfStatement:
			if controlFlowBinderPrunesCondition(node.Expression()) {
				return true
			}
		case ast.KindWhileStatement, ast.KindDoStatement, ast.KindForStatement:
			condition := ControlFlowLoopCondition(node)
			if condition != nil && (controlFlowLiteralTruth(ast.SkipParentheses(condition)) != 0 || controlFlowBinderPrunesCondition(condition)) {
				return true
			}
		}
		if ast.IsStatement(node) {
			reachable := node.Flags&ast.NodeFlagsUnreachable == 0
			info.Statements[node] = reachable
			if node.Kind == ast.KindReturnStatement {
				info.returns = append(info.returns, node)
				if reachable {
					info.abrupt = append(info.abrupt, ReturnCompletion{Kind: CompletionReturn, origin: node})
				}
			} else if node.Kind == ast.KindThrowStatement && reachable {
				info.abrupt = append(info.abrupt, ReturnCompletion{Kind: CompletionThrow, origin: node})
			}
		}
		return node.ForEachChild(visit)
	}
	root := owner
	if owner.Kind != ast.KindSourceFile {
		root = owner.Body()
		if ast.IsFunctionLike(owner) {
			for _, parameter := range owner.Parameters() {
				if visit(parameter.Initializer()) {
					return nil, false
				}
			}
		}
	}
	if visit(root) {
		return nil, false
	}
	return info, true
}

func controlFlowBinderPrunesCondition(node *ast.Node) bool {
	if node == nil {
		return false
	}
	node = ast.SkipParentheses(node)
	switch node.Kind {
	case ast.KindTrueKeyword, ast.KindFalseKeyword:
		return true
	case ast.KindPrefixUnaryExpression:
		expression := node.AsPrefixUnaryExpression()
		return expression.Operator == ast.KindExclamationToken && controlFlowBinderPrunesCondition(expression.Operand)
	case ast.KindBinaryExpression:
		expression := node.AsBinaryExpression()
		return ast.IsLogicalOrCoalescingBinaryOperator(expression.OperatorToken.Kind) &&
			(controlFlowBinderPrunesCondition(expression.Left) || controlFlowBinderPrunesCondition(expression.Right))
	case ast.KindConditionalExpression:
		expression := node.AsConditionalExpression()
		return controlFlowBinderPrunesCondition(expression.Condition) ||
			controlFlowBinderPrunesCondition(expression.WhenTrue) || controlFlowBinderPrunesCondition(expression.WhenFalse)
	}
	return false
}
