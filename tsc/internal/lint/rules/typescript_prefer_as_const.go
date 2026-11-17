package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptPreferAsConstRule struct {
	helpers.DiagnosticSuggestions
	context Context
}

func (rule *typescriptPreferAsConstRule) OnEnterNode(node *ast.Node) bool {
	rule.asConst(node)
	return true
}

func (rule *typescriptPreferAsConstRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptPreferAsConstRule) asConst(node *ast.Node) {
	var value, annotation *ast.Node
	fix := false
	switch node.Kind {
	case ast.KindAsExpression, ast.KindTypeAssertionExpression:
		value, annotation, fix = node.Expression(), node.Type(), true
	case ast.KindVariableDeclaration, ast.KindPropertyDeclaration:
		value, annotation = node.Initializer(), node.Type()
	default:
		return
	}
	if value == nil || annotation == nil {
		return
	}
	value = ast.SkipParentheses(value)
	typeNode := annotation
	for typeNode.Kind == ast.KindParenthesizedType {
		typeNode = typeNode.Type()
	}
	if typeNode.Kind != ast.KindLiteralType || !helpers.TypescriptEnumLiteral(value) || !helpers.TypescriptEnumLiteral(typeNode.AsLiteralTypeNode().Literal) || rule.Text(value) != rule.Text(typeNode.AsLiteralTypeNode().Literal) {
		return
	}
	if fix {
		diagnostic := rule.context.Report(rule.context.Range(typeNode), diagnostics.Expected_a_const_instead_of_a_literal_type_assertion)
		rule.fix(diagnostic, rule.Start(typeNode), typeNode.End(), "const")
		return
	}
	diagnostic := rule.context.Report(rule.context.Range(typeNode), diagnostics.Expected_a_const_assertion_instead_of_a_literal_type_annotation)
	colon := helpers.TsAnnotationColon(rule.context, node)
	tracker := rule.context.NewTracker()
	tracker.DeleteRange(rule.context.File, core.NewTextRange(colon, annotation.End()))
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(value.End(), value.End()), " as const")
	rule.AddSuggestion(diagnostic, "@typescript-eslint/prefer-as-const", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.You_should_use_as_const_instead_of_type_annotation))
}

func (rule *typescriptPreferAsConstRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[rule.Start(node):node.End()]
}

func (rule *typescriptPreferAsConstRule) fix(diagnostic *ast.Diagnostic, start, end int, text string) {
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), text)
	const name = "@typescript-eslint/prefer-as-const"
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "prefer-as-const"), name, ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "prefer-as-const")))
}

func (rule *typescriptPreferAsConstRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func newTypeScriptPreferAsConst(context Context) Rule {
	return &typescriptPreferAsConstRule{context: context}
}
