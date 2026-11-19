package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type classMethodsUseThisRule struct {
	context Context
}

func newClassMethodsUseThis(context Context) Rule {
	rule := &classMethodsUseThisRule{context: context}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindArrowFunction,
			ast.KindFunctionExpression,
			ast.KindGetAccessor,
			ast.KindMethodDeclaration,
			ast.KindSetAccessor,
		},
	}
}

func (rule *classMethodsUseThisRule) OnEnterNode(node *ast.Node) bool {
	member := node
	if node.Kind == ast.KindFunctionExpression || node.Kind == ast.KindArrowFunction {
		if node.Parent.Kind != ast.KindPropertyDeclaration || node.Parent.Initializer() != node || !helpers.BooleanOptionValue(helpers.SyntaxObject(rule.context, 0), "enforceForClassFields", true) {
			return true
		}
		member = node.Parent
	} else if node.Kind != ast.KindMethodDeclaration && node.Kind != ast.KindGetAccessor && node.Kind != ast.KindSetAccessor {
		return true
	}
	if !ast.IsClassLike(member.Parent) || helpers.HasStaticModifier(member) || node.Body() == nil {
		return true
	}
	options := helpers.SyntaxObject(rule.context, 0)
	flags := ast.GetCombinedModifierFlags(member)
	if helpers.BooleanOptionValue(options, "ignoreOverrideMethods", false) && flags&ast.ModifierFlagsOverride != 0 {
		return true
	}
	ignoreImplements := helpers.StringOptionValue(options["ignoreClassesWithImplements"], "")
	if ignoreImplements != "" {
		if ast.GetHeritageClause(member.Parent, ast.KindImplementsKeyword) != nil && (ignoreImplements == "all" || ignoreImplements == "public-fields" && member.Name().Kind != ast.KindPrivateIdentifier && flags&(ast.ModifierFlagsPrivate|ast.ModifierFlagsProtected) == 0) {
			return true
		}
	}
	if member.Name().Kind != ast.KindComputedPropertyName {
		if name, ok := helpers.StaticDeclarationNameText(member.Name()); ok && helpers.StringListOptionContains(options["exceptMethods"], name) {
			return true
		}
	}
	used := false
	for _, parameter := range node.Parameters() {
		if helpers.UsesLexicalThisOrSuper(parameter, parameter, false) {
			used = true
		}
	}
	used = used || helpers.UsesLexicalThisOrSuper(node.Body(), node.Body(), false)
	if !used {
		name := helpers.FunctionDiagnosticName(member)
		if member.Kind == ast.KindPropertyDeclaration {
			name = "arrow function"
			if node.Kind == ast.KindFunctionExpression {
				name = "function"
			}
			if text, ok := helpers.StaticDeclarationNameText(member.Name()); ok {
				name += " '" + text + "'"
			}
		}
		rule.context.Report(rule.context.Range(node), diagnostics.Expected_this_to_be_used_by_class_0, name)
	}
	return true
}
