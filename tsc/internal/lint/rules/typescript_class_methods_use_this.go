package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptClassMethodsUseThisRule struct {
	context Context
}

func (rule *typescriptClassMethodsUseThisRule) OnEnterNode(node *ast.Node) bool {
	rule.classThis(node)
	return true
}

func (rule *typescriptClassMethodsUseThisRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptClassMethodsUseThisRule) classThis(node *ast.Node) {
	if !helpers.FunctionHasBody(node) || node.Kind == ast.KindConstructor {
		return
	}
	member := node
	if node.Kind == ast.KindFunctionExpression || node.Kind == ast.KindArrowFunction {
		_, parent := helpers.OuterParenthesizedNodeAndParent(node)
		if parent == nil || parent.Kind != ast.KindPropertyDeclaration || !rule.Boolean("enforceForClassFields", true) {
			return
		}
		member = parent
	} else if node.Kind != ast.KindMethodDeclaration && node.Kind != ast.KindGetAccessor && node.Kind != ast.KindSetAccessor {
		return
	}
	if member.Parent == nil || !ast.IsClassLike(member.Parent) || ast.HasSyntacticModifier(member, ast.ModifierFlagsStatic) || rule.Boolean("ignoreOverrideMethods", false) && ast.HasSyntacticModifier(member, ast.ModifierFlagsOverride) || typescriptClassMethodsUseThisUsesThis(node.Body()) {
		return
	}
	if ast.GetHeritageClause(member.Parent, ast.KindImplementsKeyword) != nil {
		ignore := rule.Options()["ignoreClassesThatImplementAnInterface"]
		if ignore == true || ignore == "public-fields" && !ast.HasSyntacticModifier(member, ast.ModifierFlagsPrivate|ast.ModifierFlagsProtected) {
			return
		}
	}
	if member.Name() != nil && member.Name().Kind != ast.KindComputedPropertyName {
		name, known := helpers.StaticPropertyNameText(member.Name())
		if known && slices.Contains(helpers.TypescriptSyntaxStrings(rule.Options()["exceptMethods"]), name) {
			return
		}
	}
	name := helpers.FunctionDiagnosticName(member)
	if member.Kind == ast.KindPropertyDeclaration {
		name = "method '" + rule.Text(member.Name()) + "'"
	}
	rule.context.Report(helpers.FunctionHeadRange(rule.context, node), diagnostics.Expected_this_to_be_used_by_class_0, name)
}

func (rule *typescriptClassMethodsUseThisRule) Boolean(name string, fallback bool) bool {
	return helpers.BooleanOptionValue(rule.Options(), name, fallback)
}

func (rule *typescriptClassMethodsUseThisRule) Options() map[string]any {
	options, _ := rule.option(0).(map[string]any)
	return options
}

func (rule *typescriptClassMethodsUseThisRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[scanner.GetTokenPosOfNode(node, rule.context.File, false):node.End()]
}

func (rule *typescriptClassMethodsUseThisRule) option(index int) any {
	if index < len(rule.context.Options) {
		return rule.context.Options[index]
	}
	return nil
}

func typescriptClassMethodsUseThisUsesThis(node *ast.Node) bool {
	if node == nil {
		return false
	}
	if node.Kind == ast.KindThisKeyword || node.Kind == ast.KindSuperKeyword {
		return true
	}
	if ast.IsFunctionLike(node) && node.Kind != ast.KindArrowFunction {
		return false
	}
	if ast.IsClassLike(node) {
		if slices.ContainsFunc(node.Decorators(), typescriptClassMethodsUseThisUsesThis) {
			return true
		}
		if node.ClassLikeData().HeritageClauses != nil {
			if slices.ContainsFunc(node.ClassLikeData().HeritageClauses.Nodes, typescriptClassMethodsUseThisUsesThis) {
				return true
			}
		}
		for _, member := range node.Members() {
			if name := member.Name(); name != nil && name.Kind == ast.KindComputedPropertyName && typescriptClassMethodsUseThisUsesThis(name.Expression()) {
				return true
			}
			if slices.ContainsFunc(member.Decorators(), typescriptClassMethodsUseThisUsesThis) {
				return true
			}
		}
		return false
	}
	return node.ForEachChild(typescriptClassMethodsUseThisUsesThis)
}

func newTypeScriptClassMethodsUseThis(context Context) Rule {
	return &typescriptClassMethodsUseThisRule{context: context}
}
