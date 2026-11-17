package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type defaultCaseRule struct {
	context Context
}

func (rule *defaultCaseRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindSwitchStatement {
		return true
	}
	clauses := node.AsSwitchStatement().CaseBlock.AsCaseBlock().Clauses.Nodes
	if len(clauses) == 0 {
		return true
	}
	for _, clause := range clauses {
		if clause.Kind == ast.KindDefaultClause {
			return true
		}
	}
	last := clauses[len(clauses)-1]
	comments := helpers.SyntaxComments(rule.context, last.End(), node.End())
	if len(comments) > 0 {
		comment := strings.TrimSpace(comments[len(comments)-1].Text)
		pattern, configured := helpers.SyntaxObject(rule.context, 0)["commentPattern"].(string)
		if !configured && strings.EqualFold(comment, "no default") || configured && helpers.MatchesRegularExpression(pattern, comment) {
			return true
		}
	}
	rule.context.Report(rule.context.Range(node), diagnostics.Expected_a_default_case)
	return true
}

func (rule *defaultCaseRule) OnExitNode(node *ast.Node) {
}

func newDefaultCase(context Context) Rule {
	return &defaultCaseRule{context: context}
}
