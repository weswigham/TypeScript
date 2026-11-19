package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
)

type typescriptNoExplicitAnyRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func newTypeScriptNoExplicitAny(context Context) Rule {
	rule := &typescriptNoExplicitAnyRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindAnyKeyword},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptNoExplicitAnyRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindAnyKeyword {
		rule.explicitAny(node)
	}
	return true
}

func (rule *typescriptNoExplicitAnyRule) explicitAny(node *ast.Node) {
	if rule.Boolean("ignoreRestArgs", false) {
		parent := node.Parent
		if parent != nil && parent.Kind == ast.KindArrayType {
			parent = parent.Parent
			if parent != nil && parent.Kind == ast.KindTypeOperator && parent.AsTypeOperatorNode().Operator == ast.KindReadonlyKeyword {
				parent = parent.Parent
			}
		} else if parent != nil && parent.Kind == ast.KindTypeReference && parent.AsTypeReferenceNode().TypeName.Kind == ast.KindIdentifier && (parent.AsTypeReferenceNode().TypeName.Text() == "Array" || parent.AsTypeReferenceNode().TypeName.Text() == "ReadonlyArray") {
			parent = parent.Parent
		} else {
			parent = nil
		}
		if parent != nil && parent.Kind == ast.KindParameter && parent.AsParameterDeclaration().DotDotDotToken != nil && ast.IsFunctionLike(parent.Parent) {
			return
		}
	}
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_any_Specify_a_different_type)
	if rule.context.NewTracker == nil {
		return
	}
	keyof := node.Parent != nil && node.Parent.Kind == ast.KindTypeOperator && node.Parent.AsTypeOperatorNode().Operator == ast.KindKeyOfKeyword
	tracker := rule.context.NewTracker()
	if keyof {
		rule.replace(tracker, node.Parent, tracker.NewTypeReferenceNode(tracker.NewIdentifier("PropertyKey"), nil))
	} else {
		replacement := tracker.NewKeywordTypeNode(ast.KindUnknownKeyword)
		if node.Parent != nil && node.Parent.Kind == ast.KindParameter && node.Parent.AsParameterDeclaration().DotDotDotToken != nil {
			replacement = tracker.NewArrayTypeNode(replacement)
		}
		rule.replace(tracker, node, replacement)
	}
	if rule.Boolean("fixToUnknown", false) {
		rule.fix(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.Replace_any_with_a_safer_type))
	}
	if keyof {
		rule.suggest(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.Use_PropertyKey_instead_this_is_more_explicit_than_keyof_any))
	} else {
		rule.suggest(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.Use_unknown_instead_this_will_force_you_to_explicitly_and_safely_assert_the_type_is_correct))
		never := rule.context.NewTracker()
		rule.replace(never, node, never.NewKeywordTypeNode(ast.KindNeverKeyword))
		rule.suggest(diagnostic, never, ast.NewCompilerDiagnostic(diagnostics.Use_never_instead_this_is_useful_when_instantiating_generic_type_parameters_that_you_don_t_need_to_know_the_type_of))
	}
}

func (rule *typescriptNoExplicitAnyRule) Boolean(name string, fallback bool) bool {
	return helpers.BooleanOptionValue(rule.Options(), name, fallback)
}

func (rule *typescriptNoExplicitAnyRule) replace(tracker *change.Tracker, node, replacement *ast.Node) {
	tracker.ReplaceNodePreservingComments(rule.context.File, node, replacement)
}

func (rule *typescriptNoExplicitAnyRule) fix(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	name := "@typescript-eslint/no-explicit-any"
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), description, name, description))
}

func (rule *typescriptNoExplicitAnyRule) suggest(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	rule.AddSuggestion(diagnostic, "@typescript-eslint/no-explicit-any", tracker.GetTextChanges(), description)
}

func (rule *typescriptNoExplicitAnyRule) Options() map[string]any {
	options, _ := rule.option(0).(map[string]any)
	return options
}

func (rule *typescriptNoExplicitAnyRule) option(index int) any {
	if index < len(rule.context.Options) {
		return rule.context.Options[index]
	}
	return nil
}
