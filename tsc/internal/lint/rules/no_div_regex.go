package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noDivRegex struct{ context Context }

func newNoDivRegex(context Context) Rule {
	rule := &noDivRegex{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindRegularExpressionLiteral},
	}
}

func (rule *noDivRegex) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindRegularExpressionLiteral {
		return true
	}
	start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
	raw := rule.context.File.Text()[start:node.End()]
	if strings.HasPrefix(raw, "/=") {
		diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.A_regular_expression_literal_can_be_confused_with_Slash)
		if rule.context.NewTracker != nil {
			tracker := rule.context.NewTracker()
			tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start+1, start+2), "[=]")
			diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("no-div-regex", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "no-div-regex"), "no-div-regex", ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "no-div-regex")))
		}
	}
	return true
}
