package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptConsistentTypeAssertionsRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func (rule *typescriptConsistentTypeAssertionsRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindAsExpression || node.Kind == ast.KindTypeAssertionExpression {
		rule.typeAssertions(node)
	}
	return true
}

func (rule *typescriptConsistentTypeAssertionsRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptConsistentTypeAssertionsRule) typeAssertions(node *ast.Node) {
	mode := helpers.StringOptionValue(rule.Options()["assertionStyle"], "as")
	style := "as"
	if node.Kind == ast.KindTypeAssertionExpression {
		style = "angle-bracket"
	}
	if mode != style {
		if mode == "never" && helpers.TsAConstAssertion(node.Type()) {
			return
		}
		var diagnostic *ast.Diagnostic
		if mode == "never" {
			diagnostic = rule.context.Report(rule.context.Range(node), diagnostics.Do_not_use_any_type_assertions)
		} else if mode == "angle-bracket" {
			diagnostic = rule.context.Report(rule.context.Range(node), diagnostics.Use_0_instead_of_as_0, rule.Text(node.Type()))
		} else {
			diagnostic = rule.context.Report(rule.context.Range(node), diagnostics.Use_as_0_instead_of_0, rule.Text(node.Type()))
		}
		if mode == "as" && rule.context.NewTracker != nil {
			tracker := rule.context.NewTracker()
			replacement := tracker.NewAsExpression(node.Expression(), node.Type())
			_, parent := helpers.OuterParenthesizedNodeAndParent(node)
			if parent != nil && (ast.IsAccessExpression(parent) && parent.Expression() == node || (parent.Kind == ast.KindCallExpression || parent.Kind == ast.KindNewExpression) && parent.Expression() == node || parent.Kind == ast.KindPrefixUnaryExpression || parent.Kind == ast.KindPostfixUnaryExpression || parent.Kind == ast.KindNonNullExpression || parent.Kind == ast.KindTaggedTemplateExpression || parent.Kind == ast.KindBinaryExpression && !ast.IsAssignmentExpression(parent, false)) && node.Parent.Kind != ast.KindParenthesizedExpression {
				replacement = tracker.NewParenthesizedExpression(replacement)
			}
			rule.replace(tracker, node, replacement)
			rule.fix(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.Convert_angle_bracket_assertion_to_as_assertion))
		}
		return
	}
	expression := ast.SkipParentheses(node.Expression())
	array := expression.Kind == ast.KindArrayLiteralExpression
	if !array && expression.Kind != ast.KindObjectLiteralExpression {
		return
	}
	option := "objectLiteralTypeAssertions"
	message := diagnostics.Always_prefer_const_x_Colon_T
	annotationDescription := ast.NewCompilerDiagnostic(diagnostics.Use_const_x_Colon_0_instead_24427, rule.Text(node.Type()))
	satisfiesDescription := ast.NewCompilerDiagnostic(diagnostics.Use_const_x_satisfies_0_instead_24425, rule.Text(node.Type()))
	if array {
		option, message = "arrayLiteralTypeAssertions", diagnostics.Always_prefer_const_x_Colon_T_22004
		annotationDescription = ast.NewCompilerDiagnostic(diagnostics.Use_const_x_Colon_0_instead, rule.Text(node.Type()))
		satisfiesDescription = ast.NewCompilerDiagnostic(diagnostics.Use_const_x_satisfies_0_instead, rule.Text(node.Type()))
	}
	setting := helpers.StringOptionValue(rule.Options()[option], "allow")
	if setting == "allow" || node.Type().Kind == ast.KindAnyKeyword || node.Type().Kind == ast.KindUnknownKeyword || helpers.TsAConstAssertion(node.Type()) {
		return
	}
	outer, parent := helpers.OuterParenthesizedNodeAndParent(node)
	if parent != nil && setting == "allow-as-parameter" {
		switch parent.Kind {
		case ast.KindCallExpression, ast.KindNewExpression, ast.KindThrowStatement, ast.KindJsxExpression, ast.KindTemplateSpan:
			return
		case ast.KindParameter, ast.KindBindingElement:
			if parent.Initializer() == outer {
				return
			}
		}
	}
	diagnostic := rule.context.Report(rule.context.Range(node), message)
	if rule.context.NewTracker == nil {
		return
	}
	if parent != nil && parent.Kind == ast.KindVariableDeclaration && parent.Initializer() == outer && parent.Type() == nil {
		tracker := rule.context.NewTracker()
		declaration := parent.AsVariableDeclaration()
		rule.replace(tracker, parent, tracker.NewVariableDeclaration(declaration.Name(), declaration.ExclamationToken, node.Type(), node.Expression()))
		rule.suggest(diagnostic, tracker, annotationDescription)
	}
	tracker := rule.context.NewTracker()
	rule.replace(tracker, node, tracker.NewSatisfiesExpression(node.Expression(), node.Type()))
	rule.suggest(diagnostic, tracker, satisfiesDescription)
}

func (rule *typescriptConsistentTypeAssertionsRule) Options() map[string]any {
	options, _ := rule.option(0).(map[string]any)
	return options
}

func (rule *typescriptConsistentTypeAssertionsRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[scanner.GetTokenPosOfNode(node, rule.context.File, false):node.End()]
}

func (rule *typescriptConsistentTypeAssertionsRule) replace(tracker *change.Tracker, node, replacement *ast.Node) {
	tracker.ReplaceNodePreservingComments(rule.context.File, node, replacement)
}

func (rule *typescriptConsistentTypeAssertionsRule) fix(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	name := "@typescript-eslint/consistent-type-assertions"
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), description, name, description))
}

func (rule *typescriptConsistentTypeAssertionsRule) suggest(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	rule.AddSuggestion(diagnostic, "@typescript-eslint/consistent-type-assertions", tracker.GetTextChanges(), description)
}

func (rule *typescriptConsistentTypeAssertionsRule) option(index int) any {
	if index < len(rule.context.Options) {
		return rule.context.Options[index]
	}
	return nil
}

func newTypeScriptConsistentTypeAssertions(context Context) Rule {
	return &typescriptConsistentTypeAssertionsRule{context: context}
}
