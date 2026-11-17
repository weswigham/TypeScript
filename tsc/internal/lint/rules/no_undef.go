package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noUndefRule struct {
	helpers.LexicalScopeAnalysis
}

func newNoUndefRule(context Context) Rule {
	return &noUndefRule{LexicalScopeAnalysis: helpers.NewLexicalScopeAnalysis(context)}
}

func (rule *noUndefRule) OnEnterNode(node *ast.Node) bool {
	rule.Model.Enter(rule.Context, node)
	return true
}

func (rule *noUndefRule) OnExitNode(node *ast.Node) {
	rule.Model.Exit(node)
	if node.Kind != ast.KindSourceFile {
		return
	}
	rule.Model.Resolve(rule.Context)
	for _, identifier := range rule.Model.References {
		if rule.Model.Binding(identifier) != nil || rule.KnownGlobal(identifier) || !rule.Boolean("typeof", false) && helpers.LexicalScopeUnwrap(identifier).Parent.Kind == ast.KindTypeOfExpression {
			continue
		}
		rule.Context.Report(rule.Context.Range(identifier), diagnostics.X_0_is_not_defined, identifier.Text())
	}
}
