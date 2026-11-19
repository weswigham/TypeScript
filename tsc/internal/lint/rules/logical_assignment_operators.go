package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type logicalAssignmentOperatorsRule struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
	model       *helpers.TsScopeModel
}

func newLogicalAssignmentOperators(context Context) Rule {
	rule := &logicalAssignmentOperatorsRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindBinaryExpression, ast.KindIfStatement},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *logicalAssignmentOperatorsRule) OnEnterNode(node *ast.Node) bool {
	rule.logicalAssignment(node)

	return true
}

func (rule *logicalAssignmentOperatorsRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *logicalAssignmentOperatorsRule) cannotBeGetter(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	return node.Kind == ast.KindIdentifier && !rule.insideWith(node)
}

func (rule *logicalAssignmentOperatorsRule) conditionalFix(diagnostic *ast.Diagnostic, node *ast.Node, safe bool, description *diagnostics.Message, operator string, build func(*change.Tracker)) {
	if rule.context.NewTracker == nil || rule.internalComments(node) {
		return
	}
	tracker := rule.context.NewTracker()
	build(tracker)
	changes := tracker.GetTextChanges()
	if len(changes) == 0 {
		return
	}
	action := codefix.CreateCodeFixAction("logical-assignment-operators", changes, ast.NewCompilerDiagnostic(description, operator), "logical-assignment-operators", ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "logical-assignment-operators"))
	if safe {
		diagnostic.SetCodeFixes(action)
	} else {
		if rule.suggestions == nil {
			rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
		}
		rule.suggestions[diagnostic] = append(rule.suggestions[diagnostic], action)
	}
}

func (rule *logicalAssignmentOperatorsRule) existence(node *ast.Node) (*ast.Node, string) {
	node = ast.SkipParentheses(node)
	base, operator := node, "&&"
	if base.Kind == ast.KindPrefixUnaryExpression && base.AsPrefixUnaryExpression().Operator == ast.KindExclamationToken {
		base, operator = ast.SkipParentheses(base.AsPrefixUnaryExpression().Operand), "||"
	}
	if styleReference(base) {
		return base, operator
	}
	if base.Kind == ast.KindPrefixUnaryExpression && base.AsPrefixUnaryExpression().Operator == ast.KindExclamationToken && styleReference(base.AsPrefixUnaryExpression().Operand) {
		return ast.SkipParentheses(base.AsPrefixUnaryExpression().Operand), "&&"
	}
	if base.Kind == ast.KindCallExpression && !ast.IsOptionalChain(base) && len(base.Arguments()) == 1 {
		callee := ast.SkipParentheses(base.Expression())
		if callee.Kind == ast.KindIdentifier && callee.Text() == "Boolean" && rule.globalReference(callee) && styleReference(base.Arguments()[0]) {
			return ast.SkipParentheses(base.Arguments()[0]), operator
		}
	}
	if reference, nullish := rule.nullishComparison(node, ast.KindEqualsEqualsToken); reference != nil && nullish > 0 {
		return reference, "??"
	}
	if styleLogicalOperator(node) == "||" {
		binary := node.AsBinaryExpression()
		left, leftNullish := rule.nullishComparison(binary.Left, ast.KindEqualsEqualsEqualsToken)
		right, rightNullish := rule.nullishComparison(binary.Right, ast.KindEqualsEqualsEqualsToken)
		if left != nil && right != nil && leftNullish+rightNullish == 3 && styleSame(left, right) {
			return left, "??"
		}
	}
	return nil, ""
}

func (rule *logicalAssignmentOperatorsRule) globalReference(node *ast.Node) bool {
	if rule.model == nil {
		rule.model = helpers.NewTScopeModel(rule.context)
	}
	binding := rule.model.Nodes[node].Find(node.Text())
	return binding == nil || !binding.Value
}

func (rule *logicalAssignmentOperatorsRule) insideWith(node *ast.Node) bool {
	if helpers.SharedScopeStrict(rule.context.File.AsNode()) {
		return false
	}
	for current := node; current.Parent != nil; current = current.Parent {
		if current.Parent.Kind == ast.KindWithStatement && current.Parent.AsWithStatement().Statement == current {
			return true
		}
	}
	return false
}

func (rule *logicalAssignmentOperatorsRule) internalComments(node *ast.Node) bool {
	if !rule.context.NewTracker().NodeHasComments(rule.context.File, node) {
		return false
	}
	previousEnd := rule.Start(node)
	for token := astnav.GetTokenAtPosition(rule.context.File, previousEnd); token != nil && token.Pos() < node.End(); token = astnav.FindNextToken(token, rule.context.File.AsNode(), rule.context.File) {
		start := rule.Start(token)
		if start >= node.End() {
			break
		}
		lexer := scanner.GetScannerForSourceFile(rule.context.File, previousEnd)
		lexer.SetSkipTrivia(false)
		lexer.ResetPos(previousEnd)
		for kind := lexer.Scan(); lexer.TokenStart() < start && kind != ast.KindEndOfFile; kind = lexer.Scan() {
			if kind == ast.KindSingleLineCommentTrivia || kind == ast.KindMultiLineCommentTrivia {
				return true
			}
		}
		previousEnd = token.End()
	}
	return false
}

func (rule *logicalAssignmentOperatorsRule) logicalAssignment(node *ast.Node) {
	if node.Kind == ast.KindIfStatement {
		if rule.option(0, "always") == "always" && helpers.BooleanOptionValue(rule.options(1), "enforceForIfStatements", false) {
			rule.logicalIf(node)
		}
		return
	}
	if node.Kind != ast.KindBinaryExpression {
		return
	}
	binary := node.AsBinaryExpression()
	if rule.option(0, "always") == "never" {
		operator := scanner.TokenToString(binary.OperatorToken.Kind)
		if operator != "||=" && operator != "&&=" && operator != "??=" {
			return
		}
		diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_logical_operator_assignment_0_shorthand, operator)
		rule.conditionalFix(diagnostic, node, rule.cannotBeGetter(binary.Left), diagnostics.Separate_the_logical_assignment_into_an_assignment_with_a_logical_operator, "", func(tracker *change.Tracker) {
			logical := strings.TrimSuffix(operator, "=")
			tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(rule.Start(binary.OperatorToken), binary.OperatorToken.End()), "= "+rule.Text(ast.SkipParentheses(binary.Left))+" "+logical)
			precedence := ast.OperatorPrecedenceLogicalOR
			if logical == "&&" {
				precedence = ast.OperatorPrecedenceLogicalAND
			}
			right := binary.Right
			if right.Kind != ast.KindParenthesizedExpression && (ast.GetExpressionPrecedence(right) <= precedence || operator == "??=" && styleLogicalOperator(right) != "" || right.Kind == ast.KindAsExpression || right.Kind == ast.KindSatisfiesExpression) {
				tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(rule.Start(right), rule.Start(right)), "(")
				tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(right.End(), right.End()), ")")
			}
		})
		return
	}
	if binary.OperatorToken.Kind == ast.KindEqualsToken {
		right := ast.SkipParentheses(binary.Right)
		operator := styleLogicalOperator(right)
		if operator == "" {
			return
		}
		leftmost := right
		for styleLogicalOperator(leftmost) == operator {
			left := leftmost.AsBinaryExpression().Left
			if styleLogicalOperator(left) != operator {
				break
			}
			leftmost = left
		}
		if !styleSame(binary.Left, leftmost.AsBinaryExpression().Left) {
			return
		}
		diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Assignment_can_be_replaced_with_operator_assignment_0, operator+"=")
		rule.conditionalFix(diagnostic, node, rule.cannotBeGetter(binary.Left), diagnostics.Convert_this_assignment_to_use_the_operator_0, operator+"=", func(tracker *change.Tracker) {
			tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(rule.Start(binary.OperatorToken), rule.Start(binary.OperatorToken)), operator)
			tracker.DeleteRange(rule.context.File, core.NewTextRange(rule.Start(leftmost), rule.Start(leftmost.AsBinaryExpression().Right)))
		})
		return
	}
	operator := styleLogicalOperator(node)
	right := ast.SkipParentheses(binary.Right)
	if operator == "" || right.Kind != ast.KindBinaryExpression || right.AsBinaryExpression().OperatorToken.Kind != ast.KindEqualsToken || !styleReference(binary.Left) || !styleSame(binary.Left, right.AsBinaryExpression().Left) {
		return
	}
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Logical_expression_can_be_replaced_with_an_assignment_0, operator+"=")
	rule.conditionalFix(diagnostic, node, rule.cannotBeGetter(binary.Left) || rule.singleProperty(binary.Left), diagnostics.Replace_this_logical_expression_with_an_assignment_with_the_operator_0, operator+"=", func(tracker *change.Tracker) {
		assignment := right.AsBinaryExpression()
		result := rule.Text(right)
		offset := rule.Start(assignment.OperatorToken) - rule.Start(right)
		result = result[:offset] + operator + result[offset:]
		parent := node.Parent
		parenthesize := parent != nil && parent.Kind != ast.KindParenthesizedExpression && parent.Kind != ast.KindExpressionStatement
		if parenthesize {
			switch parent.Kind {
			case ast.KindVariableDeclaration, ast.KindReturnStatement, ast.KindThrowStatement, ast.KindCallExpression, ast.KindNewExpression, ast.KindArrayLiteralExpression, ast.KindPropertyAssignment, ast.KindParameter:
				parenthesize = false
			case ast.KindBinaryExpression:
				parenthesize = ast.GetExpressionPrecedence(parent) > ast.OperatorPrecedenceAssignment
			case ast.KindConditionalExpression:
				parenthesize = parent.AsConditionalExpression().Condition == node
			}
		}
		if parenthesize {
			result = "(" + result + ")"
		}
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(rule.Start(node), node.End()), result)
	})
}

func (rule *logicalAssignmentOperatorsRule) logicalIf(node *ast.Node) {
	statement := node.AsIfStatement()
	if statement.ElseStatement != nil {
		return
	}
	body := statement.ThenStatement
	hasBlock := body.Kind == ast.KindBlock
	if hasBlock {
		if len(body.AsBlock().Statements.Nodes) != 1 {
			return
		}
		body = body.AsBlock().Statements.Nodes[0]
	}
	if body.Kind != ast.KindExpressionStatement {
		return
	}
	assignment := ast.SkipParentheses(body.Expression())
	if assignment.Kind != ast.KindBinaryExpression || assignment.AsBinaryExpression().OperatorToken.Kind != ast.KindEqualsToken {
		return
	}
	reference, operator := rule.existence(statement.Expression)
	if reference == nil || !styleSame(reference, assignment.AsBinaryExpression().Left) {
		return
	}
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.X_if_statement_can_be_replaced_with_a_logical_operator_assignment_with_operator_0, operator+"=")
	safe := rule.cannotBeGetter(reference) || styleLogicalOperator(ast.SkipParentheses(statement.Expression)) == "" && rule.singleProperty(reference)
	rule.conditionalFix(diagnostic, node, safe, diagnostics.Replace_this_if_statement_with_a_logical_assignment_with_operator_0, operator+"=", func(tracker *change.Tracker) {
		first := scanner.GetScannerForSourceFile(rule.context.File, rule.Start(body))
		if first.Token() == ast.KindOpenParenToken {
			previous := astnav.FindPrecedingToken(rule.context.File, rule.Start(node))
			if previous != nil && previous.Kind != ast.KindSemicolonToken && previous.Kind != ast.KindOpenBraceToken {
				return
			}
		}
		operatorToken := assignment.AsBinaryExpression().OperatorToken
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(rule.Start(operatorToken), rule.Start(operatorToken)), operator)
		tracker.DeleteRange(rule.context.File, core.NewTextRange(rule.Start(node), rule.Start(body)))
		tracker.DeleteRange(rule.context.File, core.NewTextRange(body.End(), node.End()))
		if hasBlock && !strings.HasSuffix(rule.Text(body), ";") {
			tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(node.End(), node.End()), ";")
		}
	})
}

func (rule *logicalAssignmentOperatorsRule) nullish(node *ast.Node) int {
	node = ast.SkipParentheses(node)
	if node.Kind == ast.KindNullKeyword {
		return 1
	}
	if node.Kind == ast.KindIdentifier && node.Text() == "undefined" && rule.globalReference(node) {
		return 2
	}
	if node.Kind == ast.KindVoidExpression {
		operand := ast.SkipParentheses(node.Expression())
		if operand.Kind == ast.KindNumericLiteral && operand.Text() == "0" {
			return 2
		}
	}
	return 0
}

func (rule *logicalAssignmentOperatorsRule) nullishComparison(node *ast.Node, operator ast.Kind) (*ast.Node, int) {
	node = ast.SkipParentheses(node)
	if node.Kind != ast.KindBinaryExpression || node.AsBinaryExpression().OperatorToken.Kind != operator {
		return nil, 0
	}
	binary := node.AsBinaryExpression()
	if styleReference(binary.Left) {
		return ast.SkipParentheses(binary.Left), rule.nullish(binary.Right)
	}
	if styleReference(binary.Right) {
		return ast.SkipParentheses(binary.Right), rule.nullish(binary.Left)
	}
	return nil, 0
}

func (rule *logicalAssignmentOperatorsRule) option(index int, fallback string) string {
	if index < len(rule.context.Options) {
		if value, ok := rule.context.Options[index].(string); ok {
			return value
		}
	}
	return fallback
}

func (rule *logicalAssignmentOperatorsRule) options(index int) map[string]any {
	if index < len(rule.context.Options) {
		options, _ := rule.context.Options[index].(map[string]any)
		return options
	}
	return nil
}

func (rule *logicalAssignmentOperatorsRule) singleProperty(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	if rule.insideWith(node) {
		return node.Kind == ast.KindIdentifier
	}
	if !ast.IsAccessExpression(node) || ast.IsOptionalChain(node) {
		return false
	}
	base := ast.SkipParentheses(node.Expression())
	if base.Kind != ast.KindIdentifier && base.Kind != ast.KindThisKeyword && base.Kind != ast.KindSuperKeyword {
		return false
	}
	if node.Kind == ast.KindElementAccessExpression {
		property := ast.SkipParentheses(node.AsElementAccessExpression().ArgumentExpression)
		return !ast.IsAccessExpression(property) && !ast.IsOptionalChain(property)
	}
	return true
}

func (rule *logicalAssignmentOperatorsRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func (rule *logicalAssignmentOperatorsRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[rule.Start(node):node.End()]
}

func styleLogicalOperator(node *ast.Node) string {
	if node.Kind == ast.KindBinaryExpression {
		switch node.AsBinaryExpression().OperatorToken.Kind {
		case ast.KindBarBarToken:
			return "||"
		case ast.KindAmpersandAmpersandToken:
			return "&&"
		case ast.KindQuestionQuestionToken:
			return "??"
		}
	}
	return ""
}

func styleReference(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	return node.Kind == ast.KindIdentifier && node.Text() != "undefined" || ast.IsAccessExpression(node) && !ast.IsOptionalChain(node)
}

func styleSame(left, right *ast.Node) bool {
	left, right = ast.SkipParentheses(left), ast.SkipParentheses(right)
	if ast.IsAccessExpression(left) || ast.IsAccessExpression(right) {
		if !ast.IsAccessExpression(left) || !ast.IsAccessExpression(right) || ast.IsOptionalChain(left) != ast.IsOptionalChain(right) || !styleSame(left.Expression(), right.Expression()) {
			return false
		}
		if left.Kind == ast.KindPropertyAccessExpression && right.Kind == ast.KindPropertyAccessExpression {
			return left.Name().Kind == right.Name().Kind && left.Name().Text() == right.Name().Text()
		}
		if left.Kind == ast.KindPropertyAccessExpression && left.Name().Kind == ast.KindPrivateIdentifier || right.Kind == ast.KindPropertyAccessExpression && right.Name().Kind == ast.KindPrivateIdentifier {
			return false
		}
		if name, ok := helpers.StaticMemberNameText(left); ok {
			other, known := helpers.StaticMemberNameText(right)
			return known && name == other
		}
		return left.Kind == ast.KindElementAccessExpression && right.Kind == ast.KindElementAccessExpression && styleSame(left.AsElementAccessExpression().ArgumentExpression, right.AsElementAccessExpression().ArgumentExpression)
	}
	return helpers.SameStaticReference(left, right)
}
