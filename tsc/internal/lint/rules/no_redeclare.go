package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noRedeclareRule struct {
	helpers.LexicalScopeAnalysis
}

func newNoRedeclareRule(context Context) Rule {
	rule := &noRedeclareRule{LexicalScopeAnalysis: helpers.NewLexicalScopeAnalysis(context)}

	return Rule{
		Enter: rule.OnEnterNode,
		Exit:  rule.OnExitNode,
		ExitKinds: []ast.Kind{
			ast.KindFunctionDeclaration,
			ast.KindFunctionExpression,
			ast.KindArrowFunction,
			ast.KindMethodDeclaration,
			ast.KindGetAccessor,
			ast.KindSetAccessor,
			ast.KindConstructor,
			ast.KindMethodSignature,
			ast.KindCallSignature,
			ast.KindJSDocSignature,
			ast.KindConstructSignature,
			ast.KindIndexSignature,
			ast.KindFunctionType,
			ast.KindConstructorType,
			ast.KindClassDeclaration,
			ast.KindClassExpression,
			ast.KindSourceFile,
			ast.KindBlock,
			ast.KindModuleDeclaration,
			ast.KindForStatement,
			ast.KindForInStatement,
			ast.KindForOfStatement,
			ast.KindCatchClause,
			ast.KindCaseBlock,
			ast.KindTypeAliasDeclaration,
			ast.KindInterfaceDeclaration,
			ast.KindMappedType,
			ast.KindEnumDeclaration,
			ast.KindClassStaticBlockDeclaration,
		},
	}
}

func (rule *noRedeclareRule) OnEnterNode(node *ast.Node) bool {
	rule.Model.Enter(rule.Context, node)
	return true
}

func (rule *noRedeclareRule) OnExitNode(node *ast.Node) {
	rule.Model.Exit(node)
	if node.Kind != ast.KindSourceFile {
		return
	}
	rule.Model.Resolve(rule.Context)
	for _, binding := range rule.Model.Bindings {
		rule.redeclare(binding)
	}
}

func (rule *noRedeclareRule) redeclare(binding *helpers.TsScopeBinding) {
	builtin := rule.Boolean("builtinGlobals", true) && binding.Frame.Parent == nil && !ast.IsExternalModule(rule.Context.File) && rule.KnownGlobal(binding.Identifiers[0])
	for position, identifier := range binding.Identifiers {
		if builtin {
			rule.Context.Report(rule.Context.Range(identifier), diagnostics.X_0_is_already_defined_as_a_built_in_global_variable, binding.Name)
		} else if position != 0 {
			rule.Context.Report(rule.Context.Range(identifier), diagnostics.X_0_is_already_defined, binding.Name)
		}
	}
}
