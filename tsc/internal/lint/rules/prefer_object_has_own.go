package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type preferObjectHasOwnRule struct{ context Context }

func newPreferObjectHasOwnRule(context Context) Rule {
	rule := &preferObjectHasOwnRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindCallExpression},
	}
}

func (rule *preferObjectHasOwnRule) OnEnterNode(node *ast.Node) bool {
	rule.objectHasOwn(node)
	return true
}

func (rule *preferObjectHasOwnRule) objectHasOwn(node *ast.Node) {
	if node.Kind != ast.KindCallExpression || helpers.SharedOptionalChainBoundary(node.Expression()) {
		return
	}
	callee := ast.SkipParentheses(node.Expression())
	if !ast.IsAccessExpression(callee) || helpers.StatementPropertyName(callee) != "call" {
		return
	}
	if helpers.SharedOptionalChainBoundary(callee.Expression()) {
		return
	}
	member := ast.SkipParentheses(callee.Expression())
	if !ast.IsAccessExpression(member) || helpers.StatementPropertyName(member) != "hasOwnProperty" {
		return
	}
	if helpers.SharedOptionalChainBoundary(member.Expression()) {
		return
	}
	object := ast.SkipParentheses(member.Expression())
	emptyObject := object.Kind == ast.KindObjectLiteralExpression && len(object.AsObjectLiteralExpression().Properties.Nodes) == 0
	if ast.IsAccessExpression(object) && helpers.StatementPropertyName(object) == "prototype" {
		object = ast.SkipParentheses(object.Expression())
	}
	if !(object.Kind == ast.KindIdentifier && object.Text() == "Object" || emptyObject) {
		return
	}
	if !rule.global("Object", node) {
		return
	}
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Use_Object_hasOwn_instead_of_Object_prototype_hasOwnProperty_call)
	start := scanner.GetTokenPosOfNode(callee, rule.context.File, false)
	if !helpers.ContainsCommentTrivia(rule.context.File.Text()[start:callee.End()]) {
		replacement := "Object.hasOwn"
		if start > 0 && scanner.IsIdentifierPart(rune(rule.context.File.Text()[start-1])) {
			replacement = " " + replacement
		}
		rule.fix(diagnostic, start, callee.End(), replacement, ast.NewCompilerDiagnostic(diagnostics.Use_Object_hasOwn))
	}
}

func (rule *preferObjectHasOwnRule) global(name string, location *ast.Node) bool {
	checker := rule.context.GetChecker()
	if local := rule.context.File.AsNode().Locals().Get(name); local != nil && local.Flags()&(ast.SymbolFlagsValue|ast.SymbolFlagsAlias) != 0 {
		return false
	}
	symbol := checker.ResolveName(name, location, ast.SymbolFlagsValue, false)
	if symbol == nil {
		return false
	}
	for _, declaration := range symbol.Declarations() {
		if !checker.IsLibSymbolForHoverVerbosity(declaration.Symbol()) {
			return false
		}
	}
	return true
}

func (rule *preferObjectHasOwnRule) fix(diagnostic *ast.Diagnostic, start, end int, replacement string, description *ast.Diagnostic) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), replacement)
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("prefer-object-has-own", tracker.GetTextChanges(), description, "prefer-object-has-own", description))
}
