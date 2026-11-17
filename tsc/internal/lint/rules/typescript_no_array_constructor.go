package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoArrayConstructorRule struct {
	helpers.TypescriptScopeRuleContext
}

func (rule *typescriptNoArrayConstructorRule) OnEnterNode(node *ast.Node) bool {
	rule.arrayConstructor(node)
	return true
}

func (rule *typescriptNoArrayConstructorRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptNoArrayConstructorRule) arrayConstructor(node *ast.Node) {
	if node.Kind != ast.KindCallExpression && node.Kind != ast.KindNewExpression {
		return
	}
	callee := ast.SkipParentheses(node.Expression())
	if callee.Kind != ast.KindIdentifier || callee.Text() != "Array" || node.TypeArgumentList() != nil || len(node.Arguments()) == 1 {
		return
	}
	diagnostic := rule.Context.Report(rule.Context.Range(node), diagnostics.The_array_literal_notation_is_preferable)
	arguments := ""
	text := rule.Context.File.Text()
	if strings.HasSuffix(rule.Text(node), ")") {
		start := callee.End()
		for start < node.End() && text[start] != '(' {
			start++
		}
		if start < node.End() {
			arguments = text[start+1 : node.End()-1]
		}
	}
	rule.Replace(diagnostic, node, "["+arguments+"]", nil)
}

func newTypeScriptNoArrayConstructor(context Context) Rule {
	return &typescriptNoArrayConstructorRule{Context: context, Name: "no-array-constructor"}
}
