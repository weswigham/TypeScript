package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noConsoleRule struct {
	helpers.DiagnosticSuggestions
	context Context
}

func newNoConsoleRule(context Context) Rule {
	rule := &noConsoleRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindPropertyAccessExpression, ast.KindElementAccessExpression},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *noConsoleRule) OnEnterNode(node *ast.Node) bool {
	rule.checkConsole(node)
	return true
}

func (rule *noConsoleRule) checkConsole(node *ast.Node) {
	if !ast.IsAccessExpression(node) {
		return
	}
	object := ast.SkipParentheses(node.Expression())
	if object.Kind != ast.KindIdentifier || object.Text() != "console" || !helpers.StatementBuiltin(rule.context, object, false) {
		return
	}
	var allowed []string
	if len(rule.context.Options) > 0 {
		if options, ok := rule.context.Options[0].(map[string]any); ok {
			if methods, ok := options["allow"].([]any); ok {
				for _, method := range methods {
					if name, ok := method.(string); ok {
						allowed = append(allowed, name)
					}
				}
			}
		}
	}
	name, known := helpers.StaticMemberNameText(node)
	if known && slices.Contains(allowed, name) {
		return
	}
	var diagnostic *ast.Diagnostic
	if len(allowed) != 0 {
		diagnostic = rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_console_statement_Only_these_console_methods_are_allowed_Colon_0, strings.Join(allowed, ", "))
	} else {
		diagnostic = rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_console_statement)
	}
	if rule.context.NewTracker == nil {
		return
	}
	callee, call := helpers.OuterParenthesizedNodeAndParent(node)
	if call == nil || call.Kind != ast.KindCallExpression || call.Expression() != callee {
		return
	}
	_, statement := helpers.OuterParenthesizedNodeAndParent(call)
	if statement == nil || statement.Kind != ast.KindExpressionStatement || statement.Parent == nil {
		return
	}
	if parentKind := statement.Parent.Kind; parentKind != ast.KindSourceFile && parentKind != ast.KindBlock && parentKind != ast.KindCaseClause && parentKind != ast.KindDefaultClause {
		return
	}
	file := rule.context.File
	start := scanner.GetTokenPosOfNode(statement, file, false)
	before := astnav.FindPrecedingToken(file, start)
	lexer := scanner.GetScannerForSourceFile(file, statement.End())
	lexer.SetSkipTrivia(true)
	lexer.ResetPos(statement.End())
	after := lexer.Scan()
	if before != nil && after != ast.KindEndOfFile && before.Kind != ast.KindColonToken && before.Kind != ast.KindSemicolonToken && before.Kind != ast.KindOpenBraceToken && after != ast.KindPlusPlusToken && after != ast.KindMinusMinusToken {
		if text := file.Text()[lexer.TokenStart():lexer.TokenEnd()]; strings.ContainsRune("-[(/+`", rune(text[0])) {
			return
		}
	}
	description := ast.NewCompilerDiagnostic(diagnostics.Remove_the_console_method_call)
	if node.Kind == ast.KindPropertyAccessExpression {
		description = ast.NewCompilerDiagnostic(diagnostics.Remove_the_console_0, node.Name().Text())
	}
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(file, core.NewTextRange(start, statement.End()), "")
	rule.AddSuggestion(diagnostic, "no-console", tracker.GetTextChanges(), description)
}
