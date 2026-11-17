package helpers

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
)

type UsageEvent struct {
	Node           *ast.Node
	Binding        *UsageBinding
	Read, Write    bool
	Suspend        bool
	AtomicSkipRead bool
	Assignment     *ast.Node
	Targets        []*ast.Node
	Next           []*UsageEvent
	Reachable      bool
	Protected      bool
}

type UsageGraph struct {
	Owner      *ast.Node
	Entry      *UsageEvent
	Events     []*UsageEvent
	model      *UsageModel
	breakTo    *UsageEvent
	continueTo *UsageEvent
	returnTo   *UsageEvent
	throwTo    *UsageEvent
	protected  bool
	labels     map[string][2]*UsageEvent
}

func (model *UsageModel) makeGraph(owner *ast.Node) {
	graph := &UsageGraph{Owner: owner, model: model, labels: make(map[string][2]*UsageEvent)}
	end := graph.event(nil, nil, false, false, nil)
	graph.returnTo, graph.throwTo = end, end
	if owner.Kind == ast.KindSourceFile {
		graph.Entry = graph.sequence(owner.AsSourceFile().Statements.Nodes, end)
	} else if owner.Kind == ast.KindPropertyDeclaration {
		graph.Entry = graph.expression(owner.Initializer(), end)
	} else if owner.Kind == ast.KindClassStaticBlockDeclaration {
		graph.Entry = graph.statement(owner.AsClassStaticBlockDeclaration().Body, end)
	} else {
		graph.Entry = graph.statement(owner.Body(), end)
		var parameters []*ast.Node
		if ast.IsFunctionLike(owner) {
			parameters = owner.Parameters()
		}
		for _, parameter := range slices.Backward(parameters) {
			graph.Entry = graph.pattern(parameter.Name(), graph.Entry, nil, false)
			if parameter.Initializer() != nil {
				graph.Entry = graph.branch(graph.Entry, graph.expression(parameter.Initializer(), graph.Entry))
			}
		}
	}
	var mark func(*UsageEvent)
	mark = func(event *UsageEvent) {
		if event == nil || event.Reachable {
			return
		}
		event.Reachable = true
		for _, next := range event.Next {
			mark(next)
		}
	}
	mark(graph.Entry)
	model.Graphs = append(model.Graphs, graph)
}

func (graph *UsageGraph) event(node *ast.Node, binding *UsageBinding, read, write bool, next *UsageEvent) *UsageEvent {
	event := &UsageEvent{Node: node, Binding: binding, Read: read, Write: write, Protected: graph.protected}
	if next != nil {
		event.Next = []*UsageEvent{next}
	}
	graph.Events = append(graph.Events, event)
	return event
}

func (graph *UsageGraph) branch(paths ...*UsageEvent) *UsageEvent {
	event := graph.event(nil, nil, false, false, nil)
	for _, path := range paths {
		if path != nil {
			event.Next = append(event.Next, path)
		}
	}
	return event
}

func (graph *UsageGraph) mayThrow(next *UsageEvent) *UsageEvent {
	return graph.branch(next, graph.throwTo)
}

func (graph *UsageGraph) sequence(nodes []*ast.Node, next *UsageEvent) *UsageEvent {
	for _, node := range slices.Backward(nodes) {
		next = graph.statement(node, next)
	}
	return next
}

func (graph *UsageGraph) statement(node *ast.Node, next *UsageEvent) *UsageEvent {
	if node == nil {
		return next
	}
	switch node.Kind {
	case ast.KindBlock:
		return graph.sequence(node.AsBlock().Statements.Nodes, next)
	case ast.KindVariableStatement:
		return graph.statement(node.AsVariableStatement().DeclarationList, next)
	case ast.KindVariableDeclarationList:
		return graph.sequence(node.AsVariableDeclarationList().Declarations.Nodes, next)
	case ast.KindVariableDeclaration:
		if node.Initializer() == nil {
			return next
		}
		return graph.expression(node.Initializer(), graph.pattern(node.Name(), next, node, true))
	case ast.KindExpressionStatement, ast.KindExportAssignment:
		return graph.expression(node.Expression(), next)
	case ast.KindIfStatement:
		statement := node.AsIfStatement()
		return graph.expression(statement.Expression, graph.branch(graph.statement(statement.ThenStatement, next), graph.statement(statement.ElseStatement, next)))
	case ast.KindReturnStatement:
		return graph.expression(node.Expression(), graph.returnTo)
	case ast.KindThrowStatement:
		return graph.expression(node.Expression(), graph.throwTo)
	case ast.KindBreakStatement, ast.KindContinueStatement:
		target := graph.breakTo
		if node.Kind == ast.KindContinueStatement {
			target = graph.continueTo
		}
		var label *ast.Node
		if node.Kind == ast.KindBreakStatement {
			label = node.AsBreakStatement().Label
		} else {
			label = node.AsContinueStatement().Label
		}
		if label != nil {
			pair := graph.labels[label.Text()]
			target = pair[0]
			if node.Kind == ast.KindContinueStatement {
				target = pair[1]
			}
		}
		return target
	case ast.KindForStatement, ast.KindForInStatement, ast.KindForOfStatement, ast.KindWhileStatement, ast.KindDoStatement:
		return graph.loop(node, next)
	case ast.KindLabeledStatement:
		statement := node.AsLabeledStatement()
		previous, existed := graph.labels[statement.Label.Text()]
		graph.labels[statement.Label.Text()] = [2]*UsageEvent{next, graph.continueTo}
		entry := graph.statement(statement.Statement, next)
		if existed {
			graph.labels[statement.Label.Text()] = previous
		} else {
			delete(graph.labels, statement.Label.Text())
		}
		return entry
	case ast.KindTryStatement:
		return graph.tryStatement(node, next)
	case ast.KindSwitchStatement:
		statement := node.AsSwitchStatement()
		previousBreak := graph.breakTo
		graph.breakTo = next
		clauses := statement.CaseBlock.AsCaseBlock().Clauses.Nodes
		fallthroughEntry := next
		entries := make([]*UsageEvent, len(clauses))
		hasDefault := false
		for index := len(clauses) - 1; index >= 0; index-- {
			clause := clauses[index]
			var statements []*ast.Node
			if clause.Kind == ast.KindCaseClause {
				statements = clause.AsCaseOrDefaultClause().Statements.Nodes
			} else {
				hasDefault = true
				statements = clause.AsCaseOrDefaultClause().Statements.Nodes
			}
			fallthroughEntry = graph.sequence(statements, fallthroughEntry)
			entries[index] = fallthroughEntry
		}
		selection := next
		if hasDefault {
			for index, clause := range clauses {
				if clause.Kind == ast.KindDefaultClause {
					selection = entries[index]
				}
			}
		}
		for index, clause := range slices.Backward(clauses) {
			if clause.Kind == ast.KindCaseClause {
				selection = graph.expression(clause.Expression(), graph.branch(entries[index], selection))
			}
		}
		graph.breakTo = previousBreak
		return graph.expression(statement.Expression, selection)
	case ast.KindFunctionDeclaration, ast.KindClassStaticBlockDeclaration, ast.KindInterfaceDeclaration, ast.KindTypeAliasDeclaration, ast.KindImportDeclaration, ast.KindImportEqualsDeclaration, ast.KindExportDeclaration:
		return next
	case ast.KindClassDeclaration:
		return graph.classExpression(node, next)
	}
	return graph.expression(node, next)
}

func (graph *UsageGraph) loop(node *ast.Node, next *UsageEvent) *UsageEvent {
	head := graph.event(nil, nil, false, false, nil)
	previousBreak, previousContinue := graph.breakTo, graph.continueTo
	graph.breakTo, graph.continueTo = next, head
	var body, initializer, condition, incrementor, iterable *ast.Node
	switch node.Kind {
	case ast.KindForStatement:
		loop := node.AsForStatement()
		body, initializer, condition, incrementor = loop.Statement, loop.Initializer, loop.Condition, loop.Incrementor
		graph.continueTo = graph.expression(incrementor, head)
	case ast.KindForInStatement:
		loop := node.AsForInOrOfStatement()
		body, initializer, iterable = loop.Statement, loop.Initializer, loop.Expression
	case ast.KindForOfStatement:
		loop := node.AsForInOrOfStatement()
		body, initializer, iterable = loop.Statement, loop.Initializer, loop.Expression
	case ast.KindWhileStatement:
		loop := node.AsWhileStatement()
		body, condition = loop.Statement, loop.Expression
	case ast.KindDoStatement:
		loop := node.AsDoStatement()
		body, condition = loop.Statement, loop.Expression
	}
	if node.Parent.Kind == ast.KindLabeledStatement {
		graph.labels[node.Parent.AsLabeledStatement().Label.Text()] = [2]*UsageEvent{next, graph.continueTo}
	}
	bodyEntry := graph.statement(body, graph.continueTo)
	if iterable != nil {
		pattern := initializer
		if pattern.Kind == ast.KindVariableDeclarationList {
			pattern = pattern.AsVariableDeclarationList().Declarations.Nodes[0].Name()
		}
		bodyEntry = graph.pattern(pattern, bodyEntry, node, true)
	}
	selection := graph.branch(bodyEntry, next)
	if node.Kind == ast.KindForStatement && condition == nil {
		selection = bodyEntry
	}
	head.Next = []*UsageEvent{graph.expression(condition, selection)}
	graph.breakTo, graph.continueTo = previousBreak, previousContinue
	if node.Kind == ast.KindDoStatement {
		return bodyEntry
	}
	if iterable != nil {
		return graph.expression(iterable, head)
	}
	if initializer != nil {
		if initializer.Kind == ast.KindVariableDeclarationList {
			return graph.statement(initializer, head)
		}
		return graph.expression(initializer, head)
	}
	return head
}

func (graph *UsageGraph) tryStatement(node *ast.Node, next *UsageEvent) *UsageEvent {
	statement := node.AsTryStatement()
	previousReturn, previousThrow := graph.returnTo, graph.throwTo
	previousBreak, previousContinue := graph.breakTo, graph.continueTo
	if statement.FinallyBlock != nil {
		// Abrupt completion inside finally replaces the pending completion; it
		// must target the outer context rather than another copy of finally.
		returnTo := graph.statement(statement.FinallyBlock, previousReturn)
		throwTo := graph.statement(statement.FinallyBlock, previousThrow)
		breakTo, continueTo := previousBreak, previousContinue
		if previousBreak != nil {
			breakTo = graph.statement(statement.FinallyBlock, previousBreak)
		}
		if previousContinue != nil {
			continueTo = graph.statement(statement.FinallyBlock, previousContinue)
		}
		next = graph.statement(statement.FinallyBlock, next)
		graph.returnTo, graph.throwTo = returnTo, throwTo
		graph.breakTo, graph.continueTo = breakTo, continueTo
	}
	catchEntry := graph.throwTo
	if statement.CatchClause != nil {
		catchEntry = graph.statement(statement.CatchClause.AsCatchClause().Block, next)
	}
	graph.throwTo = catchEntry
	protected := graph.protected
	graph.protected = true
	tryEntry := graph.statement(statement.TryBlock, next)
	graph.protected = protected
	graph.returnTo, graph.throwTo = previousReturn, previousThrow
	graph.breakTo, graph.continueTo = previousBreak, previousContinue
	return tryEntry
}

func (graph *UsageGraph) classExpression(node *ast.Node, next *UsageEvent) *UsageEvent {
	members := node.Members()
	for _, member := range slices.Backward(members) {
		name := member.Name()
		if name != nil && name.Kind == ast.KindComputedPropertyName {
			next = graph.expression(name.Expression(), next)
		}
	}
	for _, heritage := range ast.GetExtendsHeritageClauseElements(node) {
		next = graph.expression(heritage.Expression(), next)
	}
	return next
}

func (graph *UsageGraph) pattern(node *ast.Node, next *UsageEvent, assignment *ast.Node, writes bool) *UsageEvent {
	if node == nil {
		return next
	}
	switch node.Kind {
	case ast.KindIdentifier:
		if writes {
			event := graph.event(node, graph.model.Binding(node), false, true, next)
			event.Assignment = assignment
			return event
		}
		return next
	case ast.KindObjectBindingPattern, ast.KindArrayBindingPattern:
		elements := node.AsBindingPattern().Elements.Nodes
		for _, element := range slices.Backward(elements) {
			next = graph.pattern(element, next, assignment, writes)
		}
		return next
	case ast.KindBindingElement:
		next = graph.pattern(node.Name(), next, assignment, writes)
		if node.Initializer() != nil {
			next = graph.branch(next, graph.expression(node.Initializer(), next))
		}
		if name := node.AsBindingElement().PropertyName; name != nil && name.Kind == ast.KindComputedPropertyName {
			next = graph.expression(name.Expression(), next)
		}
		return next
	case ast.KindParenthesizedExpression:
		return graph.pattern(node.Expression(), next, assignment, writes)
	case ast.KindObjectLiteralExpression:
		properties := node.AsObjectLiteralExpression().Properties.Nodes
		for _, property := range slices.Backward(properties) {
			next = graph.pattern(property, next, assignment, writes)
		}
		return next
	case ast.KindArrayLiteralExpression:
		elements := node.AsArrayLiteralExpression().Elements.Nodes
		for _, element := range slices.Backward(elements) {
			next = graph.pattern(element, next, assignment, writes)
		}
		return next
	case ast.KindPropertyAssignment:
		next = graph.pattern(node.Initializer(), next, assignment, writes)
		if node.Name().Kind == ast.KindComputedPropertyName {
			next = graph.expression(node.Name().Expression(), next)
		}
		return next
	case ast.KindShorthandPropertyAssignment:
		next = graph.pattern(node.Name(), next, assignment, writes)
		if initializer := node.AsShorthandPropertyAssignment().ObjectAssignmentInitializer; initializer != nil {
			next = graph.branch(next, graph.expression(initializer, next))
		}
		return next
	case ast.KindSpreadElement, ast.KindSpreadAssignment:
		return graph.pattern(node.Expression(), next, assignment, writes)
	case ast.KindBinaryExpression:
		binary := node.AsBinaryExpression()
		if binary.OperatorToken.Kind == ast.KindEqualsToken {
			next = graph.pattern(binary.Left, next, assignment, writes)
			return graph.branch(next, graph.expression(binary.Right, next))
		}
	case ast.KindPropertyAccessExpression, ast.KindElementAccessExpression:
		return graph.address(node, next, true)
	}
	return next
}

func (graph *UsageGraph) address(node *ast.Node, next *UsageEvent, skipAtomic bool) *UsageEvent {
	if node.Kind == ast.KindIdentifier {
		event := graph.event(node, graph.model.Binding(node), true, false, graph.mayThrow(next))
		event.AtomicSkipRead = skipAtomic
		return event
	}
	if node.Kind == ast.KindPropertyAccessExpression || node.Kind == ast.KindElementAccessExpression {
		next = graph.mayThrow(next)
		if node.Kind == ast.KindElementAccessExpression {
			next = graph.expression(node.AsElementAccessExpression().ArgumentExpression, next)
		}
		return graph.address(node.Expression(), next, skipAtomic)
	}
	return graph.expression(node, next)
}

func UsageLogical(kind ast.Kind) bool {
	return kind == ast.KindAmpersandAmpersandToken || kind == ast.KindBarBarToken || kind == ast.KindQuestionQuestionToken || kind == ast.KindAmpersandAmpersandEqualsToken || kind == ast.KindBarBarEqualsToken || kind == ast.KindQuestionQuestionEqualsToken
}

func UsageBase(node *ast.Node) *ast.Node {
	for node.Kind == ast.KindPropertyAccessExpression || node.Kind == ast.KindElementAccessExpression || node.Kind == ast.KindParenthesizedExpression {
		node = node.Expression()
	}
	return node
}

func (graph *UsageGraph) expression(node *ast.Node, next *UsageEvent) *UsageEvent {
	if node == nil || ast.IsTypeNode(node) {
		return next
	}
	if ast.IsFunctionLike(node) {
		return next
	}
	switch node.Kind {
	case ast.KindIdentifier:
		if usageReferenceNode(node) {
			return graph.event(node, graph.model.Binding(node), true, false, graph.mayThrow(next))
		}
		return next
	case ast.KindClassExpression:
		return graph.classExpression(node, next)
	case ast.KindParenthesizedExpression, ast.KindAsExpression, ast.KindTypeAssertionExpression, ast.KindNonNullExpression, ast.KindSatisfiesExpression:
		return graph.expression(node.Expression(), next)
	case ast.KindAwaitExpression, ast.KindYieldExpression:
		resume := graph.mayThrow(next)
		if node.Kind == ast.KindYieldExpression {
			resume = graph.branch(next, graph.throwTo, graph.returnTo)
		}
		event := graph.event(node, nil, false, false, resume)
		event.Suspend = true
		return graph.expression(node.Expression(), event)
	case ast.KindConditionalExpression:
		conditional := node.AsConditionalExpression()
		return graph.expression(conditional.Condition, graph.branch(graph.expression(conditional.WhenTrue, next), graph.expression(conditional.WhenFalse, next)))
	case ast.KindBinaryExpression:
		binary := node.AsBinaryExpression()
		kind := binary.OperatorToken.Kind
		if kind >= ast.KindFirstAssignment && kind <= ast.KindLastAssignment {
			check := graph.event(node, nil, false, false, graph.pattern(binary.Left, next, node, true))
			check.Targets = []*ast.Node{binary.Left}
			right := graph.expression(binary.Right, check)
			if UsageLogical(kind) {
				right = graph.branch(right, next)
			}
			if binary.Left.Kind == ast.KindIdentifier {
				if kind != ast.KindEqualsToken {
					return graph.event(binary.Left, graph.model.Binding(binary.Left), true, false, graph.mayThrow(right))
				}
				return graph.mayThrow(right)
			}
			if binary.Left.Kind == ast.KindPropertyAccessExpression || binary.Left.Kind == ast.KindElementAccessExpression {
				return graph.address(binary.Left, right, kind == ast.KindEqualsToken)
			}
			return right
		}
		if UsageLogical(kind) {
			return graph.expression(binary.Left, graph.branch(graph.expression(binary.Right, next), next))
		}
		return graph.expression(binary.Left, graph.expression(binary.Right, next))
	case ast.KindPrefixUnaryExpression, ast.KindPostfixUnaryExpression:
		var operand *ast.Node
		var operator ast.Kind
		if node.Kind == ast.KindPrefixUnaryExpression {
			operand, operator = node.AsPrefixUnaryExpression().Operand, node.AsPrefixUnaryExpression().Operator
		} else {
			operand, operator = node.AsPostfixUnaryExpression().Operand, node.AsPostfixUnaryExpression().Operator
		}
		if operator == ast.KindPlusPlusToken || operator == ast.KindMinusMinusToken {
			return graph.expression(operand, graph.pattern(operand, next, node, true))
		}
		return graph.expression(operand, next)
	case ast.KindPropertyAccessExpression:
		return graph.expression(node.Expression(), graph.mayThrow(next))
	case ast.KindElementAccessExpression:
		return graph.expression(node.Expression(), graph.expression(node.AsElementAccessExpression().ArgumentExpression, graph.mayThrow(next)))
	case ast.KindShorthandPropertyAssignment:
		return graph.expression(node.Name(), next)
	case ast.KindPropertyAssignment:
		next = graph.expression(node.Initializer(), next)
		if node.Name().Kind == ast.KindComputedPropertyName {
			next = graph.expression(node.Name().Expression(), next)
		}
		return next
	}
	if node.Kind == ast.KindCallExpression || node.Kind == ast.KindNewExpression {
		next = graph.mayThrow(next)
	}
	var children []*ast.Node
	node.ForEachChild(func(child *ast.Node) bool { children = append(children, child); return false })
	for _, child := range slices.Backward(children) {
		next = graph.expression(child, next)
	}
	return next
}
