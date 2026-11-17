package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type maxLinesRule struct {
	context Context
}

func (rule *maxLinesRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindSourceFile {
		return true
	}
	count := helpers.SyntaxLineCount(rule.context, node, helpers.BooleanOptionValue(helpers.SyntaxObject(rule.context, 0), "skipComments", false), helpers.BooleanOptionValue(helpers.SyntaxObject(rule.context, 0), "skipBlankLines", false))
	if maximum := helpers.SyntaxMaximum(rule.context, 300); count > maximum {
		rule.context.Report(rule.context.Range(node), diagnostics.File_has_too_many_lines_0_Maximum_allowed_is_1, count, maximum)
	}
	return true
}

func (rule *maxLinesRule) OnExitNode(node *ast.Node) {
}

func newMaxLines(context Context) Rule {
	return &maxLinesRule{context: context}
}
