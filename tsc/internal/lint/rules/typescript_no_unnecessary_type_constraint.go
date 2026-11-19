package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoUnnecessaryTypeConstraintRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func newTypeScriptNoUnnecessaryTypeConstraint(context Context) Rule {
	rule := &typescriptNoUnnecessaryTypeConstraintRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindTypeParameter},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptNoUnnecessaryTypeConstraintRule) OnEnterNode(node *ast.Node) bool {
	rule.constraint(node)
	return true
}

func (rule *typescriptNoUnnecessaryTypeConstraintRule) constraint(node *ast.Node) {
	if node.Kind != ast.KindTypeParameter {
		return
	}
	parameter := node.AsTypeParameterDeclaration()
	constraint := parameter.Constraint
	for constraint != nil && constraint.Kind == ast.KindParenthesizedType {
		constraint = constraint.Type()
	}
	if constraint == nil || constraint.Kind != ast.KindAnyKeyword && constraint.Kind != ast.KindUnknownKeyword {
		return
	}
	text := "any"
	if constraint.Kind == ast.KindUnknownKeyword {
		text = "unknown"
	}
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Constraining_the_generic_type_0_to_1_does_nothing_and_is_unnecessary, node.Name().Text(), text)
	replacement := ""
	filename := strings.ToLower(string(rule.context.File.FileName()))
	if node.Parent.Kind == ast.KindArrowFunction && len(node.Parent.TypeParameters()) == 1 && parameter.DefaultType == nil && (strings.HasSuffix(filename, ".tsx") || strings.HasSuffix(filename, ".mts") || strings.HasSuffix(filename, ".cts")) {
		tail := strings.TrimSpace(rule.context.File.Text()[node.End():])
		if !strings.HasPrefix(tail, ",") {
			replacement = ","
		}
	}
	rule.suggest(diagnostic, node.Name().End(), parameter.Constraint.End(), replacement, ast.NewCompilerDiagnostic(diagnostics.Remove_the_unnecessary_0_constraint, text))
}

func (rule *typescriptNoUnnecessaryTypeConstraintRule) suggest(diagnostic *ast.Diagnostic, start, end int, text string, description *ast.Diagnostic) {
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), text)
	rule.AddSuggestion(diagnostic, "@typescript-eslint/no-unnecessary-type-constraint", tracker.GetTextChanges(), description)
}
