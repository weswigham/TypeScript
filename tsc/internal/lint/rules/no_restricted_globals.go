package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noRestrictedGlobalsRule struct{ context Context }

func newNoRestrictedGlobalsRule(context Context) Rule {
	return &noRestrictedGlobalsRule{context: context}
}

func (rule *noRestrictedGlobalsRule) OnEnterNode(node *ast.Node) bool {
	rule.checkRestrictedGlobal(node)
	return true
}

func (rule *noRestrictedGlobalsRule) OnExitNode(node *ast.Node) {}

func (rule *noRestrictedGlobalsRule) checkRestrictedGlobal(node *ast.Node) {
	options := rule.context.Options
	object := helpers.SharedRuleOptions(rule.context.Options, 0)
	if values, ok := object["globals"].([]any); ok {
		options = values
	} else if values, ok := object["globals"].([]string); ok {
		options = make([]any, len(values))
		for index, value := range values {
			options[index] = value
		}
	}
	name := ""
	reportNode := node
	if helpers.SharedBindingReference(node) && helpers.StatementBuiltin(rule.context, node, false) {
		name = node.Text()
	} else if ast.IsAccessExpression(node) && helpers.SharedRuleBool(object, "checkGlobalObject", false) {
		base := ast.SkipParentheses(node.Expression())
		for ast.IsAccessExpression(base) {
			inner := ast.SkipParentheses(base.Expression())
			if inner.Kind == ast.KindIdentifier && inner.Text() == helpers.StatementPropertyName(base) {
				base = inner
				break
			}
			if helpers.StatementPropertyName(base) != helpers.StatementPropertyName(inner) {
				return
			}
			base = inner
		}
		if base.Kind != ast.KindIdentifier || !helpers.StatementBuiltin(rule.context, base, true) || !slices.Contains(append([]string{"globalThis", "self", "window"}, helpers.SharedRuleStrings(object["globalObjects"])...), base.Text()) {
			return
		}
		name = helpers.StatementPropertyName(node)
		reportNode = node.Name()
		if node.Kind == ast.KindElementAccessExpression {
			reportNode = node.AsElementAccessExpression().ArgumentExpression
		}
	} else {
		return
	}
	for _, option := range options {
		restricted, message := "", ""
		if text, ok := option.(string); ok {
			restricted = text
		} else if object, ok := option.(map[string]any); ok {
			restricted, _ = object["name"].(string)
			message, _ = object["message"].(string)
		} else {
			continue
		}
		if restricted == name {
			if message == "" {
				rule.context.Report(rule.context.Range(reportNode), diagnostics.Unexpected_use_of_0, name)
			} else {
				rule.context.Report(rule.context.Range(reportNode), diagnostics.Unexpected_use_of_0_1, name, message)
			}
			return
		}
	}
}
