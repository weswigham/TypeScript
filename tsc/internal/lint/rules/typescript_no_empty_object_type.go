package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/regex"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoEmptyObjectTypeRule struct {
	helpers.DiagnosticSuggestions
	context     Context
	namePattern *regex.Pattern
}

func newTypeScriptNoEmptyObjectType(context Context) Rule {
	rule := &typescriptNoEmptyObjectTypeRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindInterfaceDeclaration, ast.KindTypeLiteral},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptNoEmptyObjectTypeRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindTypeLiteral && node.Kind != ast.KindInterfaceDeclaration {
		return true
	}
	var options map[string]any
	if len(rule.context.Options) > 0 {
		options, _ = rule.context.Options[0].(map[string]any)
	}
	if pattern := helpers.StringOptionValue(options["allowWithName"], ""); pattern != "" && rule.namePattern == nil {
		rule.namePattern = regex.Compile(pattern)
	}
	switch node.Kind {
	case ast.KindTypeLiteral:
		parent := node.Parent
		for parent.Kind == ast.KindParenthesizedType {
			parent = parent.Parent
		}
		if helpers.StringOptionValue(options["allowObjectTypes"], "never") == "always" || len(node.Members()) != 0 || parent.Kind == ast.KindIntersectionType || parent.Kind == ast.KindTypeAliasDeclaration && rule.allowedName(parent.Name()) {
			return true
		}
		diagnostic := rule.context.Report(rule.context.Range(node), tsNoEmptyObject, "allowObjectTypes")
		for _, replacement := range []string{"object", "unknown"} {
			tracker := rule.context.NewTracker()
			tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(scanner.GetTokenPosOfNode(node, rule.context.File, false), node.End()), replacement)
			rule.AddSuggestion(diagnostic, "@typescript-eslint/no-empty-object-type", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Replace_with_0, replacement))
		}
	case ast.KindInterfaceDeclaration:
		extended := ast.GetHeritageElements(node, ast.KindExtendsKeyword)
		allowInterfaces := helpers.StringOptionValue(options["allowInterfaces"], "never")
		if allowInterfaces == "always" || len(node.Members()) != 0 || len(extended) > 1 || len(extended) == 1 && allowInterfaces == "with-single-extends" || rule.allowedName(node.Name()) {
			return true
		}
		message := tsNoEmptyInterface
		var args []any
		if len(extended) == 1 {
			message = tsNoEmptyInterfaceWithSuper
		} else {
			args = []any{"allowInterfaces"}
		}
		diagnostic := rule.context.Report(rule.context.Range(node.Name()), message, args...)
		merged := false
		node.Parent.ForEachChild(func(sibling *ast.Node) bool {
			if sibling != node && (sibling.Kind == ast.KindInterfaceDeclaration || sibling.Kind == ast.KindClassDeclaration) && sibling.Name() != nil && sibling.Name().Text() == node.Name().Text() {
				merged = true
			}
			return false
		})
		if merged || node.ModifierFlags()&ast.ModifierFlagsDefault != 0 {
			return true
		}
		prefix := "type " + rule.Text(node.Name())
		if parameters := node.TypeParameterList(); parameters != nil {
			start := node.Name().End()
			tokenScanner := scanner.NewScanner()
			tokenScanner.SetText(rule.context.File.Text())
			tokenScanner.ResetPos(start)
			if tokenScanner.Scan() == ast.KindLessThanToken {
				start = tokenScanner.TokenStart()
				tokenScanner.ResetPos(parameters.End())
				if tokenScanner.Scan() != ast.KindGreaterThanToken {
					return true
				}
				prefix += rule.context.File.Text()[start:tokenScanner.TokenEnd()]
			}
		}
		start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
		for _, modifier := range node.ModifierNodes() {
			if modifier.Kind == ast.KindExportKeyword {
				start = modifier.End()
			}
		}
		tokenScanner := scanner.NewScanner()
		tokenScanner.SetText(rule.context.File.Text())
		tokenScanner.ResetPos(start)
		tokenScanner.Scan()
		start = tokenScanner.TokenStart()
		replacements := []string{"object", "unknown"}
		if len(extended) == 1 {
			replacements = []string{rule.Text(extended[0])}
		}
		for _, replacement := range replacements {
			tracker := rule.context.NewTracker()
			tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, node.End()), prefix+" = "+replacement)
			description := ast.NewCompilerDiagnostic(diagnostics.Replace_empty_interface_with_0, replacement)
			if len(extended) == 1 {
				description = ast.NewCompilerDiagnostic(diagnostics.Replace_empty_interface_with_a_type_alias)
			}
			rule.AddSuggestion(diagnostic, "@typescript-eslint/no-empty-object-type", tracker.GetTextChanges(), description)
		}
	}
	return true
}

var (
	tsNoEmptyInterface          = diagnostics.An_empty_interface_declaration_allows_any_non_nullish_value_including_literals_like_0_and_If_that_s_what_you_want_disable_this_lint_rule_with_an_inline_comment_or_configure_the_0_rule_option_If_you_want_a_type_meaning_any_object_you_probably_want_object_instead_If_you_want_a_type_meaning_any_value_you_probably_want_unknown_instead
	tsNoEmptyInterfaceWithSuper = diagnostics.An_interface_declaring_no_members_is_equivalent_to_its_supertype
	tsNoEmptyObject             = diagnostics.The_empty_object_type_allows_any_non_nullish_value_including_literals_like_0_and_If_that_s_what_you_want_disable_this_lint_rule_with_an_inline_comment_or_configure_the_0_rule_option_If_you_want_a_type_meaning_any_object_you_probably_want_object_instead_If_you_want_a_type_meaning_any_value_you_probably_want_unknown_instead
)

func (rule *typescriptNoEmptyObjectTypeRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[scanner.GetTokenPosOfNode(node, rule.context.File, false):node.End()]
}

func (rule *typescriptNoEmptyObjectTypeRule) allowedName(name *ast.Node) bool {
	return rule.namePattern != nil && rule.namePattern.MatchString(name.Text())
}
