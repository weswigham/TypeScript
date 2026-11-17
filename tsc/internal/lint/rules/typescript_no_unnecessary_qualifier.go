package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoUnnecessaryQualifierRule struct {
	context    Context
	namespaces []*ast.Node
	failed     *ast.Node
}

func (rule *typescriptNoUnnecessaryQualifierRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindModuleBlock {
		rule.namespaces = append(rule.namespaces, node.Parent)
	}
	if node.Kind == ast.KindEnumDeclaration {
		rule.namespaces = append(rule.namespaces, node)
	}
	if rule.failed != nil {
		return true
	}
	var qualifier, name *ast.Node
	if node.Kind == ast.KindQualifiedName {
		qualifier, name = node.AsQualifiedName().Left, node.AsQualifiedName().Right
	} else if node.Kind == ast.KindPropertyAccessExpression {
		qualifier, name = node.Expression(), node.Name()
		for current := qualifier; current.Kind != ast.KindIdentifier; current = current.Expression() {
			if current.Kind != ast.KindPropertyAccessExpression {
				return true
			}
		}
	} else {
		return true
	}
	c := rule.context.GetChecker()
	namespace := c.GetSymbolAtLocation(qualifier)
	if namespace == nil {
		return true
	}
	if namespace.Flags()&ast.SymbolFlagsAlias != 0 {
		namespace = c.GetAliasedSymbol(namespace)
	}
	inScope := false
	for _, declaration := range namespace.Declarations() {
		if slices.Contains(rule.namespaces, declaration) {
			inScope = true
			break
		}
	}
	if !inScope {
		return true
	}
	accessed := c.GetSymbolAtLocation(name)
	if accessed == nil {
		return true
	}
	resolved := c.ResolveName(name.Text(), qualifier, accessed.Flags(), false)
	if resolved == nil || c.GetExportSymbolOfSymbol(resolved) != accessed {
		return true
	}
	rule.failed = node
	diagnostic := rule.context.Report(rule.context.Range(qualifier), diagnostics.Qualifier_is_unnecessary_since_0_is_in_scope, name.Text())
	helpers.TypeSafetyAssertionFix(rule.context, diagnostic, "no-unnecessary-qualifier", scanner.GetTokenPosOfNode(qualifier, rule.context.File, false), scanner.GetTokenPosOfNode(name, rule.context.File, false), "")
	return true
}

func (rule *typescriptNoUnnecessaryQualifierRule) OnExitNode(node *ast.Node) {
	if node == rule.failed {
		rule.failed = nil
	}
	if node.Kind == ast.KindModuleBlock || node.Kind == ast.KindEnumDeclaration {
		rule.namespaces = rule.namespaces[:len(rule.namespaces)-1]
	}
}

func newTypeScriptNoUnnecessaryQualifier(context Context) Rule {
	return &typescriptNoUnnecessaryQualifierRule{context: context}
}
