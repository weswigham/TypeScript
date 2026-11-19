package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptDefaultParamLastRule struct {
	context Context
}

func newTypeScriptDefaultParamLast(context Context) Rule {
	rule := &typescriptDefaultParamLastRule{context: context}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindFunctionDeclaration,
			ast.KindFunctionExpression,
			ast.KindArrowFunction,
			ast.KindMethodDeclaration,
			ast.KindGetAccessor,
			ast.KindSetAccessor,
			ast.KindConstructor,
		},
	}
}

func (rule *typescriptDefaultParamLastRule) OnEnterNode(node *ast.Node) bool {
	rule.parameters(node)
	return true
}

func (rule *typescriptDefaultParamLastRule) parameters(node *ast.Node) {
	if !helpers.TypescriptExecutableFunction(node) {
		return
	}
	parameters := node.Parameters()

	if node.Kind == ast.KindFunctionDeclaration && node.Body() == nil {
		return
	}
	plain := false
	for _, parameter := range slices.Backward(parameters) {
		declaration := parameter.AsParameterDeclaration()
		if declaration.Initializer == nil && declaration.QuestionToken == nil && declaration.DotDotDotToken == nil {
			plain = true
		} else if plain && (declaration.Initializer != nil || declaration.QuestionToken != nil) {
			rule.context.Report(rule.context.Range(parameter), diagnostics.Default_parameters_should_be_last)
		}
	}
}
