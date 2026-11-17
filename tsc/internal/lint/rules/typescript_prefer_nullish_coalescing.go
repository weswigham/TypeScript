package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptPreferNullishCoalescingRule struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func (rule *typescriptPreferNullishCoalescingRule) eligible(node, test *ast.Node) bool {
	if helpers.SemanticBooleanOption(rule.context, "ignoreConditionalTests", true) && helpers.SemanticInCondition(node) {
		return false
	}
	if helpers.SemanticBooleanOption(rule.context, "ignoreBooleanCoercion", false) && rule.booleanContext(node) {
		if node.Kind != ast.KindConditionalExpression || helpers.SemanticExpressionParent(node).Kind != ast.KindCallExpression {
			return false
		}
	}
	value := helpers.SemanticTypeAtLocation(rule.context, test)
	if !helpers.SemanticNullishType(value, true) {
		return false
	}
	ignored := helpers.SemanticRuleOptions(rule.context.Options)["ignorePrimitives"]
	flags := checker.TypeFlags(0)
	for name, flag := range map[string]checker.TypeFlags{"bigint": checker.TypeFlagsBigIntLike, "boolean": checker.TypeFlagsBooleanLike, "number": checker.TypeFlagsNumberLike, "string": checker.TypeFlagsStringLike} {
		options, _ := ignored.(map[string]any)
		if ignored == true || options[name] == true {
			flags |= flag
		}
	}
	if flags == 0 {
		return true
	}
	return helpers.SemanticTypeFlags(value)&(flags|checker.TypeFlagsAny|checker.TypeFlagsUnknown) == 0
}

func (rule *typescriptPreferNullishCoalescingRule) booleanContext(node *ast.Node) bool {
	parent := helpers.SemanticExpressionParent(node)
	if parent == nil {
		return false
	}
	if parent.Kind == ast.KindBinaryExpression {
		operator := parent.AsBinaryExpression().OperatorToken.Kind
		if operator == ast.KindAmpersandAmpersandToken || operator == ast.KindBarBarToken || operator == ast.KindQuestionQuestionToken || operator == ast.KindCommaToken && ast.SkipParentheses(parent.AsBinaryExpression().Right) == ast.SkipParentheses(node) {
			return rule.booleanContext(parent)
		}
	}
	if parent.Kind == ast.KindConditionalExpression && ast.SkipParentheses(parent.AsConditionalExpression().Condition) != ast.SkipParentheses(node) {
		return rule.booleanContext(parent)
	}
	if parent.Kind != ast.KindCallExpression || len(parent.Arguments()) == 0 || parent.Expression().Kind != ast.KindIdentifier || parent.Expression().Text() != "Boolean" {
		return false
	}
	symbol := rule.context.GetChecker().GetSymbolAtLocation(parent.Expression())
	if symbol == nil {
		return true
	}
	for _, declaration := range symbol.Declarations() {
		if ast.GetSourceFileOfNode(declaration) == rule.context.File {
			return false
		}
	}
	return true
}

func preferNullishCoalescingMixed(node *ast.Node) bool {
	seen := map[*ast.Node]bool{}
	queue := []*ast.Node{node, helpers.SemanticExpressionParent(node)}
	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]
		if current == nil {
			continue
		}
		current = ast.SkipParentheses(current)
		if seen[current] || current.Kind != ast.KindBinaryExpression {
			continue
		}
		seen[current] = true
		binary := current.AsBinaryExpression()
		if binary.OperatorToken.Kind == ast.KindAmpersandAmpersandToken {
			return true
		}
		if binary.OperatorToken.Kind == ast.KindBarBarToken || binary.OperatorToken.Kind == ast.KindBarBarEqualsToken {
			queue = append(queue, binary.Left, binary.Right, helpers.SemanticExpressionParent(current))
		}
	}
	return false
}

type preferNullishCoalescingNullTest struct {
	expression              *ast.Node
	flags                   checker.TypeFlags
	negative, loose, truthy bool
}

func preferNullishCoalescingParseNullTest(context Context, node *ast.Node) (preferNullishCoalescingNullTest, bool) {
	node = ast.SkipParentheses(node)
	if helpers.SemanticNegation(node) {
		expression := ast.SkipParentheses(node.AsPrefixUnaryExpression().Operand)
		if expression.Kind == ast.KindIdentifier || expression.Kind == ast.KindPropertyAccessExpression || expression.Kind == ast.KindElementAccessExpression {
			return preferNullishCoalescingNullTest{expression: expression, negative: false, truthy: true}, true
		}
		return preferNullishCoalescingNullTest{}, false
	}
	if node.Kind == ast.KindIdentifier || node.Kind == ast.KindPropertyAccessExpression || node.Kind == ast.KindElementAccessExpression {
		return preferNullishCoalescingNullTest{expression: node, negative: true, truthy: true}, true
	}
	if node.Kind != ast.KindBinaryExpression {
		return preferNullishCoalescingNullTest{}, false
	}
	binary := node.AsBinaryExpression()
	operator := binary.OperatorToken.Kind
	if operator == ast.KindAmpersandAmpersandToken || operator == ast.KindBarBarToken {
		left, leftOK := preferNullishCoalescingParseNullTest(context, binary.Left)
		right, rightOK := preferNullishCoalescingParseNullTest(context, binary.Right)
		if !leftOK || !rightOK || left.truthy || right.truthy || left.negative != right.negative || left.negative != (operator == ast.KindAmpersandAmpersandToken) || !helpers.SemanticSameExpression(context, left.expression, right.expression, true) {
			return preferNullishCoalescingNullTest{}, false
		}
		left.flags |= right.flags
		left.loose = left.loose || right.loose
		return left, true
	}
	negative, loose := false, false
	switch operator {
	case ast.KindEqualsEqualsToken:
		loose = true
	case ast.KindExclamationEqualsToken:
		negative, loose = true, true
	case ast.KindEqualsEqualsEqualsToken:
		negative, loose = false, false
	case ast.KindExclamationEqualsEqualsToken:
		negative = true
	default:
		return preferNullishCoalescingNullTest{}, false
	}
	expression, flag := binary.Left, helpers.SemanticNullishKind(context, binary.Right)
	if flag == 0 {
		expression, flag = binary.Right, helpers.SemanticNullishKind(context, binary.Left)
	}
	if flag == 0 || helpers.SemanticNullishKind(context, expression) != 0 {
		return preferNullishCoalescingNullTest{}, false
	}
	return preferNullishCoalescingNullTest{expression: expression, flags: flag, negative: negative, loose: loose}, true
}

func (rule *typescriptPreferNullishCoalescingRule) testEligible(node *ast.Node, test preferNullishCoalescingNullTest, nonNullish *ast.Node) bool {
	if !helpers.SemanticSameExpression(rule.context, test.expression, nonNullish, true) {
		return false
	}
	if test.truthy {
		return rule.eligible(node, test.expression)
	}
	if test.loose || test.flags&(checker.TypeFlagsNull|checker.TypeFlagsUndefined) == checker.TypeFlagsNull|checker.TypeFlagsUndefined {
		return true
	}
	value := helpers.SemanticTypeAtLocation(rule.context, test.expression)
	if helpers.SemanticTypeFlags(value)&(checker.TypeFlagsAny|checker.TypeFlagsUnknown) != 0 {
		return false
	}
	missing := checker.TypeFlagsNull | checker.TypeFlagsUndefined
	missing &^= test.flags
	return helpers.SemanticTypeFlags(value)&missing == 0
}

func (rule *typescriptPreferNullishCoalescingRule) comments(start, end int) string {
	lexer := scanner.NewScanner()
	lexer.SetText(rule.context.File.Text())
	lexer.SetSkipTrivia(false)
	lexer.ResetPos(start)
	var result strings.Builder
	for lexer.TokenEnd() < end {
		kind := lexer.Scan()
		if kind == ast.KindEndOfFile {
			break
		}
		if kind == ast.KindSingleLineCommentTrivia || kind == ast.KindMultiLineCommentTrivia {
			result.WriteString(rule.context.File.Text()[lexer.TokenStart():lexer.TokenEnd()])
			result.WriteByte('\n')
		}
	}
	return result.String()
}

func (rule *typescriptPreferNullishCoalescingRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindSourceFile {
		helpers.SemanticRequireStrictNullChecks(rule.context)
	}
	if node.Kind == ast.KindBinaryExpression {
		binary := node.AsBinaryExpression()
		if binary.OperatorToken.Kind != ast.KindBarBarToken && binary.OperatorToken.Kind != ast.KindBarBarEqualsToken {
			return true
		}
		if !rule.eligible(node, binary.Left) || helpers.SemanticBooleanOption(rule.context, "ignoreMixedLogicalExpressions", false) && preferNullishCoalescingMixed(node) {
			return true
		}
		equals, description := "", "or"
		if binary.OperatorToken.Kind == ast.KindBarBarEqualsToken {
			equals, description = "=", "assignment"
		}
		report := rule.context.Report(rule.context.Range(binary.OperatorToken), diagnostics.Prefer_using_nullish_coalescing_operator_0_instead_of_a_logical_1_0_as_it_is_a_safer_operator, equals, description)
		left, right := helpers.SemanticSourceText(rule.context, binary.Left), helpers.SemanticSourceText(rule.context, binary.Right)
		if binary.Left.Kind == ast.KindBinaryExpression {
			operator := binary.Left.AsBinaryExpression().OperatorToken.Kind
			if operator == ast.KindAmpersandAmpersandToken || operator == ast.KindBarBarToken {
				left = "(" + left + ")"
			}
		}
		if binary.Right.Kind == ast.KindBinaryExpression {
			operator := binary.Right.AsBinaryExpression().OperatorToken.Kind
			if operator == ast.KindAmpersandAmpersandToken || operator == ast.KindBarBarToken {
				right = "(" + right + ")"
			}
		}
		replacement := left + " ??" + equals + " " + right
		parent := helpers.SemanticExpressionParent(node)
		if parent != nil && parent.Kind == ast.KindBinaryExpression {
			operator := parent.AsBinaryExpression().OperatorToken.Kind
			if operator == ast.KindAmpersandAmpersandToken || operator == ast.KindBarBarToken {
				replacement = "(" + replacement + ")"
			}
		}
		rule.suggest(report, node, replacement, diagnostics.Fix_to_nullish_coalescing_operator_0, equals)
	}
	if node.Kind == ast.KindConditionalExpression && !helpers.SemanticBooleanOption(rule.context, "ignoreTernaryTests", false) {
		conditional := node.AsConditionalExpression()
		test, ok := preferNullishCoalescingParseNullTest(rule.context, conditional.Condition)
		if !ok {
			return true
		}
		nonNullish, nullish := conditional.WhenTrue, conditional.WhenFalse
		if !test.negative {
			nonNullish, nullish = nullish, nonNullish
		}
		if !rule.testEligible(node, test, nonNullish) {
			return true
		}
		report := rule.context.Report(rule.context.Range(node), diagnostics.Prefer_using_nullish_coalescing_operator_0_instead_of_a_ternary_expression_as_it_is_simpler_to_read, "")
		rule.suggest(report, node, helpers.SemanticSourceText(rule.context, test.expression)+" ?? "+helpers.SemanticWrappedExpression(rule.context, nullish), diagnostics.Fix_to_nullish_coalescing_operator_0, "")
	}
	if node.Kind == ast.KindIfStatement && !helpers.SemanticBooleanOption(rule.context, "ignoreIfStatements", false) {
		statement := node.AsIfStatement()
		if statement.ElseStatement != nil {
			return true
		}
		body := statement.ThenStatement
		if body.Kind == ast.KindBlock {
			statements := body.AsBlock().Statements.Nodes
			if len(statements) != 1 {
				return true
			}
			body = statements[0]
		}
		if body.Kind != ast.KindExpressionStatement || body.Expression().Kind != ast.KindBinaryExpression {
			return true
		}
		assignment := body.Expression().AsBinaryExpression()
		if assignment.OperatorToken.Kind != ast.KindEqualsToken {
			return true
		}
		left := ast.SkipParentheses(assignment.Left)
		if left.Kind != ast.KindIdentifier && left.Kind != ast.KindPropertyAccessExpression && left.Kind != ast.KindElementAccessExpression {
			return true
		}
		test, ok := preferNullishCoalescingParseNullTest(rule.context, statement.Expression)
		if !ok || test.negative || !rule.testEligible(node, test, left) {
			return true
		}
		report := rule.context.Report(rule.context.Range(node), diagnostics.Prefer_using_nullish_coalescing_operator_0_instead_of_an_assignment_expression_as_it_is_simpler_to_read, "=")
		before := rule.comments(statement.Expression.End(), scanner.GetTokenPosOfNode(body.Expression(), rule.context.File, false))
		after := rule.comments(body.End(), node.End())
		rule.suggest(report, node, before+helpers.SemanticSourceText(rule.context, assignment.Left)+" ??= "+helpers.SemanticSourceText(rule.context, assignment.Right)+";"+after, diagnostics.Fix_to_nullish_coalescing_operator_0, "=")
	}
	return true
}

func (rule *typescriptPreferNullishCoalescingRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptPreferNullishCoalescingRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typescriptPreferNullishCoalescingRule) suggest(report *ast.Diagnostic, node *ast.Node, text string, message *diagnostics.Message, args ...any) {
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(scanner.GetTokenPosOfNode(node, rule.context.File, false), node.End()), text)
	if rule.suggestions == nil {
		rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	rule.suggestions[report] = append(rule.suggestions[report], codefix.CreateCodeFixAction("@typescript-eslint/prefer-nullish-coalescing", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(message, args...), "", nil))
}

func newTypeScriptPreferNullishCoalescing(context Context) Rule {
	return &typescriptPreferNullishCoalescingRule{context: context}
}
