package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noUselessComputedKeyCoreRule struct {
	context                Context
	enforceForClassMembers bool
}

func newNoUselessComputedKeyCoreRule(context Context) *noUselessComputedKeyCoreRule {
	return &noUselessComputedKeyCoreRule{
		context:                context,
		enforceForClassMembers: helpers.ExpressionBooleanOption(context, "enforceForClassMembers", true),
	}
}

func (rule *noUselessComputedKeyCoreRule) OnEnterNode(node *ast.Node) bool {
	rule.checkComputedKey(node)
	return true
}

func (rule *noUselessComputedKeyCoreRule) OnExitNode(node *ast.Node) {}

func (rule *noUselessComputedKeyCoreRule) checkComputedKey(node *ast.Node) {
	if node.Kind != ast.KindComputedPropertyName {
		return
	}
	member := node.Parent
	var key *ast.Node
	switch member.Kind {
	case ast.KindPropertyAssignment, ast.KindMethodDeclaration, ast.KindGetAccessor, ast.KindSetAccessor, ast.KindPropertyDeclaration, ast.KindBindingElement:
		key = ast.SkipParentheses(node.Expression())
	default:
		return
	}
	if key.Kind != ast.KindStringLiteral && key.Kind != ast.KindNumericLiteral {
		return
	}
	isClass := member.Parent != nil && ast.IsClassLike(member.Parent)
	if isClass {
		if !rule.enforceForClassMembers {
			return
		}
		static := ast.HasSyntacticModifier(member, ast.ModifierFlagsStatic)
		if key.Text() == "constructor" && (!static || member.Kind == ast.KindPropertyDeclaration) || key.Text() == "prototype" && static {
			return
		}
	} else if member.Parent.Kind == ast.KindObjectLiteralExpression && !helpers.IsDestructuringAssignmentTarget(member.Parent) && key.Text() == "__proto__" {
		return
	}
	keyStart := scanner.GetTokenPosOfNode(key, rule.context.File, false)
	raw := rule.context.File.Text()[keyStart:key.End()]
	diagnostic := rule.context.Report(rule.context.Range(member), diagnostics.Unnecessarily_computed_property_0_found, raw)
	start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
	if helpers.HasSourceCommentBetween(rule.context, start, keyStart) || helpers.HasSourceCommentBetween(rule.context, key.End(), node.End()) {
		return
	}
	previous := astnav.FindPrecedingToken(rule.context.File, start)
	if previous != nil && previous.End() == start && key.Kind == ast.KindNumericLiteral && raw[0] != '.' && (previous.Kind == ast.KindIdentifier || ast.IsKeywordKind(previous.Kind) || previous.Kind == ast.KindNumericLiteral) {
		raw = " " + raw
	}
	rule.fixRange(diagnostic, start, node.End(), raw)
}

func (rule *noUselessComputedKeyCoreRule) fixRange(diagnostic *ast.Diagnostic, start int, end int, replacement string) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), replacement)
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("no-useless-computed-key", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "no-useless-computed-key"), "no-useless-computed-key", ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "no-useless-computed-key")))
}

func newNoUselessComputedKeyCore(context Context) Rule {
	return newNoUselessComputedKeyCoreRule(context)
}
