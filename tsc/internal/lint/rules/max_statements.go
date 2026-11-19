package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type maxStatementsRule struct {
	context Context
}

func newMaxStatements(context Context) Rule {
	rule := &maxStatementsRule{context: context}

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

func (rule *maxStatementsRule) OnEnterNode(node *ast.Node) bool {
	if !helpers.FunctionHasBody(node) {
		return true
	}
	if helpers.BooleanOptionValue(helpers.SyntaxObject(rule.context, 1), "ignoreTopLevelFunctions", false) && helpers.EnclosingFunctionOrStaticBlock(node) == nil {
		count := 0
		helpers.WalkSyntaxWhile(rule.context.File.AsNode(), func(child *ast.Node) bool {
			if helpers.FunctionHasBody(child) && helpers.EnclosingFunctionOrStaticBlock(child) == nil {
				count++
			}
			return true
		})
		if count == 1 {
			return true
		}
	}
	count := 0
	helpers.WalkSyntaxWhile(node.Body(), func(child *ast.Node) bool {
		if helpers.FunctionHasBody(child) || child.Kind == ast.KindClassStaticBlockDeclaration {
			return false
		}
		if child.Kind == ast.KindBlock {
			count += len(child.Statements())
		}
		return true
	})
	if maximum := helpers.SyntaxMaximum(rule.context, 10); count > maximum {
		rule.context.Report(rule.context.Range(node), diagnostics.X_0_has_too_many_statements_1_Maximum_allowed_is_2, helpers.CapitalizeFirstRune(helpers.FunctionDiagnosticName(node)), count, maximum)
	}
	return true
}
