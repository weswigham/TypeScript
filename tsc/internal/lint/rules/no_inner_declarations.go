package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noInnerDeclarationsRule struct{ context Context }

func newNoInnerDeclarationsRule(context Context) Rule {
	rule := &noInnerDeclarationsRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindFunctionDeclaration, ast.KindVariableDeclarationList},
	}
}

func (rule *noInnerDeclarationsRule) OnEnterNode(node *ast.Node) bool {
	rule.checkInnerDeclaration(node)
	return true
}

func (rule *noInnerDeclarationsRule) checkInnerDeclaration(node *ast.Node) {
	kind := "function"
	if node.Kind == ast.KindFunctionDeclaration {
		allow := true
		if value, ok := helpers.SharedRuleOptions(rule.context.Options, 1)["blockScopedFunctions"].(string); ok {
			allow = value != "disallow"
		}
		if allow && helpers.SharedScopeStrict(node.Parent) {
			return
		}
	} else if node.Kind == ast.KindVariableDeclarationList && node.Flags&ast.NodeFlagsBlockScoped == 0 && len(rule.context.Options) > 0 && rule.context.Options[0] == "both" {
		kind = "variable"
		if node.Parent.Kind == ast.KindVariableStatement {
			node = node.Parent
		}
	} else {
		return
	}
	parent := node.Parent
	if parent.Kind == ast.KindSourceFile || parent.Kind == ast.KindBlock && parent.Parent != nil && (ast.IsFunctionLike(parent.Parent) || parent.Parent.Kind == ast.KindClassStaticBlockDeclaration) {
		return
	}
	body := "program"
	for current := parent; current != nil; current = current.Parent {
		if ast.IsFunctionLike(current) {
			body = "function body"
			break
		}
		if current.Kind == ast.KindClassStaticBlockDeclaration {
			body = "class static block body"
			break
		}
	}
	rule.context.Report(rule.context.Range(node), diagnostics.Move_0_declaration_to_1_root, kind, body)
}
