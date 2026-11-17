package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type UsageRuleContext struct {
	Context     Context
	Model       UsageModel
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func (rule *UsageRuleContext) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *UsageRuleContext) options() map[string]any {
	if len(rule.Context.Options) > 0 {
		options, _ := rule.Context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func (rule *UsageRuleContext) Boolean(name string) bool {
	value, _ := rule.options()[name].(bool)
	return value
}

func (rule *UsageRuleContext) Setting(name, fallback string) string {
	if value, ok := rule.options()[name].(string); ok {
		return value
	}
	return fallback
}

func (rule *UsageRuleContext) AddSuggestion(diagnostic *ast.Diagnostic, changes []*codefix.CodeFixAction) {
	if len(changes) == 0 {
		return
	}
	if rule.suggestions == nil {
		rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	rule.suggestions[diagnostic] = changes
}

func (rule *UsageRuleContext) Text(node *ast.Node) string {
	return rule.Context.File.Text()[scanner.GetTokenPosOfNode(node, rule.Context.File, false):node.End()]
}
