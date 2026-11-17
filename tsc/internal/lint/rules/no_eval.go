package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noEvalRule struct {
	helpers.LexicalScopeAnalysis
}

func newNoEvalRule(context Context) Rule {
	return &noEvalRule{LexicalScopeAnalysis: helpers.NewLexicalScopeAnalysis(context)}
}

func (rule *noEvalRule) OnEnterNode(node *ast.Node) bool {
	rule.Model.Enter(rule.Context, node)
	return true
}

func (rule *noEvalRule) OnExitNode(node *ast.Node) {
	rule.Model.Exit(node)
	if node.Kind != ast.KindSourceFile {
		return
	}
	rule.Model.Resolve(rule.Context)
	rule.eval()
}

func (rule *noEvalRule) eval() {
	indirect := !rule.Boolean("allowIndirect", false)
	for _, node := range rule.Model.References {
		if node.Text() != "eval" || helpers.TsScopeTypeOnly(node) {
			continue
		}
		callee := helpers.LexicalScopeUnwrap(node)
		call := callee.Parent
		direct := call.Kind == ast.KindCallExpression && call.Expression() == callee
		if direct && (indirect || call.AsCallExpression().QuestionDotToken == nil) || !direct && indirect && rule.Global(node, true) {
			rule.Context.Report(rule.Context.Range(node), diagnostics.X_eval_can_be_harmful)
		}
	}
	if !indirect {
		return
	}
	for _, node := range rule.Model.References {
		if !slices.Contains([]string{"global", "window", "globalThis"}, node.Text()) {
			continue
		}
		current := helpers.LexicalScopeUnwrap(node)
		for current.Parent != nil && ast.IsAccessExpression(current.Parent) && current.Parent.Expression() == current {
			access := current.Parent
			_, property, name := rule.Member(access)
			if name == "eval" {
				if rule.Global(node, true) && (rule.KnownGlobal(node) || rule.Model.Binding(node) != nil) {
					rule.Context.Report(rule.Context.Range(property), diagnostics.X_eval_can_be_harmful)
				}
				break
			}
			if name != node.Text() {
				break
			}
			current = helpers.LexicalScopeUnwrap(access)
		}
	}
	for _, node := range rule.Model.ThisNodes {
		current := helpers.LexicalScopeUnwrap(node)
		if current.Parent != nil && ast.IsAccessExpression(current.Parent) && current.Parent.Expression() == current {
			_, property, name := rule.Member(current.Parent)
			if name == "eval" && rule.globalThis(node) {
				rule.Context.Report(rule.Context.Range(property), diagnostics.X_eval_can_be_harmful)
			}
		}
	}
}

func (rule *noEvalRule) globalThis(node *ast.Node) bool {
	owner := helpers.LexicalScopeThisOwner(node)
	if owner == nil || owner.Kind == ast.KindSourceFile {
		return !ast.IsExternalModule(rule.Context.File)
	}
	return !rule.Strict(owner) && rule.DefaultThis(owner, true)
}
