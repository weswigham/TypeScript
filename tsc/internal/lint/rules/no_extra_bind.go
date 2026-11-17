package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
)

type noExtraBind struct {
	context  Context
	thisSeen map[*ast.Node]bool
}

func newNoExtraBind(context Context) Rule { return &noExtraBind{context: context} }

func (rule *noExtraBind) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindThisKeyword {
		rule.markThis(node)
	}

	return true
}

func (rule *noExtraBind) OnExitNode(node *ast.Node) {
	if node.Kind == ast.KindArrowFunction || node.Kind == ast.KindFunctionExpression {
		rule.extraBind(node)
		delete(rule.thisSeen, node)
	}
}

func (rule *noExtraBind) markThis(node *ast.Node) {
	for child, parent := node, node.Parent; parent != nil; child, parent = parent, parent.Parent {
		if parent.Kind == ast.KindClassStaticBlockDeclaration || parent.Kind == ast.KindPropertyDeclaration && child != parent.Name() {
			return
		}
		if ast.IsFunctionLike(parent) && parent.Kind != ast.KindArrowFunction && child != parent.Name() {
			if rule.thisSeen == nil {
				rule.thisSeen = make(map[*ast.Node]bool)
			}
			rule.thisSeen[parent] = true
			return
		}
	}
}

func (rule *noExtraBind) extraBind(node *ast.Node) {
	if node.Kind != ast.KindArrowFunction && rule.thisSeen[node] {
		return
	}
	object, member := helpers.OuterParenthesizedNodeAndParent(node)
	if member == nil || !ast.IsAccessExpression(member) || member.Expression() != object || helpers.StatementPropertyName(member) != "bind" {
		return
	}
	callee, call := helpers.OuterParenthesizedNodeAndParent(member)
	if call == nil || call.Kind != ast.KindCallExpression || call.Expression() != callee {
		return
	}
	arguments := call.AsCallExpression().Arguments.Nodes
	if len(arguments) != 1 || arguments[0].Kind == ast.KindSpreadElement {
		return
	}
	property := member.Name()
	if member.Kind == ast.KindElementAccessExpression {
		property = member.AsElementAccessExpression().ArgumentExpression
	}
	diagnostic := rule.context.Report(rule.context.Range(property), diagnostics.The_function_binding_is_unnecessary)
	argument := ast.SkipParentheses(arguments[0])
	switch argument.Kind {
	case ast.KindIdentifier, ast.KindThisKeyword, ast.KindFunctionExpression, ast.KindStringLiteral, ast.KindNumericLiteral, ast.KindBigIntLiteral, ast.KindRegularExpressionLiteral, ast.KindNullKeyword, ast.KindTrueKeyword, ast.KindFalseKeyword:
		if helpers.ContainsCommentTrivia(rule.context.File.Text()[object.End():call.End()]) || rule.context.NewTracker == nil {
			return
		}
		tracker := rule.context.NewTracker()
		tracker.ReplaceNodePreservingComments(rule.context.File, call, tracker.NewParenthesizedExpression(object))
		rule.fix(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.Remove_unnecessary_binding))
	}
}

func (rule *noExtraBind) fix(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("no-extra-bind", tracker.GetTextChanges(), description, "no-extra-bind", description))
}
