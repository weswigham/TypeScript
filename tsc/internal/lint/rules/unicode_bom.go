package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type unicodeBomRule struct {
	context Context
}

func newUnicodeBom(context Context) Rule {
	rule := &unicodeBomRule{context: context}
	return Rule{
		Enter: rule.OnEnterNode,
	}
}

func (rule *unicodeBomRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindSourceFile {
		hasBOM := strings.HasPrefix(rule.context.File.Text(), "\uFEFF")
		if hasBOM && rule.option(0, "never") == "never" {
			diagnostic := rule.context.Report(
				core.NewTextRange(0, 0), diagnostics.Unexpected_Unicode_BOM_Byte_Order_Mark)

			rule.fix(diagnostic, 0, len("\uFEFF"), "")
		} else if !hasBOM && rule.option(0, "never") == "always" {
			diagnostic := rule.context.Report(
				core.NewTextRange(0, 0), diagnostics.Expected_Unicode_BOM_Byte_Order_Mark)

			rule.fix(diagnostic, 0, 0, "\uFEFF")
		}
		return false
	}
	return true
}

func (rule *unicodeBomRule) fix(diagnostic *ast.Diagnostic, start, end int, replacement string) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), replacement)
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("unicode-bom", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "unicode-bom"), "unicode-bom", ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "unicode-bom")))
}

func (rule *unicodeBomRule) option(index int, fallback string) string {
	if index < len(rule.context.Options) {
		if value, ok := rule.context.Options[index].(string); ok {
			return value
		}
	}
	return fallback
}
