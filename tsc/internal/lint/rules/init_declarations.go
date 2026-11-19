package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type initDeclarationsRule struct {
	context Context
}

func newInitDeclarations(context Context) Rule {
	rule := &initDeclarationsRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindVariableDeclaration},
	}
}

func (rule *initDeclarationsRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindVariableDeclaration {
		return true
	}
	declaration := node.AsVariableDeclaration()
	if declaration.Name().Kind != ast.KindIdentifier || node.Parent.Kind != ast.KindVariableDeclarationList {
		return true
	}
	for parent := node; parent != nil; parent = parent.Parent {
		if ast.GetCombinedModifierFlags(parent)&ast.ModifierFlagsAmbient != 0 {
			return true
		}
	}
	list := node.Parent
	parent := list.Parent
	isFor := parent.Kind == ast.KindForStatement || parent.Kind == ast.KindForInStatement || parent.Kind == ast.KindForOfStatement
	initialized := declaration.Initializer != nil || isFor && parent.Initializer() == list
	mode := helpers.StringOptionValue(helpers.SyntaxOption(rule.context, 0), "always")
	if mode == "always" && !initialized {
		rule.context.Report(rule.context.Range(node), diagnostics.Variable_0_should_be_initialized_on_declaration, declaration.Name().Text())
	}
	if mode == "never" && initialized && list.Flags&(ast.NodeFlagsConst|ast.NodeFlagsUsing|ast.NodeFlagsAwaitUsing) == 0 && !(isFor && helpers.BooleanOptionValue(helpers.SyntaxObject(rule.context, 1), "ignoreForLoopInit", false)) {
		rule.context.Report(rule.context.Range(node), diagnostics.Variable_0_should_not_be_initialized_on_declaration, declaration.Name().Text())
	}
	return true
}
