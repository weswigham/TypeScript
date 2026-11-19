package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoRestrictedTypesRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func newTypeScriptNoRestrictedTypes(context Context) Rule {
	rule := &typescriptNoRestrictedTypesRule{context: context}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindTypeReference,
			ast.KindExpressionWithTypeArguments,
			ast.KindTupleType,
			ast.KindTypeLiteral,
			ast.KindBigIntKeyword,
			ast.KindBooleanKeyword,
			ast.KindNeverKeyword,
			ast.KindNumberKeyword,
			ast.KindObjectKeyword,
			ast.KindStringKeyword,
			ast.KindSymbolKeyword,
			ast.KindUndefinedKeyword,
			ast.KindUnknownKeyword,
			ast.KindVoidKeyword,
			ast.KindNullKeyword,
		},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptNoRestrictedTypesRule) OnEnterNode(node *ast.Node) bool {
	rule.restricted(node)
	return true
}

func (rule *typescriptNoRestrictedTypesRule) restricted(node *ast.Node) {
	types, _ := rule.Options()["types"].(map[string]any)
	if len(types) == 0 {
		return
	}
	check := func(target *ast.Node) {
		name := typescriptNoRestrictedTypesRemoveSpace(rule.Text(target))
		var config any
		for key, value := range types {
			if typescriptNoRestrictedTypesRemoveSpace(key) == name {
				config = value
				break
			}
		}
		if config == nil || config == false {
			return
		}
		custom := ""
		settings, _ := config.(map[string]any)
		if text, ok := config.(string); ok {
			custom = text
		} else if settings != nil {
			custom, _ = settings["message"].(string)
		}
		if custom != "" {
			custom = " " + custom
		}
		diagnostic := rule.context.Report(rule.context.Range(target), diagnostics.Don_t_use_0_as_a_type_1, name, custom)
		if replacement, ok := settings["fixWith"].(string); ok && replacement != "" {
			rule.fix(diagnostic, rule.Start(target), target.End(), replacement)
		}
		for _, replacement := range helpers.TypescriptSyntaxStrings(settings["suggest"]) {
			rule.suggest(diagnostic, rule.Start(target), target.End(), replacement, ast.NewCompilerDiagnostic(diagnostics.Replace_0_with_1, name, replacement))
		}
	}
	switch node.Kind {
	case ast.KindTypeReference:
		if node.Parent.Kind == ast.KindHeritageClause && node.Parent.Parent.Kind != ast.KindInterfaceDeclaration && node.Parent.AsHeritageClause().Token == ast.KindExtendsKeyword {
			return
		}
		check(node.AsTypeReferenceNode().TypeName)
		if node.TypeArgumentList() != nil {
			check(node)
		}
	case ast.KindExpressionWithTypeArguments:
		if node.Parent.Kind == ast.KindHeritageClause && (node.Parent.Parent.Kind == ast.KindInterfaceDeclaration || node.Parent.AsHeritageClause().Token == ast.KindImplementsKeyword) {
			check(node.Expression())
			if node.TypeArgumentList() != nil {
				check(node)
			}
		}
	case ast.KindTupleType:
		if len(node.AsTupleTypeNode().Elements.Nodes) == 0 {
			check(node)
		}
	case ast.KindTypeLiteral:
		if len(node.Members()) == 0 {
			check(node)
		}
	case ast.KindBigIntKeyword, ast.KindBooleanKeyword, ast.KindNeverKeyword, ast.KindNumberKeyword, ast.KindObjectKeyword, ast.KindStringKeyword, ast.KindSymbolKeyword, ast.KindUndefinedKeyword, ast.KindUnknownKeyword, ast.KindVoidKeyword:
		check(node)
	case ast.KindNullKeyword:
		if node.Parent.Kind == ast.KindLiteralType {
			check(node)
		}
	}
}

func (rule *typescriptNoRestrictedTypesRule) Options() map[string]any {
	if len(rule.context.Options) != 0 {
		options, _ := rule.context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func (rule *typescriptNoRestrictedTypesRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[rule.Start(node):node.End()]
}

func (rule *typescriptNoRestrictedTypesRule) fix(diagnostic *ast.Diagnostic, start, end int, text string) {
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), text)
	const name = "@typescript-eslint/no-restricted-types"
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "no-restricted-types"), name, ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "no-restricted-types")))
}

func (rule *typescriptNoRestrictedTypesRule) suggest(diagnostic *ast.Diagnostic, start, end int, text string, description *ast.Diagnostic) {
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), text)
	rule.AddSuggestion(diagnostic, "@typescript-eslint/no-restricted-types", tracker.GetTextChanges(), description)
}

func (rule *typescriptNoRestrictedTypesRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func typescriptNoRestrictedTypesRemoveSpace(text string) string {
	return strings.Map(func(character rune) rune {
		switch character {
		case '\t', '\n', '\v', '\f', '\r', ' ', '\u00a0', '\u1680', '\u2000', '\u2001', '\u2002', '\u2003', '\u2004', '\u2005', '\u2006', '\u2007', '\u2008', '\u2009', '\u200a', '\u2028', '\u2029', '\u202f', '\u205f', '\u3000', '\ufeff':
			return -1
		}
		return character
	}, text)
}
