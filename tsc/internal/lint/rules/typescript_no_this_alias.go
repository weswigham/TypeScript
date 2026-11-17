package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoThisAliasRule struct {
	context Context
}

func (rule *typescriptNoThisAliasRule) OnEnterNode(node *ast.Node) bool {
	rule.thisAlias(node)
	return true
}

func (rule *typescriptNoThisAliasRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptNoThisAliasRule) thisAlias(node *ast.Node) {
	var target, value *ast.Node
	if node.Kind == ast.KindVariableDeclaration {
		target, value = node.Name(), node.Initializer()
	} else if node.Kind == ast.KindBinaryExpression && ast.IsAssignmentOperator(node.AsBinaryExpression().OperatorToken.Kind) {
		target, value = node.AsBinaryExpression().Left, node.AsBinaryExpression().Right
	}
	if value == nil || ast.SkipParentheses(value).Kind != ast.KindThisKeyword {
		return
	}
	target = ast.SkipParentheses(target)
	if target.Kind != ast.KindIdentifier && rule.Boolean("allowDestructuring", true) {
		return
	}
	if target.Kind == ast.KindIdentifier {
		if !slices.Contains(helpers.TypescriptSyntaxStrings(rule.Options()["allowedNames"]), target.Text()) {
			rule.context.Report(rule.context.Range(target), diagnostics.Unexpected_aliasing_of_this_to_local_variable)
		}
	} else {
		rule.context.Report(rule.context.Range(target), diagnostics.Unexpected_aliasing_of_members_of_this_to_local_variables)
	}
}

func (rule *typescriptNoThisAliasRule) Boolean(name string, fallback bool) bool {
	if value, ok := rule.Options()[name].(bool); ok {
		return value
	}
	return fallback
}

func (rule *typescriptNoThisAliasRule) Options() map[string]any {
	if len(rule.context.Options) != 0 {
		options, _ := rule.context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func newTypeScriptNoThisAlias(context Context) Rule {
	return &typescriptNoThisAliasRule{context: context}
}
