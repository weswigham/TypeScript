package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/lint/selectors"
)

type restrictedSyntaxSelector struct {
	text, message string
	selector      *selectors.Selector
}

type noRestrictedSyntax struct {
	context   Context
	selectors []restrictedSyntaxSelector
}

func (rule *noRestrictedSyntax) OnEnterNode(node *ast.Node) bool { return true }

func newNoRestrictedSyntax(context Context) Rule {
	rule := &noRestrictedSyntax{context: context}
	for _, option := range context.Options {
		text, ok := option.(string)
		message := ""
		if !ok {
			object, _ := option.(map[string]any)
			text, _ = object["selector"].(string)
			message, _ = object["message"].(string)
		}
		if message == "" {
			message = "Using '" + text + "' is not allowed."
		}
		selector, err := selectors.ParseWithRegex(text, helpers.CompileRegexMatcher)
		if err != nil {
			panic(err)
		}
		entry := restrictedSyntaxSelector{text: text, message: message, selector: selector}
		if index := slices.IndexFunc(rule.selectors, func(existing restrictedSyntaxSelector) bool { return existing.text == text }); index >= 0 {
			rule.selectors[index] = entry
		} else {
			rule.selectors = append(rule.selectors, entry)
		}
	}
	return rule
}

func (rule *noRestrictedSyntax) OnExitNode(node *ast.Node) {
	if node.Kind != ast.KindSourceFile || len(rule.selectors) == 0 {
		return
	}
	root := selectors.FromFile(rule.context.File)
	seen := make([]map[*selectors.Node]bool, len(rule.selectors))
	for index := range seen {
		seen[index] = make(map[*selectors.Node]bool)
	}
	var visit func(*selectors.Node)
	visit = func(current *selectors.Node) {
		for index, entry := range rule.selectors {
			for _, selected := range entry.selector.Selected(current) {
				if !seen[index][selected] {
					seen[index][selected] = true
					rule.context.Report(rule.context.Range(selected.Native.(*ast.Node)), diagnostics.X_0_24277, entry.message)
				}
			}
		}
		for _, child := range current.Children {
			visit(child)
		}
	}
	visit(root)
}
