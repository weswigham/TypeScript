package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoUnnecessaryParameterPropertyAssignmentRule struct {
	helpers.TypescriptScopeRuleContext
}

func newTypeScriptNoUnnecessaryParameterPropertyAssignment(context Context) Rule {
	rule := &typescriptNoUnnecessaryParameterPropertyAssignmentRule{Context: context, Name: "no-unnecessary-parameter-property-assignment"}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindClassDeclaration, ast.KindClassExpression},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptNoUnnecessaryParameterPropertyAssignmentRule) OnEnterNode(node *ast.Node) bool {
	if ast.IsClassLike(node) {
		rule.parameterAssignments(node)
	}
	return true
}

func tsScopeThisMember(node *ast.Node) string {
	if node != nil && ast.IsAccessExpression(node) && ast.SkipParentheses(node.Expression()).Kind == ast.KindThisKeyword {
		return helpers.TsScopeMemberName(node)
	}
	return ""
}

func tsScopeArrowIIFE(node *ast.Node) bool {
	if node.Kind != ast.KindArrowFunction {
		return false
	}
	for node.Parent != nil && node.Parent.Kind == ast.KindParenthesizedExpression {
		node = node.Parent
	}
	return node.Parent != nil && node.Parent.Kind == ast.KindCallExpression && node.Parent.Expression() == node
}

func (rule *typescriptNoUnnecessaryParameterPropertyAssignmentRule) parameterAssignments(class *ast.Node) {
	fieldWrites := make(map[string]bool)
	for _, member := range class.Members() {
		if member.Kind != ast.KindPropertyDeclaration || member.Initializer() == nil {
			continue
		}
		helpers.TsScopeWalk(member.Initializer(), func(node *ast.Node) bool {
			if ast.IsClassLike(node) || ast.IsFunctionLike(node) && !tsScopeArrowIIFE(node) {
				return false
			}
			if node.Kind == ast.KindBinaryExpression && ast.IsAssignmentOperator(node.AsBinaryExpression().OperatorToken.Kind) {
				if name := tsScopeThisMember(node.AsBinaryExpression().Left); name != "" {
					fieldWrites[name] = true
				}
			}
			return true
		})
	}
	for _, constructor := range class.Members() {
		if constructor.Kind != ast.KindConstructor || constructor.Body() == nil {
			continue
		}
		properties := make(map[string]*helpers.TsScopeBinding)
		for _, parameter := range constructor.Parameters() {
			if parameter.Name().Kind == ast.KindIdentifier && ast.GetCombinedModifierFlags(parameter)&ast.ModifierFlagsParameterPropertyModifier != 0 {
				properties[parameter.Name().Text()] = rule.Bindings().Decls[parameter.Name()]
			}
		}
		dirty := make(map[string]bool)
		helpers.TsScopeWalk(constructor.Body(), func(node *ast.Node) bool {
			if ast.IsClassLike(node) || ast.IsFunctionLike(node) && !tsScopeArrowIIFE(node) {
				return false
			}
			if node.Kind != ast.KindBinaryExpression || !ast.IsAssignmentOperator(node.AsBinaryExpression().OperatorToken.Kind) {
				return true
			}
			assignment := node.AsBinaryExpression()
			left := ast.SkipParentheses(assignment.Left)
			if left.Kind == ast.KindIdentifier {
				if binding := properties[left.Text()]; binding != nil && rule.Bindings().Nodes[left].Find(left.Text()) == binding {
					dirty[left.Text()] = true
				}
				return true
			}
			name := tsScopeThisMember(left)
			if name == "" {
				return true
			}
			var right *ast.Node
			switch assignment.OperatorToken.Kind {
			case ast.KindEqualsToken, ast.KindQuestionQuestionEqualsToken, ast.KindAmpersandAmpersandEqualsToken, ast.KindBarBarEqualsToken:
				right = ast.SkipParentheses(assignment.Right)
			default:
				dirty[name] = true
				return true
			}
			for right.Kind == ast.KindAsExpression || right.Kind == ast.KindNonNullExpression {
				right = ast.SkipParentheses(right.Expression())
			}
			if helpers.TsScopeIdentifier(right, name) && properties[name] != nil && rule.Bindings().Nodes[right].Find(name) == properties[name] && !dirty[name] && !fieldWrites[name] {
				rule.Context.Report(rule.Context.Range(node), diagnostics.This_assignment_is_unnecessary_since_it_is_already_assigned_by_a_parameter_property)
			}
			return true
		})
	}
}
