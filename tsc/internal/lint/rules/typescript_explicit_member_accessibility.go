package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptExplicitMemberAccessibilityRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func newTypeScriptExplicitMemberAccessibility(context Context) Rule {
	rule := &typescriptExplicitMemberAccessibilityRule{context: context}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindConstructor,
			ast.KindGetAccessor,
			ast.KindMethodDeclaration,
			ast.KindParameter,
			ast.KindPropertyDeclaration,
			ast.KindSetAccessor,
		},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptExplicitMemberAccessibilityRule) OnEnterNode(node *ast.Node) bool {
	rule.accessibility(node)
	return true
}

func (rule *typescriptExplicitMemberAccessibilityRule) accessibility(node *ast.Node) {
	group, kind := "", ""
	switch node.Kind {
	case ast.KindMethodDeclaration:
		group, kind = "methods", "method definition"
	case ast.KindConstructor:
		group, kind = "constructors", "method definition"
	case ast.KindGetAccessor:
		group, kind = "accessors", "get property accessor"
	case ast.KindSetAccessor:
		group, kind = "accessors", "set property accessor"
	case ast.KindPropertyDeclaration:
		group, kind = "properties", "class property"
	case ast.KindParameter:
		if !ast.HasSyntacticModifier(node, ast.ModifierFlagsAccessibilityModifier|ast.ModifierFlagsReadonly|ast.ModifierFlagsOverride) || node.Parent.Kind != ast.KindConstructor {
			return
		}
		group, kind = "parameterProperties", "parameter property"
	default:
		return
	}
	if group != "parameterProperties" && (node.Parent == nil || !ast.IsClassLike(node.Parent)) || node.Name() != nil && node.Name().Kind == ast.KindPrivateIdentifier {
		return
	}
	mode := helpers.StringOptionValue(rule.Options()["accessibility"], "explicit")
	if overrides, ok := rule.Options()["overrides"].(map[string]any); ok {
		mode = helpers.StringOptionValue(overrides[group], mode)
	}
	name := "constructor"
	if node.Name() != nil {
		if value, known := helpers.StaticPropertyNameText(node.Name()); known {
			name = value
		} else {
			name = rule.Text(node.Name())
		}
	}
	if mode == "off" || group != "properties" && group != "parameterProperties" && slices.Contains(helpers.TypescriptSyntaxStrings(rule.Options()["ignoredMethodNames"]), name) {
		return
	}
	if mode == "no-public" && ast.HasSyntacticModifier(node, ast.ModifierFlagsPublic) {
		if group == "parameterProperties" && !ast.HasSyntacticModifier(node, ast.ModifierFlagsReadonly) {
			return
		}
		for _, modifier := range node.Modifiers().Nodes {
			if modifier.Kind != ast.KindPublicKeyword {
				continue
			}
			diagnostic := rule.context.Report(rule.context.Range(modifier), diagnostics.Public_accessibility_modifier_on_0_1, kind, name)
			if rule.context.NewTracker != nil {
				tracker := rule.context.NewTracker()
				end := modifier.End()
				text := rule.context.File.Text()
				for end < len(text) && helpers.TsCommentSpace(rune(text[end])) {
					end++
				}
				tracker.DeleteRange(rule.context.File, core.NewTextRange(scanner.GetTokenPosOfNode(modifier, rule.context.File, false), end))
				rule.fix(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.Remove_public_accessibility_modifier))
			}
			return
		}
	}
	if mode != "explicit" || ast.HasSyntacticModifier(node, ast.ModifierFlagsAccessibilityModifier) {
		return
	}

	start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
	if modifiers := node.Modifiers(); modifiers != nil {
		for _, modifier := range modifiers.Nodes {
			if modifier.Kind == ast.KindDecorator {
				lexer := scanner.GetScannerForSourceFile(rule.context.File, modifier.End())
				lexer.Scan()
				start = lexer.TokenStart()
			}
		}
	}
	var end int
	if node.Name() != nil {
		end = node.Name().End()
	} else {
		end = start + len("constructor")
	}
	diagnostic := rule.context.Report(

		core.NewTextRange(start, end), diagnostics.Missing_accessibility_modifier_on_0_1, kind, name)

	if rule.context.NewTracker != nil {
		for _, accessibility := range []string{"public", "private", "protected"} {
			tracker := rule.context.NewTracker()
			tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, start), accessibility+" ")
			rule.suggest(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.Add_0_accessibility_modifier, accessibility))
		}
	}
}

func (rule *typescriptExplicitMemberAccessibilityRule) Options() map[string]any {
	options, _ := rule.option(0).(map[string]any)
	return options
}

func (rule *typescriptExplicitMemberAccessibilityRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[scanner.GetTokenPosOfNode(node, rule.context.File, false):node.End()]
}

func (rule *typescriptExplicitMemberAccessibilityRule) fix(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	name := "@typescript-eslint/explicit-member-accessibility"
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), description, name, description))
}

func (rule *typescriptExplicitMemberAccessibilityRule) suggest(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	rule.AddSuggestion(diagnostic, "@typescript-eslint/explicit-member-accessibility", tracker.GetTextChanges(), description)
}

func (rule *typescriptExplicitMemberAccessibilityRule) option(index int) any {
	if index < len(rule.context.Options) {
		return rule.context.Options[index]
	}
	return nil
}
