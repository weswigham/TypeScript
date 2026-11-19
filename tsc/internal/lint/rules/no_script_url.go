package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noScriptUrl struct {
	context Context
}

func newNoScriptUrl(context Context) Rule {
	rule := &noScriptUrl{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindNoSubstitutionTemplateLiteral, ast.KindStringLiteral},
	}
}

func (rule *noScriptUrl) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindStringLiteral || node.Kind == ast.KindNoSubstitutionTemplateLiteral && (node.Parent == nil || node.Parent.Kind != ast.KindTaggedTemplateExpression) {
		text, prefix := node.Text(), "javascript:"
		matches := len(text) >= len(prefix)
		if matches {
			for index := range len(prefix) {
				character := text[index]
				if character >= 'A' && character <= 'Z' {
					character += 'a' - 'A'
				}
				if character != prefix[index] {
					matches = false
					break
				}
			}
		}
		if matches {
			rule.context.Report(rule.context.Range(node), diagnostics.Script_URL_is_a_form_of_eval)
		}
	}
	return true
}
