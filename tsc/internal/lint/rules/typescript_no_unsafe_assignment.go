package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoUnsafeAssignmentRule struct{ context Context }

func newTypeScriptNoUnsafeAssignment(context Context) Rule {
	rule := &typescriptNoUnsafeAssignmentRule{context: context}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindVariableDeclaration,
			ast.KindParameter,
			ast.KindPropertyDeclaration,
			ast.KindBindingElement,
			ast.KindBinaryExpression,
			ast.KindPropertyAssignment,
			ast.KindShorthandPropertyAssignment,
			ast.KindSpreadElement,
			ast.KindJsxAttribute,
		},
	}
}

func (rule *typescriptNoUnsafeAssignmentRule) OnEnterNode(node *ast.Node) bool {
	typeChecker := rule.context.GetChecker()
	switch node.Kind {
	case ast.KindVariableDeclaration, ast.KindParameter, ast.KindPropertyDeclaration, ast.KindBindingElement:
		if node.Initializer() == nil {
			break
		}
		compare := node.Kind == ast.KindParameter || node.Kind == ast.KindBindingElement || node.Type() != nil
		if !rule.assignment(node.Name(), node.Initializer(), node, compare, nil) && node.Kind != ast.KindPropertyDeclaration {
			rule.destructure(node.Name(), typeChecker.GetTypeAtLocation(node.Initializer()))
		}
	case ast.KindBinaryExpression:
		binary := node.AsBinaryExpression()
		if binary.OperatorToken.Kind == ast.KindEqualsToken && !rule.assignment(binary.Left, binary.Right, node, true, nil) {
			rule.destructure(binary.Left, typeChecker.GetTypeAtLocation(binary.Right))
		}
	case ast.KindPropertyAssignment:
		if node.Parent.Kind != ast.KindObjectLiteralExpression || ast.IsAssignmentTarget(node.Parent) {
			break
		}
		rule.assignment(node.Name(), node.Initializer(), node, true, typeChecker.GetContextualTypeForObjectLiteralElement(node, checker.ContextFlagsNone))
	case ast.KindShorthandPropertyAssignment:
		if node.Parent.Kind != ast.KindObjectLiteralExpression || ast.IsAssignmentTarget(node.Parent) {
			break
		}
		if initializer := node.AsShorthandPropertyAssignment().ObjectAssignmentInitializer; initializer != nil {
			rule.assignment(node.Name(), initializer, node, true, nil)
		} else {
			rule.assignment(node.Name(), node.Name(), node, true, typeChecker.GetContextualTypeForObjectLiteralElement(node, checker.ContextFlagsNone))
		}
	case ast.KindSpreadElement:
		if node.Parent.Kind == ast.KindArrayLiteralExpression && !ast.IsAssignmentTarget(node.Parent) {
			value := typeChecker.GetTypeAtLocation(node.Expression())
			if helpers.TypeSafetyAny(value) || helpers.TypeSafetyArray(typeChecker, value, checker.TypeFlagsAny) {
				rule.context.Report(rule.context.Range(node), diagnostics.Unsafe_spread_of_an_0_value_in_an_array, typeSafetyAnyName(value))
			}
		}
	case ast.KindJsxAttribute:
		initializer := node.Initializer()
		if initializer != nil && initializer.Kind == ast.KindJsxExpression && initializer.Expression() != nil {
			expression := initializer.Expression()
			rule.assignment(node.Name(), expression, expression, true, typeChecker.GetContextualType(expression, checker.ContextFlagsNone))
		}
	}
	return true
}

func (rule *typescriptNoUnsafeAssignmentRule) assignment(receiverNode, senderNode, reportingNode *ast.Node, compare bool, contextual *checker.Type) bool {
	typeChecker := rule.context.GetChecker()
	receiver := contextual
	if receiver == nil {
		receiver = typeChecker.GetTypeAtLocation(receiverNode)
	}
	sender := typeChecker.GetTypeAtLocation(senderNode)
	if helpers.TypeSafetyAny(sender) {
		if helpers.TypeSafetyUnknown(receiver) {
			return false
		}
		message := diagnostics.Unsafe_assignment_of_an_0_value
		if helpers.TypeSafetyImplicitThis(rule.context, senderNode) {
			message = diagnostics.Unsafe_assignment_of_an_0_value_this_is_typed_as_any_You_can_try_to_fix_this_by_turning_on_the_noImplicitThis_compiler_option_or_adding_a_this_parameter_to_the_function
		}
		diagnosticLocation := rule.context.Range(reportingNode)
		if reportingNode.Kind == ast.KindParameter {
			diagnosticLocation = core.NewTextRange(scanner.GetTokenPosOfNode(reportingNode.Name(), rule.context.File, false), reportingNode.End())
		}
		rule.context.Report(diagnosticLocation, message, typeSafetyAnyName(sender))

		return true
	}
	if compare && helpers.TypeSafetyAssignment(typeChecker, sender, receiver, senderNode) {
		rule.context.Report(rule.context.Range(reportingNode), diagnostics.Unsafe_assignment_of_type_0_to_a_variable_of_type_1, helpers.TypeSafetyDescribe(typeChecker, sender), helpers.TypeSafetyDescribe(typeChecker, receiver))
		return true
	}
	return false
}

func (rule *typescriptNoUnsafeAssignmentRule) destructure(pattern *ast.Node, sender *checker.Type) bool {
	if pattern == nil {
		return false
	}
	typeChecker := rule.context.GetChecker()
	pattern = ast.SkipParentheses(pattern)
	if pattern.Kind == ast.KindArrayBindingPattern || pattern.Kind == ast.KindArrayLiteralExpression {
		if helpers.TypeSafetyArray(typeChecker, sender, checker.TypeFlagsAny) {
			rule.context.Report(rule.context.Range(pattern), diagnostics.Unsafe_array_destructuring_of_an_0_array_value, typeSafetyAnyName(sender))
			return false
		}
		if !checker.IsTupleType(sender) {
			return true
		}
		arguments := typeChecker.GetTypeArguments(sender)
		reported := false
		for index, element := range pattern.Elements() {
			if element.Kind == ast.KindOmittedExpression || typeSafetyPatternRest(element) || index >= len(arguments) {
				continue
			}
			value := typeSafetyPatternValue(element)
			if value == nil {
				continue
			}
			if helpers.TypeSafetyAny(arguments[index]) {
				rule.context.Report(rule.context.Range(element), diagnostics.Unsafe_array_destructuring_of_a_tuple_element_with_an_0_value, typeSafetyAnyName(arguments[index]))
				reported = true
			} else if rule.destructure(value, arguments[index]) {
				reported = true
			}
		}
		return reported
	}
	if pattern.Kind != ast.KindObjectBindingPattern && pattern.Kind != ast.KindObjectLiteralExpression {
		return false
	}
	reported := false
	var properties []*ast.Node
	if pattern.Kind == ast.KindObjectLiteralExpression {
		properties = pattern.Properties()
	} else {
		properties = pattern.Elements()
	}
	for _, property := range properties {
		if typeSafetyPatternRest(property) {
			continue
		}
		key := property.Name()
		if property.Kind == ast.KindBindingElement && property.AsBindingElement().PropertyName != nil {
			key = property.AsBindingElement().PropertyName
		}
		if key == nil {
			continue
		}
		if key.Kind == ast.KindComputedPropertyName {
			key = key.Expression()
			if key.Kind != ast.KindStringLiteral && key.Kind != ast.KindNumericLiteral && key.Kind != ast.KindNoSubstitutionTemplateLiteral {
				continue
			}
		}
		name := ast.GetPropertyNameForPropertyNameNode(key)
		member := typeChecker.GetPropertyOfType(sender, name)
		if member == nil {
			continue
		}
		value := typeChecker.GetTypeOfSymbol(member)
		target := typeSafetyPatternValue(property)
		if target == nil {
			continue
		}
		if helpers.TypeSafetyAny(value) {
			rule.context.Report(rule.context.Range(target), diagnostics.Unsafe_object_destructuring_of_a_property_with_an_0_value, typeSafetyAnyName(value))
			reported = true
		} else if rule.destructure(target, value) {
			reported = true
		}
	}
	return reported
}

func typeSafetyAnyName(value *checker.Type) string {
	if helpers.TypeSafetyError(value) {
		return "error typed"
	}
	return "`any`"
}

func typeSafetyPatternRest(node *ast.Node) bool {
	return node.Kind == ast.KindSpreadElement || node.Kind == ast.KindSpreadAssignment || node.Kind == ast.KindBindingElement && node.AsBindingElement().DotDotDotToken != nil
}

func typeSafetyPatternValue(node *ast.Node) *ast.Node {
	switch node.Kind {
	case ast.KindBindingElement:
		return node.Name()
	case ast.KindPropertyAssignment:
		return node.Initializer()
	case ast.KindShorthandPropertyAssignment:
		return node.Name()
	}
	return node
}
