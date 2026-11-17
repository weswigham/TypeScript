package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noLabels struct {
	context Context
}

func newNoLabels(context Context) Rule { return &noLabels{context: context} }

func (rule *noLabels) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindBreakStatement || node.Kind == ast.KindContinueStatement {
		label := helpers.SourceJumpLabel(node)
		if label != nil && !rule.allowedLabel(sourceLabelTarget(node, label.Text())) {
			if node.Kind == ast.KindBreakStatement {
				rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_label_in_break_statement)
			} else {
				rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_label_in_continue_statement)
			}
		}
	}

	return true
}

func (rule *noLabels) OnExitNode(node *ast.Node) {
	if node.Kind == ast.KindLabeledStatement && !rule.allowedLabel(node.AsLabeledStatement().Statement) {
		rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_labeled_statement)
	}
}

func (rule *noLabels) Options() map[string]any {
	if len(rule.context.Options) > 0 {
		options, _ := rule.context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func (rule *noLabels) Boolean(name string) bool {
	value, _ := rule.Options()[name].(bool)
	return value
}

func (rule *noLabels) allowedLabel(body *ast.Node) bool {
	return body != nil && (ast.IsIterationStatement(body, false) && rule.Boolean("allowLoop") || body.Kind == ast.KindSwitchStatement && rule.Boolean("allowSwitch"))
}

func sourceLabelTarget(node *ast.Node, name string) *ast.Node {
	for parent := node.Parent; parent != nil && !ast.IsFunctionLike(parent); parent = parent.Parent {
		if parent.Kind == ast.KindLabeledStatement && parent.AsLabeledStatement().Label.Text() == name {
			return parent.AsLabeledStatement().Statement
		}
	}
	return nil
}
