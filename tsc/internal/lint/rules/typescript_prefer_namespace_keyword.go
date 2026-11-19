package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptPreferNamespaceKeywordRule struct {
	context Context
}

func newTypeScriptPreferNamespaceKeyword(context Context) Rule {
	rule := &typescriptPreferNamespaceKeywordRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindModuleDeclaration},
	}
}

func (rule *typescriptPreferNamespaceKeywordRule) OnEnterNode(node *ast.Node) bool {
	rule.namespaceKeyword(node)
	return true
}

func (rule *typescriptPreferNamespaceKeywordRule) namespaceKeyword(node *ast.Node) {
	if node.Kind != ast.KindModuleDeclaration || node.Name().Kind != ast.KindIdentifier {
		return
	}
	lexer := scanner.GetScannerForSourceFile(rule.context.File, rule.Start(node))
	for kind := lexer.Scan(); kind != ast.KindEndOfFile && lexer.TokenStart() < rule.Start(node.Name()); kind = lexer.Scan() {
		if kind == ast.KindModuleKeyword {
			diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Use_namespace_instead_of_module_to_declare_custom_TypeScript_modules)
			rule.fix(diagnostic, lexer.TokenStart(), lexer.TokenEnd(), "namespace")
			return
		}
	}
}

func (rule *typescriptPreferNamespaceKeywordRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func (rule *typescriptPreferNamespaceKeywordRule) fix(diagnostic *ast.Diagnostic, start, end int, text string) {
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), text)
	const name = "@typescript-eslint/prefer-namespace-keyword"
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "prefer-namespace-keyword"), name, ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "prefer-namespace-keyword")))
}
