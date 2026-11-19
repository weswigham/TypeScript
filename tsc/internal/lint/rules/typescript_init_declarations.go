package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptInitDeclarationsRule struct {
	context Context
}

func newTypeScriptInitDeclarations(context Context) Rule {
	rule := &typescriptInitDeclarationsRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindVariableDeclaration},
	}
}

func (rule *typescriptInitDeclarationsRule) OnEnterNode(node *ast.Node) bool {
	rule.initialization(node)
	return true
}

func (rule *typescriptInitDeclarationsRule) initialization(node *ast.Node) {
	if node.Kind != ast.KindVariableDeclaration || node.Parent.Kind != ast.KindVariableDeclarationList || node.Name().Kind != ast.KindIdentifier {
		return
	}
	mode := helpers.StringOptionValue(rule.option(0), "always")
	if mode == "always" {
		for parent := node; parent != nil; parent = parent.Parent {
			if ast.GetCombinedModifierFlags(parent)&ast.ModifierFlagsAmbient != 0 {
				return
			}
		}
	}
	list := node.Parent
	parent := list.Parent
	loop := parent.Kind == ast.KindForStatement || parent.Kind == ast.KindForInStatement || parent.Kind == ast.KindForOfStatement
	initialized := node.Initializer() != nil || parent.Kind == ast.KindForInStatement || parent.Kind == ast.KindForOfStatement
	if mode == "always" && !initialized {
		rule.context.Report(rule.context.Range(node.Name()), diagnostics.Variable_0_should_be_initialized_on_declaration, node.Name().Text())
	} else if mode == "never" && initialized && list.Flags&(ast.NodeFlagsConst|ast.NodeFlagsUsing) == 0 {
		options, _ := rule.option(1).(map[string]any)
		if !loop || !helpers.BooleanOptionValue(options, "ignoreForLoopInit", false) {
			rule.context.Report(rule.context.Range(node), diagnostics.Variable_0_should_not_be_initialized_on_declaration, node.Name().Text())
		}
	}
}

func (rule *typescriptInitDeclarationsRule) option(index int) any {
	if index < len(rule.context.Options) {
		return rule.context.Options[index]
	}
	return nil
}
