package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type defaultParamLastRule struct {
	context Context
}

func newDefaultParamLast(context Context) Rule {
	rule := &defaultParamLastRule{context: context}

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

func (rule *defaultParamLastRule) OnEnterNode(node *ast.Node) bool {
	if helpers.FunctionHasBody(node) {
		required := false
		parameters := node.Parameters()
		for _, parameterNode := range slices.Backward(parameters) {
			parameter := parameterNode.AsParameterDeclaration()
			if parameter.Initializer == nil && parameter.QuestionToken == nil && parameter.DotDotDotToken == nil {
				required = true
			} else if required {
				rule.context.Report(rule.context.Range(parameterNode), diagnostics.Default_parameters_should_be_last)
			}
		}
	}
	return true
}
