package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptPreferForOfRule struct {
	helpers.TypescriptScopeRuleContext
}

func (rule *typescriptPreferForOfRule) OnEnterNode(node *ast.Node) bool {
	rule.preferForOf(node)
	return true
}

func (rule *typescriptPreferForOfRule) OnExitNode(node *ast.Node) {}

func tsScopeNumber(node *ast.Node, value string) bool {
	return node != nil && node.Kind == ast.KindNumericLiteral && node.Text() == value
}

func (rule *typescriptPreferForOfRule) preferForOf(node *ast.Node) {
	if node.Kind != ast.KindForStatement {
		return
	}
	loop := node.AsForStatement()
	if loop.Initializer == nil || loop.Initializer.Kind != ast.KindVariableDeclarationList || loop.Initializer.Flags&ast.NodeFlagsConst != 0 {
		return
	}
	declarations := loop.Initializer.AsVariableDeclarationList().Declarations.Nodes
	if len(declarations) != 1 || declarations[0].Name().Kind != ast.KindIdentifier || !tsScopeNumber(declarations[0].Initializer(), "0") || loop.Condition == nil || loop.Condition.Kind != ast.KindBinaryExpression || loop.Incrementor == nil {
		return
	}
	name := declarations[0].Name().Text()
	condition := loop.Condition.AsBinaryExpression()
	if condition.OperatorToken.Kind != ast.KindLessThanToken || !helpers.TsScopeIdentifier(condition.Left, name) || !ast.IsAccessExpression(condition.Right) {
		return
	}
	access := condition.Right
	var property *ast.Node
	if access.Kind == ast.KindPropertyAccessExpression {
		property = access.Name()
	} else {
		property = access.AsElementAccessExpression().ArgumentExpression
	}
	if !helpers.TsScopeIdentifier(property, "length") {
		return
	}
	increment := loop.Incrementor
	valid := false
	if increment.Kind == ast.KindPostfixUnaryExpression {
		valid = increment.AsPostfixUnaryExpression().Operator == ast.KindPlusPlusToken && helpers.TsScopeIdentifier(increment.AsPostfixUnaryExpression().Operand, name)
	} else if increment.Kind == ast.KindPrefixUnaryExpression {
		valid = increment.AsPrefixUnaryExpression().Operator == ast.KindPlusPlusToken && helpers.TsScopeIdentifier(increment.AsPrefixUnaryExpression().Operand, name)
	} else if increment.Kind == ast.KindBinaryExpression {
		binary := increment.AsBinaryExpression()
		if helpers.TsScopeIdentifier(binary.Left, name) {
			valid = binary.OperatorToken.Kind == ast.KindPlusEqualsToken && tsScopeNumber(binary.Right, "1")
			if binary.OperatorToken.Kind == ast.KindEqualsToken && binary.Right.Kind == ast.KindBinaryExpression {
				right := binary.Right.AsBinaryExpression()
				valid = right.OperatorToken.Kind == ast.KindPlusToken && (helpers.TsScopeIdentifier(right.Left, name) && tsScopeNumber(right.Right, "1") || tsScopeNumber(right.Left, "1") && helpers.TsScopeIdentifier(right.Right, name))
			}
		}
	}
	if !valid {
		return
	}
	binding := rule.Bindings().Decls[declarations[0].Name()]
	if binding == nil {
		return
	}
	arrayText := rule.Text(access.Expression())
	for _, reference := range binding.References {
		if !helpers.TsScopeContains(loop.Statement, reference.Node) {
			continue
		}
		parent := reference.Node.Parent
		if parent.Kind != ast.KindElementAccessExpression || parent.AsElementAccessExpression().ArgumentExpression != reference.Node || parent.Expression().Kind == ast.KindThisKeyword || rule.Text(parent.Expression()) != arrayText || ast.IsAssignmentTarget(parent) {
			return
		}
		outer := parent
		for outer.Parent.Kind == ast.KindParenthesizedExpression || outer.Parent.Kind == ast.KindAsExpression || outer.Parent.Kind == ast.KindTypeAssertionExpression || outer.Parent.Kind == ast.KindSatisfiesExpression || outer.Parent.Kind == ast.KindNonNullExpression {
			outer = outer.Parent
		}
		if ast.IsAssignmentTarget(outer) || outer.Parent.Kind == ast.KindDeleteExpression {
			return
		}
	}
	rule.Context.Report(rule.Context.Range(node), diagnostics.Expected_a_for_of_loop_instead_of_a_for_loop_with_this_simple_iteration)
}

func newTypeScriptPreferForOf(context Context) Rule {
	return &typescriptPreferForOfRule{Context: context, Name: "prefer-for-of"}
}
