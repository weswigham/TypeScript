package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noTemplateCurlyInString struct {
	context Context
}

func (rule *noTemplateCurlyInString) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindStringLiteral {
		text := node.Text()
		for start := strings.Index(text, "${"); start >= 0; start = strings.Index(text, "${") {
			text = text[start+2:]
			if end := strings.IndexByte(text, '}'); end > 0 {
				rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_template_string_expression)
				break
			}
		}
	}
	return true
}

func (rule *noTemplateCurlyInString) OnExitNode(node *ast.Node) {}

func newNoTemplateCurlyInString(context Context) Rule {
	return &noTemplateCurlyInString{context: context}
}
