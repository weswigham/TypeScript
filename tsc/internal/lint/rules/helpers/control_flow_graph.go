package helpers

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/jsnum"
)

func ControlFlowLoopCondition(node *ast.Node) *ast.Node {
	switch node.Kind {
	case ast.KindWhileStatement:
		return node.AsWhileStatement().Expression
	case ast.KindDoStatement:
		return node.AsDoStatement().Expression
	case ast.KindForStatement:
		return node.AsForStatement().Condition
	}
	return nil
}

func controlFlowLoopBody(node *ast.Node) *ast.Node {
	switch node.Kind {
	case ast.KindWhileStatement:
		return node.AsWhileStatement().Statement
	case ast.KindDoStatement:
		return node.AsDoStatement().Statement
	case ast.KindForStatement:
		return node.AsForStatement().Statement
	case ast.KindForInStatement, ast.KindForOfStatement:
		return node.AsForInOrOfStatement().Statement
	}
	return nil
}

type ControlFlowSegment struct {
	Node     *ast.Node
	Op       ast.Kind
	previous []*ControlFlowSegment
	State    uint8
}

type controlFlowExit struct {
	kind     ast.Kind
	node     *ast.Node
	label    string
	segments []*ControlFlowSegment
}

type controlFlowResult struct {
	normal []*ControlFlowSegment
	exits  []controlFlowExit
}

type ControlFlowLoop struct {
	Node        *ast.Node
	Entry, Back []*ControlFlowSegment
}

type ControlFlowCase struct {
	Node, Next *ast.Node
	End        []*ControlFlowSegment
}

type ControlFlowGraph struct {
	context          Context
	transfer         func(*ControlFlowSegment, uint8) uint8
	Owner            *ast.Node
	Segments         []*ControlFlowSegment
	Statements       map[*ast.Node][]*ControlFlowSegment
	Loops            []ControlFlowLoop
	Cases            []ControlFlowCase
	Returns          []*ControlFlowSegment
	exceptions       []*ControlFlowSegment
	root             *ast.Node
	result           controlFlowResult
	returnCompletion bool
	loopLabels       map[*ast.Node][]string
}

func (graph *ControlFlowGraph) segment(node *ast.Node, op ast.Kind, previous []*ControlFlowSegment) []*ControlFlowSegment {
	segment := &ControlFlowSegment{Node: node, Op: op, previous: append([]*ControlFlowSegment(nil), previous...)}
	graph.Segments = append(graph.Segments, segment)
	return []*ControlFlowSegment{segment}
}

func controlFlowJoin(left, right []*ControlFlowSegment) []*ControlFlowSegment {
	return append(append([]*ControlFlowSegment(nil), left...), right...)
}

func (graph *ControlFlowGraph) build() {
	graph.Statements = make(map[*ast.Node][]*ControlFlowSegment)
	entry := graph.segment(nil, ast.KindUnknown, nil)
	entry[0].State = 1
	var result controlFlowResult
	if graph.root != nil {
		result = graph.statement(graph.root, entry, "")
	} else if graph.Owner.Kind == ast.KindSourceFile {
		result = graph.sequence(graph.Owner.AsSourceFile().Statements.Nodes, entry)
	} else {
		if ast.IsFunctionLike(graph.Owner) {
			for _, parameter := range graph.Owner.Parameters() {
				entry = graph.expression(parameter.Initializer(), entry)
			}
		}
		result = graph.statement(graph.Owner.Body(), entry, "")
	}
	graph.result = result
	graph.Returns = result.normal
	for _, exit := range result.exits {
		if exit.kind == ast.KindReturnStatement {
			graph.Returns = controlFlowJoin(graph.Returns, exit.segments)
		}
	}
	for changed := true; changed; {
		changed = false
		for _, segment := range graph.Segments[1:] {
			var state uint8
			for _, previous := range segment.previous {
				state |= previous.State
			}
			if graph.transfer != nil {
				state = graph.transfer(segment, state)
			}
			if state != segment.State {
				segment.State = state
				changed = true
			}
		}
	}
}

func (graph *ControlFlowGraph) sequence(nodes []*ast.Node, entry []*ControlFlowSegment) controlFlowResult {
	result := controlFlowResult{normal: entry}
	for _, node := range nodes {
		next := graph.statement(node, result.normal, "")
		result.normal = next.normal
		result.exits = append(result.exits, next.exits...)
	}
	return result
}

func (graph *ControlFlowGraph) expression(node *ast.Node, entry []*ControlFlowSegment) []*ControlFlowSegment {
	if node == nil || ast.IsTypeNode(node) {
		return entry
	}
	if ast.IsFunctionLike(node) {
		return entry
	}
	if ast.IsClassLike(node) {
		for _, base := range ast.GetExtendsHeritageClauseElements(node) {
			entry = graph.expression(base.Expression(), entry)
		}
		for _, member := range node.Members() {
			if name := member.Name(); name != nil && name.Kind == ast.KindComputedPropertyName {
				entry = graph.expression(name.Expression(), entry)
			}
		}
		return entry
	}
	switch node.Kind {
	case ast.KindConditionalExpression:
		expression := node.AsConditionalExpression()
		entry = graph.expression(expression.Condition, entry)
		return controlFlowJoin(graph.expression(expression.WhenTrue, entry), graph.expression(expression.WhenFalse, entry))
	case ast.KindBinaryExpression:
		expression := node.AsBinaryExpression()
		entry = graph.expression(expression.Left, entry)
		right := graph.expression(expression.Right, entry)
		if ast.IsLogicalOrCoalescingBinaryOperator(expression.OperatorToken.Kind) || controlFlowLogicalAssignment(expression.OperatorToken.Kind) {
			return controlFlowJoin(entry, right)
		}
		return right
	case ast.KindPropertyAccessExpression:
		entry = graph.expression(node.Expression(), entry)
	case ast.KindPropertyAssignment:
		if node.Name().Kind == ast.KindComputedPropertyName {
			entry = graph.expression(node.Name().Expression(), entry)
		}
		return graph.expression(node.Initializer(), entry)
	case ast.KindVariableDeclaration, ast.KindParameter, ast.KindBindingElement:
		entry = graph.expression(node.Initializer(), entry)
		if name := node.Name(); name != nil && ast.IsBindingPattern(name) {
			entry = graph.expression(name, entry)
		}
		return entry
	case ast.KindCallExpression:
		call := node.AsCallExpression()
		if call.Expression.Kind != ast.KindSuperKeyword {
			entry = graph.expression(call.Expression, entry)
		}
		beforeArguments := entry
		if call.Arguments != nil {
			for _, argument := range call.Arguments.Nodes {
				entry = graph.expression(argument, entry)
			}
		}
		graph.exceptions = controlFlowJoin(graph.exceptions, entry)
		if call.Expression.Kind == ast.KindSuperKeyword {
			return graph.segment(node, ast.KindSuperKeyword, entry)
		}
		if node.Flags&ast.NodeFlagsOptionalChain != 0 {
			return controlFlowJoin(beforeArguments, entry)
		}
		return entry
	default:
		node.ForEachChild(func(child *ast.Node) bool { entry = graph.expression(child, entry); return false })
	}
	if node.Kind == ast.KindIdentifier && (node.Parent == nil || node.Parent.Name() != node) || node.Kind == ast.KindPropertyAccessExpression || node.Kind == ast.KindElementAccessExpression || node.Kind == ast.KindNewExpression || node.Kind == ast.KindYieldExpression || node.Kind == ast.KindAwaitExpression {
		graph.exceptions = controlFlowJoin(graph.exceptions, entry)
	}
	if node.Kind == ast.KindThisKeyword || node.Kind == ast.KindSuperKeyword {
		return graph.segment(node, ast.KindThisKeyword, entry)
	}
	return entry
}

func (graph *ControlFlowGraph) statement(node *ast.Node, entry []*ControlFlowSegment, label string) controlFlowResult {
	if node == nil {
		return controlFlowResult{normal: entry}
	}
	entry = graph.segment(node, ast.KindUnknown, entry)
	graph.Statements[node] = append(graph.Statements[node], entry...)
	switch node.Kind {
	case ast.KindBlock:
		return graph.sequence(node.AsBlock().Statements.Nodes, entry)
	case ast.KindSourceFile:
		return graph.sequence(node.AsSourceFile().Statements.Nodes, entry)
	case ast.KindFunctionDeclaration, ast.KindImportDeclaration, ast.KindInterfaceDeclaration, ast.KindTypeAliasDeclaration:
		return controlFlowResult{normal: entry}
	case ast.KindReturnStatement, ast.KindThrowStatement:
		if node.Kind == ast.KindReturnStatement && node.Expression() != nil {
			entry = graph.segment(node, ast.KindReturnStatement, entry)
		}
		entry = graph.expression(node.Expression(), entry)
		return controlFlowResult{exits: []controlFlowExit{{kind: node.Kind, node: node, segments: entry}}}
	case ast.KindBreakStatement, ast.KindContinueStatement:
		var target *ast.Node
		if node.Kind == ast.KindBreakStatement {
			target = node.AsBreakStatement().Label
		} else {
			target = node.AsContinueStatement().Label
		}
		name := ""
		if target != nil {
			name = target.Text()
		}
		return controlFlowResult{exits: []controlFlowExit{{kind: node.Kind, node: node, label: name, segments: entry}}}
	case ast.KindIfStatement:
		statement := node.AsIfStatement()
		entry = graph.expression(statement.Expression, entry)
		left := graph.statement(statement.ThenStatement, entry, "")
		right := graph.statement(statement.ElseStatement, entry, "")
		return controlFlowResult{normal: controlFlowJoin(left.normal, right.normal), exits: append(left.exits, right.exits...)}
	case ast.KindLabeledStatement:
		statement := node.AsLabeledStatement()
		target := statement.Statement
		for target.Kind == ast.KindLabeledStatement {
			target = target.AsLabeledStatement().Statement
		}
		if ast.IsIterationStatement(target, false) {
			if graph.loopLabels == nil {
				graph.loopLabels = make(map[*ast.Node][]string)
			}
			graph.loopLabels[target] = append(graph.loopLabels[target], statement.Label.Text())
		}
		result := graph.statement(statement.Statement, entry, statement.Label.Text())
		var exits []controlFlowExit
		for _, exit := range result.exits {
			if exit.kind == ast.KindBreakStatement && exit.label == statement.Label.Text() {
				result.normal = controlFlowJoin(result.normal, exit.segments)
			} else {
				exits = append(exits, exit)
			}
		}
		result.exits = exits
		return result
	case ast.KindWhileStatement, ast.KindDoStatement, ast.KindForStatement, ast.KindForInStatement, ast.KindForOfStatement:
		return graph.loop(node, entry, label)
	case ast.KindTryStatement:
		return graph.tryStatement(node, entry)
	case ast.KindSwitchStatement:
		return graph.switchStatement(node, entry)
	case ast.KindWithStatement:
		entry = graph.expression(node.Expression(), entry)
		return graph.statement(node.AsWithStatement().Statement, entry, "")
	default:
		return controlFlowResult{normal: graph.expression(node, entry)}
	}
}

func (graph *ControlFlowGraph) loop(node *ast.Node, entry []*ControlFlowSegment, label string) controlFlowResult {
	if node.Kind == ast.KindForStatement {
		entry = graph.expression(node.AsForStatement().Initializer, entry)
	}
	if node.Kind == ast.KindForInStatement || node.Kind == ast.KindForOfStatement {
		entry = graph.expression(node.Expression(), entry)
	}
	head := graph.segment(nil, ast.KindUnknown, entry)
	condition := ControlFlowLoopCondition(node)
	bodyEntry := head
	if node.Kind != ast.KindDoStatement {
		bodyEntry = graph.expression(condition, head)
	}
	if node.Kind == ast.KindForInStatement || node.Kind == ast.KindForOfStatement {
		bodyEntry = graph.expression(node.AsForInOrOfStatement().Initializer, bodyEntry)
	}
	truth := controlFlowLoopTruth(graph.context, condition)
	if node.Kind == ast.KindForInStatement || node.Kind == ast.KindForOfStatement {
		truth = 0
	}
	conditionExit := bodyEntry
	if graph.returnCompletion && truth == -1 && node.Kind != ast.KindDoStatement {
		bodyEntry = nil
	}
	body := graph.statement(controlFlowLoopBody(node), bodyEntry, "")
	back := body.normal
	result := controlFlowResult{}
	for _, exit := range body.exits {
		targetsLoop := exit.label == "" || exit.label == label || slices.Contains(graph.loopLabels[node], exit.label)
		if exit.kind == ast.KindBreakStatement && targetsLoop {
			result.normal = controlFlowJoin(result.normal, exit.segments)
		} else if exit.kind == ast.KindContinueStatement && targetsLoop {
			back = controlFlowJoin(back, exit.segments)
		} else {
			result.exits = append(result.exits, exit)
		}
	}
	graph.Loops = append(graph.Loops, ControlFlowLoop{Node: node, Entry: entry, Back: back})
	if node.Kind == ast.KindForStatement {
		back = graph.expression(node.AsForStatement().Incrementor, back)
	}
	if node.Kind == ast.KindDoStatement {
		back = graph.expression(condition, back)
	}
	if truth != -1 {
		head[0].previous = controlFlowJoin(head[0].previous, back)
	}
	if truth != 1 {
		if node.Kind == ast.KindDoStatement {
			result.normal = controlFlowJoin(result.normal, back)
		} else {
			result.normal = controlFlowJoin(result.normal, conditionExit)
		}
	}
	return result
}

func (graph *ControlFlowGraph) tryStatement(node *ast.Node, entry []*ControlFlowSegment) controlFlowResult {
	statement := node.AsTryStatement()
	outer := graph.exceptions
	graph.exceptions = nil
	result := graph.statement(statement.TryBlock, entry, "")
	thrown := graph.exceptions
	var exits []controlFlowExit
	for _, exit := range result.exits {
		if exit.kind == ast.KindThrowStatement {
			thrown = controlFlowJoin(thrown, exit.segments)
		} else {
			exits = append(exits, exit)
		}
	}
	result.exits = exits
	graph.exceptions = nil
	if statement.CatchClause != nil {
		caught := graph.statement(statement.CatchClause.AsCatchClause().Block, thrown, "")
		result.normal = controlFlowJoin(result.normal, caught.normal)
		result.exits = append(result.exits, caught.exits...)
		thrown = graph.exceptions
	}
	result.exits = append(result.exits, controlFlowExit{kind: ast.KindThrowStatement, segments: thrown})
	graph.exceptions = outer
	if statement.FinallyBlock == nil {
		graph.exceptions = controlFlowJoin(graph.exceptions, thrown)
		return result
	}
	final := graph.statement(statement.FinallyBlock, result.normal, "")
	for _, exit := range result.exits {
		if len(exit.segments) == 0 {
			continue
		}
		completed := graph.statement(statement.FinallyBlock, exit.segments, "")
		final.exits = append(final.exits, completed.exits...)
		exit.segments = completed.normal
		final.exits = append(final.exits, exit)
		if exit.kind == ast.KindThrowStatement {
			graph.exceptions = controlFlowJoin(graph.exceptions, completed.normal)
		}
	}
	return final
}

func (graph *ControlFlowGraph) switchStatement(node *ast.Node, entry []*ControlFlowSegment) controlFlowResult {
	statement := node.AsSwitchStatement()
	entry = graph.expression(statement.Expression, entry)
	clauses := statement.CaseBlock.AsCaseBlock().Clauses.Nodes
	entries := make([][]*ControlFlowSegment, len(clauses))
	defaultIndex := -1
	for index, clause := range clauses {
		if clause.Kind == ast.KindDefaultClause {
			defaultIndex = index
			continue
		}
		entry = graph.expression(clause.Expression(), entry)
		entries[index] = entry
	}
	result := controlFlowResult{}
	if defaultIndex < 0 {
		result.normal = entry
	} else {
		entries[defaultIndex] = entry
	}
	var previous []*ControlFlowSegment
	for index, clause := range clauses {
		body := graph.sequence(clause.AsCaseOrDefaultClause().Statements.Nodes, controlFlowJoin(entries[index], previous))
		previous = body.normal
		for _, exit := range body.exits {
			if exit.kind == ast.KindBreakStatement && exit.label == "" {
				result.normal = controlFlowJoin(result.normal, exit.segments)
			} else {
				result.exits = append(result.exits, exit)
			}
		}
		if index+1 < len(clauses) {
			graph.Cases = append(graph.Cases, ControlFlowCase{Node: clause, Next: clauses[index+1], End: previous})
		}
	}
	result.normal = controlFlowJoin(result.normal, previous)
	return result
}

func controlFlowLoopTruth(_ Context, node *ast.Node) int {
	if node == nil {
		return 1
	}
	return controlFlowLiteralTruth(ast.SkipParentheses(node))
}

func controlFlowLiteralTruth(node *ast.Node) int {
	truth := false
	switch node.Kind {
	case ast.KindTrueKeyword, ast.KindRegularExpressionLiteral:
		truth = true
	case ast.KindFalseKeyword, ast.KindNullKeyword:
		truth = false
	case ast.KindNumericLiteral:
		number := jsnum.FromString(node.Text())
		truth = number != 0 && !number.IsNaN()
	case ast.KindBigIntLiteral:
		digits := strings.TrimSuffix(node.Text(), "n")
		if len(digits) >= 2 && digits[0] == '0' && strings.ContainsRune("xXoObB", rune(digits[1])) {
			digits = digits[2:]
		}
		for _, digit := range digits {
			if digit >= '1' && digit <= '9' || digit >= 'a' && digit <= 'f' || digit >= 'A' && digit <= 'F' {
				truth = true
			}
		}
	case ast.KindStringLiteral:
		truth = node.Text() != ""
	default:
		return 0
	}
	if truth {
		return 1
	}
	return -1
}

func controlFlowLogicalAssignment(operator ast.Kind) bool {
	return operator == ast.KindAmpersandAmpersandEqualsToken || operator == ast.KindBarBarEqualsToken || operator == ast.KindQuestionQuestionEqualsToken
}

func ControlFlowState(segments []*ControlFlowSegment) uint8 {
	var state uint8
	for _, segment := range segments {
		state |= segment.State
	}
	return state
}

func ControlFlowInput(segment *ControlFlowSegment) uint8 { return ControlFlowState(segment.previous) }

func ControlFlowBase(node *ast.Node) *ast.Node {
	if node.Kind != ast.KindConstructor || node.Parent == nil || !ast.IsClassLike(node.Parent) {
		return nil
	}
	bases := ast.GetExtendsHeritageClauseElements(node.Parent)
	if len(bases) == 0 {
		return nil
	}
	return bases[0].Expression()
}
