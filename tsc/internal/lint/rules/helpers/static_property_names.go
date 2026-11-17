package helpers

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/jsnum"
)

func StaticMemberNameText(node *ast.Node) (string, bool) {
	var name *ast.Node
	if node.Kind == ast.KindElementAccessExpression {
		name = ast.SkipParentheses(node.AsElementAccessExpression().ArgumentExpression)
	} else if node.Kind == ast.KindBindingElement {
		name = node.AsBindingElement().PropertyName
		if name == nil {
			name = node.Name()
		}
		if name.Kind == ast.KindIdentifier {
			return name.Text(), true
		}
	} else {
		name = node.Name()
		if name == nil {
			return "", false
		}
		if name.Kind == ast.KindIdentifier {
			return name.Text(), true
		}
	}
	if name == nil {
		return "", false
	}
	if name.Kind == ast.KindComputedPropertyName {
		name = ast.SkipParentheses(name.Expression())
	}
	switch name.Kind {
	case ast.KindStringLiteral, ast.KindNoSubstitutionTemplateLiteral:
		return name.Text(), true
	case ast.KindRegularExpressionLiteral:
		raw := name.Text()
		end := strings.LastIndexByte(raw, '/')
		if end < 0 {
			return "", false
		}
		var result strings.Builder
		result.WriteString(raw[:end+1])
		for _, flag := range "dgimsuvy" {
			if strings.ContainsRune(raw[end+1:], flag) {
				result.WriteRune(flag)
			}
		}
		return result.String(), true
	case ast.KindNumericLiteral:
		return jsnum.FromString(name.Text()).String(), true
	case ast.KindBigIntLiteral:
		return strings.TrimSuffix(name.Text(), "n"), true
	case ast.KindNullKeyword:
		return "null", true
	case ast.KindTrueKeyword:
		return "true", true
	case ast.KindFalseKeyword:
		return "false", true
	}
	return "", false
}
