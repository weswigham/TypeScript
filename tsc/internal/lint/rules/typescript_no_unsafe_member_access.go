package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoUnsafeMemberAccessRule struct {
	context Context
	states  map[*ast.Node]int
}

func newTypeScriptNoUnsafeMemberAccess(context Context) Rule {
	rule := &typescriptNoUnsafeMemberAccessRule{context: context, states: make(map[*ast.Node]int)}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindPropertyAccessExpression, ast.KindElementAccessExpression},
	}
}

func (rule *typescriptNoUnsafeMemberAccessRule) OnEnterNode(node *ast.Node) bool {
	if !ast.IsAccessExpression(node) {
		return true
	}
	ignored := false
	for parent := node.Parent; parent != nil; parent = parent.Parent {
		if parent.Kind == ast.KindHeritageClause {
			ignored = parent.AsHeritageClause().Token == ast.KindImplementsKeyword || parent.Parent.Kind == ast.KindInterfaceDeclaration
			break
		}
		if ast.IsStatement(parent) {
			break
		}
	}
	if !ignored {
		rule.member(node)
	}
	if node.Kind == ast.KindElementAccessExpression && !rule.optional(node) {
		property := ast.SkipParentheses(node.AsElementAccessExpression().ArgumentExpression)
		if property == nil || ast.IsLiteralExpression(property) || property.Kind == ast.KindPostfixUnaryExpression || property.Kind == ast.KindPrefixUnaryExpression && (property.AsPrefixUnaryExpression().Operator == ast.KindPlusPlusToken || property.AsPrefixUnaryExpression().Operator == ast.KindMinusMinusToken) {
			return true
		}
		value := rule.context.GetChecker().GetTypeAtLocation(property)
		if helpers.TypeSafetyAny(value) {
			message := diagnostics.Computed_name_0_resolves_to_an_any_value
			if helpers.TypeSafetyError(value) {
				message = diagnostics.The_type_of_computed_name_0_cannot_be_resolved
			}
			name := rule.context.File.Text()[scanner.GetTokenPosOfNode(property, rule.context.File, false):property.End()]
			rule.context.Report(rule.context.Range(property), message, "["+name+"]")
		}
	}
	return true
}

func (rule *typescriptNoUnsafeMemberAccessRule) member(node *ast.Node) int {
	if state := rule.states[node]; state != 0 {
		return state
	}
	if rule.optional(node) {
		rule.states[node] = 3
		return 3
	}
	object := ast.SkipParentheses(node.Expression())
	if ast.IsAccessExpression(object) && rule.member(object) == 1 {
		rule.states[node] = 1
		return 1
	}
	typeChecker := rule.context.GetChecker()
	value := typeChecker.GetTypeAtLocation(node.Expression())
	state := 2
	if helpers.TypeSafetyAny(value) {
		state = 1
		property := node.Name()
		if node.Kind == ast.KindElementAccessExpression {
			property = ast.SkipParentheses(node.AsElementAccessExpression().ArgumentExpression)
		}
		name := rule.context.File.Text()[scanner.GetTokenPosOfNode(property, rule.context.File, false):property.End()]
		if node.Kind == ast.KindElementAccessExpression {
			name = "[" + name + "]"
		} else {
			name = "." + name
		}
		message := diagnostics.Unsafe_member_access_0_on_an_any_value
		if helpers.TypeSafetyError(value) {
			message = diagnostics.Unsafe_member_access_0_on_a_type_that_cannot_be_resolved
		}
		if helpers.TypeSafetyImplicitThis(rule.context, node) {
			message = diagnostics.Unsafe_member_access_0_on_an_any_value_this_is_typed_as_any_You_can_try_to_fix_this_by_turning_on_the_noImplicitThis_compiler_option_or_adding_a_this_parameter_to_the_function
			if helpers.TypeSafetyError(helpers.TypeSafetyConstrain(typeChecker, typeChecker.GetTypeAtLocation(helpers.TypeSafetyThis(node)))) {
				message = diagnostics.Unsafe_member_access_0_The_type_of_this_cannot_be_resolved_You_can_try_to_fix_this_by_turning_on_the_noImplicitThis_compiler_option_or_adding_a_this_parameter_to_the_function
			}
		}
		rule.context.Report(rule.context.Range(property), message, name)
	}
	rule.states[node] = state
	return state
}

func (rule *typescriptNoUnsafeMemberAccessRule) optional(node *ast.Node) bool {
	if len(rule.context.Options) == 0 {
		return false
	}
	options, _ := rule.context.Options[0].(map[string]any)
	if options["allowOptionalChaining"] != true {
		return false
	}
	if node.Kind == ast.KindPropertyAccessExpression {
		return node.AsPropertyAccessExpression().QuestionDotToken != nil
	}
	return node.AsElementAccessExpression().QuestionDotToken != nil
}
