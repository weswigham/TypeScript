package rules

import (
	"strconv"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptPreferEnumInitializersRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func newTypeScriptPreferEnumInitializers(context Context) Rule {
	rule := &typescriptPreferEnumInitializersRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindEnumDeclaration},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptPreferEnumInitializersRule) OnEnterNode(node *ast.Node) bool {
	rule.enumInitializers(node)
	return true
}

func (rule *typescriptPreferEnumInitializersRule) enumInitializers(node *ast.Node) {
	if node.Kind != ast.KindEnumDeclaration {
		return
	}
	for index, member := range node.AsEnumDeclaration().Members.Nodes {
		if member.Initializer() != nil {
			continue
		}
		name := rule.Text(member)
		diagnostic := rule.context.Report(rule.context.Range(member), diagnostics.The_value_of_the_member_0_should_be_explicitly_defined, name)
		for _, value := range []string{strconv.Itoa(index), strconv.Itoa(index + 1), "'" + name + "'"} {
			rule.suggest(diagnostic, rule.Start(member), member.End(), name+" = "+value, ast.NewCompilerDiagnostic(diagnostics.Can_be_fixed_to_0_1, name, value))
		}
	}
}

func (rule *typescriptPreferEnumInitializersRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[rule.Start(node):node.End()]
}

func (rule *typescriptPreferEnumInitializersRule) suggest(diagnostic *ast.Diagnostic, start, end int, text string, description *ast.Diagnostic) {
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), text)
	rule.AddSuggestion(diagnostic, "@typescript-eslint/prefer-enum-initializers", tracker.GetTextChanges(), description)
}

func (rule *typescriptPreferEnumInitializersRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}
