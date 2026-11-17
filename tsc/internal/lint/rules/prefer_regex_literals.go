package rules

import (
	"strings"
	"unicode/utf8"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type preferRegexLiterals struct{ helpers.RegexSource }

func (rule *preferRegexLiterals) OnEnterNode(node *ast.Node) bool {
	input := rule.Input(node)
	if input != nil && !input.Literal {
		rule.preferLiteral(input)
	}
	return true
}

func (rule *preferRegexLiterals) literalString(node *ast.Node) (string, bool) {
	if node == nil {
		return "", false
	}
	node = ast.SkipParentheses(node)
	if node.Kind == ast.KindStringLiteral || node.Kind == ast.KindNoSubstitutionTemplateLiteral || node.Kind == ast.KindTaggedTemplateExpression {
		return rule.StaticString(node, 0)
	}
	return "", false
}

func (rule *preferRegexLiterals) literalSafe(node *ast.Node, pattern, flags string, restrictASCII bool) bool {
	if !scanner.ParseRegExpLint(pattern, flags).Valid {
		return false
	}
	if restrictASCII {
		for _, character := range pattern {
			if character > 127 || !strings.ContainsRune("-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_\\[](){} \t\r\n\v\f!@#$%^&*+=/~`.><?,'\"|:;", character) {
				return false
			}
		}
	}
	previous := astnav.FindPrecedingToken(rule.Context.File, rule.Start(node))
	if previous != nil {
		allowed := strings.Fields("( ; [ , = + * - ? ~ % ** ! typeof instanceof && || ?? return ... delete void in < > <= >= == === != !== << >> >>> & | ^ : { => *= <<= >>= >>>= ^= |= &= ??= ||= &&= **= += -= /= %= / do break continue debugger case throw")
		valid := false
		for _, token := range allowed {
			valid = valid || token == rule.Text(previous)
		}
		if !valid {
			return false
		}
	}
	lexer := scanner.NewScanner()
	lexer.SetText(rule.Text(node))
	lexer.SetSkipTrivia(false)
	for token := lexer.Scan(); token != ast.KindEndOfFile; token = lexer.Scan() {
		if token == ast.KindSingleLineCommentTrivia || token == ast.KindMultiLineCommentTrivia {
			return false
		}
		if (token == ast.KindSlashToken || token == ast.KindSlashEqualsToken) && node != nil {
			var skip *ast.Node
			var visit func(*ast.Node)
			visit = func(child *ast.Node) {
				if child.Kind == ast.KindRegularExpressionLiteral && rule.Start(child)-rule.Start(node) == lexer.TokenStart() {
					skip = child
					return
				}
				child.ForEachChild(func(descendant *ast.Node) bool { visit(descendant); return false })
			}
			visit(node)
			if skip != nil {
				lexer.ResetPos(skip.End() - rule.Start(node))
			}
		}
	}
	return true
}

func (rule *preferRegexLiterals) literalSuggestion(diagnostic *ast.Diagnostic, input *helpers.RegexInput, pattern string, flags string, description *ast.Diagnostic, restrictASCII bool) {
	if !rule.literalSafe(input.Node, pattern, flags, restrictASCII) {
		return
	}
	replacement := helpers.RenderRegExpLiteral(pattern, flags)
	start, end := rule.Start(input.Node), input.Node.End()
	text := rule.Context.File.Text()
	if start > 0 {
		previous, _ := utf8.DecodeLastRuneInString(text[:start])
		if previous == '/' || scanner.IsIdentifierPart(previous) {
			replacement = " " + replacement
		}
	}
	if end < len(text) {
		next, _ := utf8.DecodeRuneInString(text[end:])
		if next == '/' || scanner.IsIdentifierPart(next) {
			replacement += " "
		}
	}
	rule.Edit(diagnostic, "prefer-regex-literals", start, end, replacement, description, true)
}

func (rule *preferRegexLiterals) preferLiteral(input *helpers.RegexInput) {
	if len(input.Arguments) < 1 || len(input.Arguments) > 2 {
		return
	}
	pattern, known := rule.literalString(input.PatternNode)
	flags := ""
	if input.FlagsNode != nil {
		var ok bool
		flags, ok = rule.literalString(input.FlagsNode)
		if !ok {
			return
		}
	}
	message := diagnostics.Use_a_regular_expression_literal_instead_of_the_RegExp_constructor
	redundant, originalFlags := false, ""
	if !known {
		if !rule.Option("disallowRedundantWrapping") || input.PatternNode.Kind != ast.KindRegularExpressionLiteral {
			return
		}
		literal := rule.Input(input.PatternNode)
		pattern, flags, known = literal.Pattern, literal.Flags, true
		redundant, originalFlags = true, literal.Flags
		message = diagnostics.Regular_expression_literal_is_unnecessarily_wrapped_within_a_RegExp_constructor
		if input.FlagsNode != nil {
			flags, _ = rule.literalString(input.FlagsNode)
			message = diagnostics.Use_regular_expression_literal_with_flags_instead_of_the_RegExp_constructor
		}
	}
	if !known {
		return
	}
	diagnostic := rule.Context.Report(rule.Context.Range(input.Node), message)
	description := ast.NewCompilerDiagnostic(diagnostics.Replace_with_an_equivalent_regular_expression_literal)
	if redundant && input.FlagsNode != nil {
		description = ast.NewCompilerDiagnostic(diagnostics.Replace_with_an_equivalent_regular_expression_literal_with_flags_0, flags)
	}
	rule.literalSuggestion(diagnostic, input, pattern, flags, description, !redundant)
	if redundant && input.FlagsNode != nil {
		merged := originalFlags
		for _, flag := range flags {
			if !strings.ContainsRune(merged, flag) {
				merged += string(flag)
			}
		}
		additional := false
		for _, flag := range merged {
			additional = additional || !strings.ContainsRune(flags, flag)
		}
		if additional {
			rule.literalSuggestion(diagnostic, input, pattern, merged, ast.NewCompilerDiagnostic(diagnostics.Replace_with_a_regular_expression_literal_with_flags_0, merged), false)
		}
	}
}

func newPreferRegexLiterals(context Context) Rule {
	return &preferRegexLiterals{RegexSource: helpers.NewRegexSource(context)}
}
