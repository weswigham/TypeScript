package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type typescriptNoMisusedNewRule struct {
	context Context
}

func (rule *typescriptNoMisusedNewRule) OnEnterNode(node *ast.Node) bool {
	rule.misusedNew(node)
	return true
}

func (rule *typescriptNoMisusedNewRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptNoMisusedNewRule) misusedNew(node *ast.Node) {
	name := node.Name()
	if node.Kind == ast.KindMethodSignature && name != nil && name.Kind == ast.KindIdentifier && name.Text() == "constructor" {
		rule.context.Report(rule.context.Range(node), diagnostics.Interfaces_cannot_be_constructed_only_classes)
		return
	}
	class := node.Kind == ast.KindMethodDeclaration && name != nil && name.Kind == ast.KindIdentifier && name.Text() == "new" && node.Body() == nil && ast.IsClassLike(node.Parent)
	construct := node.Kind == ast.KindConstructSignature && node.Parent.Kind == ast.KindInterfaceDeclaration
	if !class && !construct {
		return
	}
	result := node.Type()
	parent := node.Parent
	if result == nil || result.Kind != ast.KindTypeReference || parent.Name() == nil {
		return
	}
	resultName := result.AsTypeReferenceNode().TypeName
	if resultName.Kind != ast.KindIdentifier || resultName.Text() != parent.Name().Text() {
		return
	}
	if class {
		rule.context.Report(rule.context.Range(node), diagnostics.Class_cannot_have_method_named_new)
	} else {
		rule.context.Report(rule.context.Range(node), diagnostics.Interfaces_cannot_be_constructed_only_classes)
	}
}

func newTypeScriptNoMisusedNew(context Context) Rule {
	return &typescriptNoMisusedNewRule{context: context}
}
