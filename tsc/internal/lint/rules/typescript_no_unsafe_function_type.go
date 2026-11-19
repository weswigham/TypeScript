package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type typescriptNoUnsafeFunctionTypeRule struct {
	context Context
}

func newTypeScriptNoUnsafeFunctionType(context Context) Rule {
	rule := &typescriptNoUnsafeFunctionTypeRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindTypeReference, ast.KindExpressionWithTypeArguments},
	}
}

func (rule *typescriptNoUnsafeFunctionTypeRule) OnEnterNode(node *ast.Node) bool {
	rule.unsafeFunction(node)
	return true
}

func (rule *typescriptNoUnsafeFunctionTypeRule) unsafeFunction(node *ast.Node) {
	var name *ast.Node
	if node.Kind == ast.KindTypeReference {
		name = node.AsTypeReferenceNode().TypeName
	} else if node.Kind == ast.KindExpressionWithTypeArguments && node.Parent.Kind == ast.KindHeritageClause {
		name = node.Expression()
	}
	if name == nil || name.Kind != ast.KindIdentifier || name.Text() != "Function" || !rule.global(name) {
		return
	}
	if node.Parent.Kind == ast.KindHeritageClause && node.Parent.AsHeritageClause().Token == ast.KindExtendsKeyword && node.Parent.Parent.Kind != ast.KindInterfaceDeclaration {
		return
	}
	rule.context.Report(rule.context.Range(name), diagnostics.The_Function_type_accepts_any_function_like_value_Prefer_explicitly_defining_any_function_parameters_and_return_type)
}

func (rule *typescriptNoUnsafeFunctionTypeRule) global(node *ast.Node) bool {
	for scope := node.Parent; scope != nil; scope = scope.Parent {
		if scope.Locals().Get(node.Text()) != nil {
			return false
		}
	}
	return true
}
