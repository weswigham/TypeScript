package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noUndefinedRule struct{ context Context }

func newNoUndefinedRule(context Context) Rule {
	return &noUndefinedRule{context: context}
}

func (rule *noUndefinedRule) OnEnterNode(node *ast.Node) bool {
	rule.undefinedIdentifier(node)
	return true
}

func (rule *noUndefinedRule) OnExitNode(node *ast.Node) {}

func (rule *noUndefinedRule) undefinedIdentifier(node *ast.Node) {
	if node.Kind != ast.KindIdentifier || node.Text() != "undefined" {
		return
	}
	declaration := false
	if ast.IsDeclarationName(node) {
		switch node.Parent.Kind {
		case ast.KindVariableDeclaration, ast.KindBindingElement, ast.KindParameter, ast.KindFunctionDeclaration, ast.KindFunctionExpression, ast.KindClassDeclaration, ast.KindClassExpression, ast.KindImportClause, ast.KindImportSpecifier, ast.KindNamespaceImport:
			declaration = true
		}
	}
	reference := helpers.SharedExpressionReference(node)
	if parent := node.Parent; parent.Kind == ast.KindExportSpecifier {
		specifier := parent.AsExportSpecifier()
		reference = (specifier.PropertyName == node || specifier.PropertyName == nil && parent.Name() == node) && parent.Parent.Parent.Kind == ast.KindExportDeclaration && parent.Parent.Parent.AsExportDeclaration().ModuleSpecifier == nil
	}
	if declaration || reference && rule.context.GetChecker().ResolveName("undefined", node, ast.SymbolFlagsValue, false) != nil {
		rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_use_of_undefined)
	}
}
