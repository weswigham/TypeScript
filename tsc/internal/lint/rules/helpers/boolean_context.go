package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

func SemanticStrictNullChecks(context Context) bool {
	if context.CompilerOptions == nil {
		return true
	}
	if context.CompilerOptions.StrictNullChecks.IsFalse() {
		return false
	}
	return context.CompilerOptions.StrictNullChecks.IsTrue() || context.CompilerOptions.Strict.IsTrue()
}

func SemanticConditionTest(node *ast.Node) (*ast.Node, bool) {
	switch node.Kind {
	case ast.KindIfStatement:
		return node.AsIfStatement().Expression, false
	case ast.KindConditionalExpression:
		return node.AsConditionalExpression().Condition, false
	case ast.KindWhileStatement:
		return node.AsWhileStatement().Expression, true
	case ast.KindDoStatement:
		return node.AsDoStatement().Expression, true
	case ast.KindForStatement:
		return node.AsForStatement().Condition, true
	}
	return nil, false
}

func SemanticNegation(node *ast.Node) bool {
	return node != nil && node.Kind == ast.KindPrefixUnaryExpression && node.AsPrefixUnaryExpression().Operator == ast.KindExclamationToken
}

func SemanticExpressionParent(node *ast.Node) *ast.Node {
	for node.Parent != nil && node.Parent.Kind == ast.KindParenthesizedExpression {
		node = node.Parent
	}
	return node.Parent
}

func SemanticArrayType(context Context, value *checker.Type) bool {
	if value.IsUnion() || value.IsIntersection() {
		for _, part := range value.Types() {
			if SemanticArrayType(context, part) {
				return true
			}
		}
	}
	return context.GetChecker().IsArrayType(value) || checker.IsTupleType(value)
}

func SemanticPredicateCallback(context Context, node *ast.Node) *ast.Node {
	if node.Kind != ast.KindCallExpression || len(node.Arguments()) == 0 {
		return nil
	}
	member := ast.SkipParentheses(node.Expression())
	var name string
	if member.Kind == ast.KindPropertyAccessExpression {
		name = member.Name().Text()
	}
	if member.Kind == ast.KindElementAccessExpression {
		value := SemanticTypeAtLocation(context, member.AsElementAccessExpression().ArgumentExpression)
		if value.Flags()&checker.TypeFlagsStringLiteral != 0 {
			name, _ = value.AsLiteralType().Value().(string)
		}
	}
	switch name {
	case "every", "filter", "find", "findIndex", "findLast", "findLastIndex", "some":
		if SemanticArrayType(context, SemanticTypeAtLocation(context, member.Expression())) {
			return node.Arguments()[0]
		}
	}
	return nil
}

func SemanticAssertionArgument(context Context, node *ast.Node) (*ast.Node, *checker.TypePredicate) {
	signature := context.GetChecker().GetResolvedSignature(node)
	if signature == nil {
		return nil, nil
	}
	predicate := context.GetChecker().GetTypePredicateOfSignature(signature)
	if predicate == nil || predicate.Kind() != checker.TypePredicateKindIdentifier && predicate.Kind() != checker.TypePredicateKindAssertsIdentifier {
		return nil, nil
	}
	for index, argument := range node.Arguments() {
		if argument.Kind == ast.KindSpreadElement {
			return nil, nil
		}
		if int32(index) == predicate.ParameterIndex() {
			return argument, predicate
		}
	}
	return nil, nil
}

func SemanticOnlyTruthiness(node *ast.Node) bool {
	parent := SemanticExpressionParent(node)
	if parent != nil && parent.Kind == ast.KindBinaryExpression && parent.AsBinaryExpression().OperatorToken.Kind == ast.KindAmpersandAmpersandToken && ast.SkipParentheses(parent.AsBinaryExpression().Left) == ast.SkipParentheses(node) {
		return true
	}
	return SemanticInCondition(node)
}

func SemanticStrongExpression(node *ast.Node) bool {
	switch node.Kind {
	case ast.KindIdentifier, ast.KindPropertyAccessExpression, ast.KindElementAccessExpression,
		ast.KindCallExpression, ast.KindNewExpression, ast.KindParenthesizedExpression,
		ast.KindTrueKeyword, ast.KindFalseKeyword, ast.KindNullKeyword, ast.KindStringLiteral,
		ast.KindNumericLiteral, ast.KindNoSubstitutionTemplateLiteral, ast.KindPrefixUnaryExpression:
		return true
	}
	return false
}

func SemanticWrappedExpression(context Context, node *ast.Node) string {
	text := SemanticSourceText(context, node)
	if !SemanticStrongExpression(node) {
		return "(" + text + ")"
	}
	return text
}

func SemanticInCondition(node *ast.Node) bool {
	parent := node.Parent
	if parent == nil {
		return false
	}
	if parent.Kind == ast.KindParenthesizedExpression || parent.Kind == ast.KindPrefixUnaryExpression && parent.AsPrefixUnaryExpression().Operator == ast.KindExclamationToken {
		return SemanticInCondition(parent) || parent.Kind == ast.KindPrefixUnaryExpression
	}
	if parent.Kind == ast.KindBinaryExpression {
		operator := parent.AsBinaryExpression().OperatorToken.Kind
		if operator == ast.KindAmpersandAmpersandToken || operator == ast.KindBarBarToken {
			return SemanticInCondition(parent)
		}
	}
	switch parent.Kind {
	case ast.KindIfStatement:
		return parent.AsIfStatement().Expression == node
	case ast.KindWhileStatement:
		return parent.AsWhileStatement().Expression == node
	case ast.KindDoStatement:
		return parent.AsDoStatement().Expression == node
	case ast.KindForStatement:
		return parent.AsForStatement().Condition == node
	case ast.KindConditionalExpression:
		return parent.AsConditionalExpression().Condition == node
	}
	return false
}

func SemanticRequireStrictNullChecks(context Context) {
	if !SemanticStrictNullChecks(context) && !SemanticBooleanOption(context, "allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing", false) {
		context.Report(
			core.NewTextRange(0, 0), diagnostics.This_rule_requires_the_strictNullChecks_compiler_option_to_be_turned_on_to_function_correctly)
	}
}
