package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoRequireImportsRule struct {
	helpers.TypescriptScopeRuleContext
}

func (rule *typescriptNoRequireImportsRule) OnEnterNode(node *ast.Node) bool {
	rule.requireImports(node)
	return true
}

func (rule *typescriptNoRequireImportsRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptNoRequireImportsRule) requireImports(node *ast.Node) {
	var path *ast.Node
	switch node.Kind {
	case ast.KindCallExpression:
		callee := ast.SkipParentheses(node.Expression())
		if callee.Kind != ast.KindIdentifier || callee.Text() != "require" {
			return
		}
		if rule.Bindings().Nodes[callee].Find("require") != nil {
			return
		}
		if len(node.Arguments()) > 0 {
			path = node.Arguments()[0]
		}
	case ast.KindExternalModuleReference:
		if rule.Boolean("allowAsImport", false) && node.Parent.Kind == ast.KindImportEqualsDeclaration {
			return
		}
		path = node.AsExternalModuleReference().Expression
	default:
		return
	}
	if path != nil && (path.Kind == ast.KindStringLiteral || path.Kind == ast.KindNoSubstitutionTemplateLiteral) {
		for _, pattern := range helpers.TsScopeStrings(rule.Options()["allow"]) {
			if helpers.MatchesRegularExpression(pattern, path.Text()) {
				return
			}
		}
	}
	rule.Context.Report(rule.Context.Range(node), diagnostics.A_require_style_import_is_forbidden)
}

func newTypeScriptNoRequireImports(context Context) Rule {
	return &typescriptNoRequireImportsRule{Context: context, Name: "no-require-imports"}
}
