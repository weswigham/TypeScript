package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
)

func SemanticSameExpression(context Context, left, right *ast.Node, similarMembers bool) bool {
	if left == nil || right == nil {
		return left == right
	}
	left, right = ast.SkipParentheses(left), ast.SkipParentheses(right)
	if left.Kind == ast.KindNonNullExpression {
		left = ast.SkipParentheses(left.Expression())
	}
	if right.Kind == ast.KindNonNullExpression {
		right = ast.SkipParentheses(right.Expression())
	}
	member := func(node *ast.Node) bool {
		return node.Kind == ast.KindPropertyAccessExpression || node.Kind == ast.KindElementAccessExpression
	}
	if similarMembers && member(left) && member(right) {
		if !SemanticSameExpression(context, left.Expression(), right.Expression(), true) {
			return false
		}
		key := func(node *ast.Node) *ast.Node {
			if node.Kind == ast.KindElementAccessExpression {
				return node.AsElementAccessExpression().ArgumentExpression
			}
			return node.Name()
		}
		leftKey, rightKey := key(left), key(right)
		if left.Kind != right.Kind {
			if left.Kind == ast.KindElementAccessExpression {
				return ast.SkipParentheses(leftKey).Kind == ast.KindStringLiteral && leftKey.Text() == rightKey.Text()
			}
			return ast.SkipParentheses(rightKey).Kind == ast.KindStringLiteral && rightKey.Text() == leftKey.Text()
		}
		return SemanticSameExpression(context, leftKey, rightKey, false)
	}
	if left.Kind != right.Kind {
		return false
	}
	switch left.Kind {
	case ast.KindIdentifier, ast.KindPrivateIdentifier:
		return left.Text() == right.Text() && (left.Parent != nil && ast.IsDeclarationName(left) || context.GetChecker().GetSymbolAtLocation(left) == context.GetChecker().GetSymbolAtLocation(right))
	case ast.KindStringLiteral, ast.KindNumericLiteral, ast.KindBigIntLiteral, ast.KindNoSubstitutionTemplateLiteral:
		return left.Text() == right.Text()
	case ast.KindObjectLiteralExpression, ast.KindArrayLiteralExpression, ast.KindArrowFunction, ast.KindFunctionExpression, ast.KindClassExpression, ast.KindNewExpression, ast.KindYieldExpression, ast.KindPostfixUnaryExpression:
		return false
	case ast.KindPrefixUnaryExpression:
		if left.AsPrefixUnaryExpression().Operator != right.AsPrefixUnaryExpression().Operator || left.AsPrefixUnaryExpression().Operator == ast.KindPlusPlusToken || left.AsPrefixUnaryExpression().Operator == ast.KindMinusMinusToken {
			return false
		}
	case ast.KindBinaryExpression:
		operator := left.AsBinaryExpression().OperatorToken.Kind
		if operator != right.AsBinaryExpression().OperatorToken.Kind || operator >= ast.KindFirstAssignment && operator <= ast.KindLastAssignment {
			return false
		}
	case ast.KindPropertyAccessExpression:
		if left.Name().Kind == ast.KindPrivateIdentifier || right.Name().Kind == ast.KindPrivateIdentifier {
			return false
		}
		if left.Expression().Kind == ast.KindParenthesizedExpression && ast.IsOptionalChain(ast.SkipParentheses(left.Expression())) || right.Expression().Kind == ast.KindParenthesizedExpression && ast.IsOptionalChain(ast.SkipParentheses(right.Expression())) {
			return false
		}
	}
	var leftChildren, rightChildren []*ast.Node
	left.ForEachChild(func(child *ast.Node) bool {
		if child.Kind != ast.KindQuestionDotToken {
			leftChildren = append(leftChildren, child)
		}
		return false
	})
	right.ForEachChild(func(child *ast.Node) bool {
		if child.Kind != ast.KindQuestionDotToken {
			rightChildren = append(rightChildren, child)
		}
		return false
	})
	if len(leftChildren) != len(rightChildren) {
		return false
	}
	for index := range leftChildren {
		if !SemanticSameExpression(context, leftChildren[index], rightChildren[index], similarMembers) {
			return false
		}
	}
	return true
}

func SemanticNullishKind(context Context, node *ast.Node) checker.TypeFlags {
	node = ast.SkipParentheses(node)
	if node.Kind == ast.KindNullKeyword {
		return checker.TypeFlagsNull
	}
	if node.Kind == ast.KindIdentifier && SemanticTypeAtLocation(context, node).Flags() == checker.TypeFlagsUndefined {
		return checker.TypeFlagsUndefined
	}
	return 0
}
