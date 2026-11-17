package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

var tsNoInferrableType = diagnostics.Type_0_trivially_inferred_from_a_0_literal_remove_type_annotation

type typescriptNoInferrableTypesRule struct {
	context Context
}

func tsIsNamedCall(node *ast.Node, name string) bool {
	if node.Kind != ast.KindCallExpression {
		return false
	}
	callee := ast.SkipParentheses(node.Expression())
	return callee.Kind == ast.KindIdentifier && callee.Text() == name
}

func tsInferrableType(annotation *ast.Node, initializer *ast.Node) string {
	for annotation.Kind == ast.KindParenthesizedType {
		annotation = annotation.Type()
	}
	initializer = ast.SkipParentheses(initializer)
	unwrapped := initializer
	if initializer.Kind == ast.KindPrefixUnaryExpression {
		unary := initializer.AsPrefixUnaryExpression()
		if unary.Operator == ast.KindMinusToken || unary.Operator == ast.KindPlusToken && annotation.Kind == ast.KindNumberKeyword {
			unwrapped = ast.SkipParentheses(unary.Operand)
		}
	}
	switch annotation.Kind {
	case ast.KindBigIntKeyword:
		if tsIsNamedCall(unwrapped, "BigInt") {
			return "bigint"
		}
		switch unwrapped.Kind {
		case ast.KindBigIntLiteral, ast.KindNumericLiteral, ast.KindStringLiteral, ast.KindRegularExpressionLiteral, ast.KindTrueKeyword, ast.KindFalseKeyword, ast.KindNullKeyword:
			return "bigint"
		}
	case ast.KindBooleanKeyword:
		if initializer.Kind == ast.KindTrueKeyword || initializer.Kind == ast.KindFalseKeyword || tsIsNamedCall(initializer, "Boolean") || initializer.Kind == ast.KindPrefixUnaryExpression && initializer.AsPrefixUnaryExpression().Operator == ast.KindExclamationToken {
			return "boolean"
		}
	case ast.KindNumberKeyword:
		if unwrapped.Kind == ast.KindNumericLiteral || tsIsNamedCall(unwrapped, "Number") || unwrapped.Kind == ast.KindIdentifier && (unwrapped.Text() == "Infinity" || unwrapped.Text() == "NaN") {
			return "number"
		}
	case ast.KindLiteralType:
		if annotation.AsLiteralTypeNode().Literal.Kind == ast.KindNullKeyword && initializer.Kind == ast.KindNullKeyword {
			return "null"
		}
	case ast.KindStringKeyword:
		if initializer.Kind == ast.KindStringLiteral || initializer.Kind == ast.KindNoSubstitutionTemplateLiteral || initializer.Kind == ast.KindTemplateExpression || tsIsNamedCall(initializer, "String") {
			return "string"
		}
	case ast.KindSymbolKeyword:
		if tsIsNamedCall(initializer, "Symbol") {
			return "symbol"
		}
	case ast.KindUndefinedKeyword:
		if initializer.Kind == ast.KindVoidExpression || initializer.Kind == ast.KindIdentifier && initializer.Text() == "undefined" {
			return "undefined"
		}
	case ast.KindTypeReference:
		name := annotation.AsTypeReferenceNode().TypeName
		if name.Kind == ast.KindIdentifier && name.Text() == "RegExp" && (initializer.Kind == ast.KindRegularExpressionLiteral || tsIsNamedCall(initializer, "RegExp") || initializer.Kind == ast.KindNewExpression && ast.SkipParentheses(initializer.Expression()).Kind == ast.KindIdentifier && ast.SkipParentheses(initializer.Expression()).Text() == "RegExp") {
			return "RegExp"
		}
	}
	return ""
}

func (rule *typescriptNoInferrableTypesRule) OnEnterNode(node *ast.Node) bool {
	var options map[string]any
	if len(rule.context.Options) > 0 {
		options, _ = rule.context.Options[0].(map[string]any)
	}
	switch node.Kind {
	case ast.KindVariableDeclaration, ast.KindParameter:
		if node.Kind == ast.KindParameter && (helpers.BooleanOptionValue(options, "ignoreParameters", false) || node.Parent.Body() == nil) {
			return true
		}
	case ast.KindPropertyDeclaration:
		if helpers.BooleanOptionValue(options, "ignoreProperties", false) || node.ModifierFlags()&(ast.ModifierFlagsReadonly|ast.ModifierFlagsAbstract) != 0 || node.AsPropertyDeclaration().PostfixToken != nil && node.AsPropertyDeclaration().PostfixToken.Kind == ast.KindQuestionToken {
			return true
		}
	default:
		return true
	}
	if node.Type() == nil || node.Initializer() == nil {
		return true
	}
	typeName := tsInferrableType(node.Type(), node.Initializer())
	if typeName == "" {
		return true
	}
	diagnosticLocation := rule.context.Range(node)
	if node.Kind == ast.KindParameter {
		diagnosticLocation = core.NewTextRange(scanner.GetTokenPosOfNode(node.Name(), rule.context.File, false), node.End())
	}
	diagnostic := rule.context.Report(diagnosticLocation, tsNoInferrableType, typeName)

	colon := helpers.TsAnnotationColon(rule.context, node)
	if colon < 0 {
		return true
	}
	tracker := rule.context.NewTracker()
	tracker.DeleteRange(rule.context.File, core.NewTextRange(colon, node.Type().End()))
	var marker *ast.Node
	if node.Kind == ast.KindParameter {
		marker = node.AsParameterDeclaration().QuestionToken
	} else if node.Kind == ast.KindPropertyDeclaration {
		marker = node.AsPropertyDeclaration().PostfixToken
	}
	if marker != nil {
		tracker.DeleteRange(rule.context.File, core.NewTextRange(scanner.GetTokenPosOfNode(marker, rule.context.File, false), marker.End()))
	}
	const name = "@typescript-eslint/no-inferrable-types"
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Remove_type_annotation), name, ast.NewCompilerDiagnostic(diagnostics.Remove_inferrable_type_annotations)))
	return true
}

func (rule *typescriptNoInferrableTypesRule) OnExitNode(node *ast.Node) {}

func newTypeScriptNoInferrableTypes(context Context) Rule {
	return &typescriptNoInferrableTypesRule{context: context}
}
