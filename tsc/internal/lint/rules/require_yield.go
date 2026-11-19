package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type requireYieldRule struct {
	context Context
}

func newRequireYield(context Context) Rule {
	rule := &requireYieldRule{
		context: context,
	}

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
			ast.KindMethodSignature,
			ast.KindCallSignature,
			ast.KindJSDocSignature,
			ast.KindConstructSignature,
			ast.KindIndexSignature,
			ast.KindFunctionType,
			ast.KindConstructorType,
		},
	}
}

func (rule *requireYieldRule) OnEnterNode(node *ast.Node) bool {
	rule.checkYield(node)
	return true
}

func (rule *requireYieldRule) checkYield(node *ast.Node) {
	if !ast.IsFunctionLike(node) || node.BodyData() == nil || node.BodyData().AsteriskToken == nil || node.Body() == nil || node.Body().Kind != ast.KindBlock || len(node.Body().AsBlock().Statements.Nodes) == 0 {
		return
	}
	var hasYield func(*ast.Node) bool
	hasYield = func(child *ast.Node) bool {
		if child.Kind == ast.KindYieldExpression {
			return true
		}
		if ast.IsFunctionLike(child) {
			name := child.Name()
			return name != nil && name.Kind == ast.KindComputedPropertyName && hasYield(name.Expression())
		}
		return child.ForEachChild(hasYield)
	}
	if !hasYield(node.Body()) {
		start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
		if node.Parent.Kind == ast.KindPropertyAssignment && ast.SkipParentheses(node.Parent.Initializer()) == node {
			start = scanner.GetTokenPosOfNode(node.Parent, rule.context.File, false)
		}
		end := node.FunctionLikeData().Parameters.Pos() - 1
		rule.context.Report(core.NewTextRange(start, end), diagnostics.This_generator_function_does_not_have_yield)
	}
}
