package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoUnsafeEnumAssignmentRule struct {
	context    Context
	checked    map[*ast.Node]bool
	generic    map[*checker.Type]bool
	mismatches map[[2]*checker.Type]bool
}

func (rule *typescriptNoUnsafeEnumAssignmentRule) OnEnterNode(node *ast.Node) bool {
	typeChecker := rule.context.GetChecker()
	message := diagnostics.The_value_assigned_here_does_not_have_a_shared_enum_type_with_the_expected_enum_0
	switch node.Kind {
	case ast.KindVariableDeclaration, ast.KindParameter, ast.KindBindingElement:
		if node.Initializer() != nil {
			rule.assignment(typeChecker.GetTypeAtLocation(node.Name()), node.Initializer(), node, message, nil)
		}
	case ast.KindPropertyDeclaration:
		if node.Initializer() != nil {
			rule.classMember(node)
		}
	case ast.KindBinaryExpression:
		binary := node.AsBinaryExpression()
		if ast.IsAssignmentOperator(binary.OperatorToken.Kind) {
			switch binary.OperatorToken.Kind {
			case ast.KindEqualsToken, ast.KindAmpersandAmpersandEqualsToken, ast.KindAmpersandEqualsToken, ast.KindQuestionQuestionEqualsToken, ast.KindCaretEqualsToken, ast.KindBarEqualsToken, ast.KindBarBarEqualsToken:
				rule.assignment(typeChecker.GetTypeAtLocation(binary.Left), binary.Right, node, message, nil)
			default:
				rule.mutate(binary.Left, node)
			}
		}
	case ast.KindCallExpression, ast.KindNewExpression, ast.KindTaggedTemplateExpression:
		rule.arguments(node)
	case ast.KindArrowFunction:
		if node.Body().Kind != ast.KindBlock {
			rule.returnValue(node.Body(), node.Body())
		}
	case ast.KindReturnStatement:
		if node.Expression() != nil {
			rule.returnValue(node.Expression(), node)
		}
	case ast.KindAsExpression, ast.KindTypeAssertionExpression:
		rule.assignment(typeChecker.GetTypeAtLocation(node.Type()), node.Expression(), node, diagnostics.The_value_asserted_here_does_not_have_a_shared_enum_type_with_the_expected_enum_0, nil)
	case ast.KindPostfixUnaryExpression:
		rule.mutate(node.AsPostfixUnaryExpression().Operand, node)
	case ast.KindPrefixUnaryExpression:
		if node.AsPrefixUnaryExpression().Operator == ast.KindPlusPlusToken || node.AsPrefixUnaryExpression().Operator == ast.KindMinusMinusToken {
			rule.mutate(node.AsPrefixUnaryExpression().Operand, node)
		}
	case ast.KindElementAccessExpression:
		rule.access(node)
	case ast.KindArrayLiteralExpression:
		if !rule.checked[node] {
			for _, element := range node.Elements() {
				if element.Kind != ast.KindOmittedExpression {
					rule.assignment(typeChecker.GetContextualType(element, checker.ContextFlagsNone), element, element, message, nil)
				}
			}
		}
	case ast.KindObjectLiteralExpression:
		if !rule.checked[node] {
			for _, property := range node.Properties() {
				if property.Kind == ast.KindPropertyAssignment {
					rule.assignment(typeChecker.GetContextualType(property.Initializer(), checker.ContextFlagsNone), property.Initializer(), property, message, nil)
				}
				if property.Kind == ast.KindShorthandPropertyAssignment {
					rule.assignment(typeChecker.GetContextualTypeForObjectLiteralElement(property, checker.ContextFlagsNone), property.Name(), property, message, nil)
				}
				if property.Kind == ast.KindSpreadAssignment {
					rule.assignment(typeChecker.GetContextualType(node, checker.ContextFlagsNone), property.Expression(), property, message, nil)
				}
			}
		}
	case ast.KindJsxExpression:
		if node.Parent.Kind == ast.KindJsxAttribute && node.Expression() != nil {
			rule.assignment(typeChecker.GetContextualType(node.Expression(), checker.ContextFlagsNone), node.Expression(), node.Expression(), message, nil)
		}
	}
	return true
}

func (rule *typescriptNoUnsafeEnumAssignmentRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptNoUnsafeEnumAssignmentRule) access(node *ast.Node) {
	typeChecker := rule.context.GetChecker()
	symbol := typeChecker.GetSymbolAtLocation(node.Expression())
	if symbol == nil {
		return
	}
	var receivers []*checker.Type
	for _, declaration := range symbol.Declarations() {
		switch declaration.Kind {
		case ast.KindGetAccessor, ast.KindParameter, ast.KindPropertyDeclaration, ast.KindPropertySignature, ast.KindVariableDeclaration:
			typeNode := declaration.Type()
			if typeNode == nil {
				continue
			}
			if typeNode.Kind == ast.KindMappedType {
				receivers = append(receivers, typeChecker.GetTypeAtLocation(typeNode.AsMappedTypeNode().TypeParameter.AsTypeParameterDeclaration().Constraint))
			}
			if typeNode.Kind == ast.KindTypeLiteral {
				for _, member := range typeNode.Members() {
					if name := member.Name(); name != nil && name.Kind == ast.KindComputedPropertyName {
						receivers = append(receivers, typeChecker.GetTypeAtLocation(name.Expression()))
					}
				}
			}
		}
	}
	if len(receivers) == 0 {
		return
	}
	property := node.AsElementAccessExpression().ArgumentExpression
	sender := typeChecker.GetTypeAtLocation(property)
	for _, receiver := range receivers {
		if !rule.mismatch(sender, receiver) && typeChecker.IsTypeAssignableTo(sender, receiver) {
			return
		}
	}
	rule.report(property, diagnostics.The_computed_key_used_here_does_not_have_a_shared_enum_type_with_the_expected_enum_0, receivers...)
}

func (rule *typescriptNoUnsafeEnumAssignmentRule) arguments(node *ast.Node) {
	typeChecker := rule.context.GetChecker()
	signature := helpers.TypeSafetyNewArgumentSignature(typeChecker, node)
	if node.Kind == ast.KindTaggedTemplateExpression {
		signature.Next()
	}
	for _, argument := range helpers.TypeSafetyArguments(node) {
		if argument.Kind == ast.KindSpreadElement {
			value := typeChecker.GetTypeAtLocation(argument.Expression())
			if checker.IsTupleType(value) {
				var mismatches []*checker.Type
				for _, element := range typeChecker.GetTypeArguments(value) {
					receiver := signature.Next()
					if receiver != nil && rule.mismatch(element, receiver) {
						mismatches = append(mismatches, receiver)
					}
				}
				if len(mismatches) != 0 {
					rule.report(argument, diagnostics.The_argument_passed_here_does_not_have_a_shared_enum_type_with_the_expected_enum_0, mismatches...)
				}
				if helpers.TypeSafetyVariableTuple(value) {
					signature.Consumed = true
				}
				continue
			}
		}
		if receiver := signature.Next(); receiver != nil {
			rule.assignment(receiver, argument, argument, diagnostics.The_argument_passed_here_does_not_have_a_shared_enum_type_with_the_expected_enum_0, nil)
		}
	}
}

func (rule *typescriptNoUnsafeEnumAssignmentRule) assignment(receiver *checker.Type, sender, reportingNode *ast.Node, message *diagnostics.Message, senderType *checker.Type) {
	if receiver == nil || sender.Kind == ast.KindArrayLiteralExpression || sender.Kind == ast.KindObjectLiteralExpression {
		return
	}
	if senderType == nil {
		senderType = rule.context.GetChecker().GetTypeAtLocation(sender)
	}
	if rule.mismatch(senderType, receiver) && !rule.safeBitwise(sender, receiver) {
		rule.report(reportingNode, message, receiver)
		rule.mark(sender)
	}
}

func (rule *typescriptNoUnsafeEnumAssignmentRule) classMember(node *ast.Node) {
	typeChecker := rule.context.GetChecker()
	name := ast.GetPropertyNameForPropertyNameNode(node.Name())
	var heritage []*checker.Type
	var clauses *ast.NodeList
	if node.Parent.Kind == ast.KindClassDeclaration {
		clauses = node.Parent.AsClassDeclaration().HeritageClauses
	} else if node.Parent.Kind == ast.KindClassExpression {
		clauses = node.Parent.AsClassExpression().HeritageClauses
	}
	if clauses != nil {
		for _, clause := range clauses.Nodes {
			for _, base := range clause.AsHeritageClause().Types.Nodes {
				if member := typeChecker.GetPropertyOfType(typeChecker.GetTypeAtLocation(base), name); member != nil {
					heritage = append(heritage, typeChecker.GetTypeOfSymbol(member))
				}
			}
		}
	}
	if len(heritage) != 0 {
		allUnsafe := true
		for _, receiver := range heritage {
			if !rule.mismatch(typeChecker.GetTypeAtLocation(node.Initializer()), receiver) || rule.safeBitwise(node.Initializer(), receiver) {
				allUnsafe = false
				break
			}
		}
		if allUnsafe {
			rule.report(node, diagnostics.The_value_assigned_here_does_not_have_a_shared_enum_type_with_the_expected_enum_0, heritage...)
			rule.mark(node.Initializer())
			return
		}
	}
	rule.assignment(typeChecker.GetTypeAtLocation(node), node.Initializer(), node, diagnostics.The_value_assigned_here_does_not_have_a_shared_enum_type_with_the_expected_enum_0, nil)
}

func (rule *typescriptNoUnsafeEnumAssignmentRule) deepMismatch(sender, receiver *checker.Type, visited map[[2]*checker.Type]bool, depth int, withinGeneric bool) bool {
	if depth > 5 {
		return false
	}
	typeChecker := rule.context.GetChecker()
	sender, receiver = helpers.TypeSafetyConstrain(typeChecker, sender), helpers.TypeSafetyConstrain(typeChecker, receiver)
	if sender == nil || receiver == nil || sender == receiver {
		return false
	}
	pair := [2]*checker.Type{sender, receiver}
	if visited[pair] {
		return false
	}
	visited[pair] = true
	if rule.directMismatch(sender, receiver) {
		return true
	}
	senderArguments, receiverArguments := rule.typeArguments(sender), rule.typeArguments(receiver)
	if len(senderArguments) == len(receiverArguments) {
		for index, argument := range senderArguments {
			if rule.deepMismatch(argument, receiverArguments[index], visited, depth+1, withinGeneric) {
				return true
			}
		}
	}
	generic := rule.isGeneric(sender) || rule.isGeneric(receiver)
	if generic && withinGeneric {
		return false
	}
	senderElement := typeChecker.GetIndexTypeOfType(sender, typeChecker.GetNumberType())
	receiverElement := typeChecker.GetIndexTypeOfType(receiver, typeChecker.GetNumberType())
	if senderElement != nil && receiverElement != nil && rule.deepMismatch(senderElement, receiverElement, visited, depth+1, generic || withinGeneric) {
		return true
	}
	for _, property := range typeChecker.GetPropertiesOfType(receiver) {
		if senderProperty := typeChecker.GetPropertyOfType(sender, property.Name()); senderProperty != nil && rule.deepMismatch(typeChecker.GetTypeOfSymbol(senderProperty), typeChecker.GetTypeOfSymbol(property), visited, depth+1, generic || withinGeneric) {
			return true
		}
	}
	return false
}

func (rule *typescriptNoUnsafeEnumAssignmentRule) directMismatch(sender, receiver *checker.Type) bool {
	typeChecker := rule.context.GetChecker()
	receiverEnums := typeSafetyEnums(typeChecker, receiver)
	var primitiveFlags checker.TypeFlags
	var nonEnums []*checker.Type
	for _, part := range helpers.TypeSafetyUnionParts(receiver) {
		if part.Flags()&checker.TypeFlagsEnumLike != 0 {
			if part.Flags()&checker.TypeFlagsNumberLiteral != 0 {
				primitiveFlags |= checker.TypeFlagsNumberLike
			} else {
				primitiveFlags |= checker.TypeFlagsStringLike
			}
		}
		if len(typeSafetyEnums(typeChecker, part)) == 0 {
			nonEnums = append(nonEnums, part)
		}
	}
	for _, part := range helpers.TypeSafetyUnionParts(sender) {
		if part.Flags()&primitiveFlags == 0 {
			continue
		}
		shared := false
		for _, enumType := range typeSafetyEnums(typeChecker, part) {
			if slices.Contains(receiverEnums, enumType) {
				shared = true
				break
			}
		}
		if shared {
			continue
		}
		allowed := false
		for _, nonEnum := range nonEnums {
			if typeChecker.IsTypeAssignableTo(part, nonEnum) {
				allowed = true
				break
			}
		}
		if !allowed {
			return true
		}
	}
	return false
}

func (rule *typescriptNoUnsafeEnumAssignmentRule) isGeneric(value *checker.Type) bool {
	if result, present := rule.generic[value]; present {
		return result
	}
	rule.generic[value] = false
	result := value.Flags()&checker.TypeFlagsInstantiable != 0
	parts := rule.typeArguments(value)
	if value.IsUnion() || value.IsIntersection() {
		parts = append(slices.Clone(parts), value.Types()...)
	}
	if alias := value.Alias(); alias != nil {
		parts = append(slices.Clone(parts), alias.TypeArguments()...)
	}
	result = slices.ContainsFunc(parts, rule.isGeneric) || result
	rule.generic[value] = result
	return result
}

func (rule *typescriptNoUnsafeEnumAssignmentRule) mark(node *ast.Node) {
	rule.checked[node] = true
	switch node.Kind {
	case ast.KindArrayLiteralExpression:
		for _, element := range node.Elements() {
			rule.mark(element)
		}
	case ast.KindObjectLiteralExpression:
		for _, property := range node.Properties() {
			rule.mark(property)
		}
	case ast.KindPropertyAssignment:
		rule.mark(node.Initializer())
	case ast.KindConditionalExpression:
		rule.mark(node.AsConditionalExpression().WhenTrue)
		rule.mark(node.AsConditionalExpression().WhenFalse)
	case ast.KindBinaryExpression:
		binary := node.AsBinaryExpression()
		if binary.OperatorToken.Kind == ast.KindBarBarToken || binary.OperatorToken.Kind == ast.KindAmpersandAmpersandToken || binary.OperatorToken.Kind == ast.KindQuestionQuestionToken {
			rule.mark(binary.Left)
			rule.mark(binary.Right)
		}
	case ast.KindAsExpression, ast.KindTypeAssertionExpression, ast.KindNonNullExpression, ast.KindSatisfiesExpression, ast.KindSpreadElement, ast.KindSpreadAssignment, ast.KindParenthesizedExpression:
		rule.mark(node.Expression())
	}
}

func (rule *typescriptNoUnsafeEnumAssignmentRule) mismatch(sender, receiver *checker.Type) bool {
	pair := [2]*checker.Type{sender, receiver}
	if result, present := rule.mismatches[pair]; present {
		return result
	}
	result := rule.deepMismatch(sender, receiver, make(map[[2]*checker.Type]bool), 0, false)
	rule.mismatches[pair] = result
	return result
}

func (rule *typescriptNoUnsafeEnumAssignmentRule) mutate(target, reportingNode *ast.Node) {
	value := rule.context.GetChecker().GetTypeAtLocation(target)
	if len(typeSafetyEnums(rule.context.GetChecker(), helpers.TypeSafetyConstrain(rule.context.GetChecker(), value))) != 0 {
		rule.report(reportingNode, diagnostics.This_mutation_can_produce_a_value_outside_of_the_expected_enum_0, value)
	}
}

func (rule *typescriptNoUnsafeEnumAssignmentRule) names(values []*checker.Type) string {
	typeChecker := rule.context.GetChecker()
	names := make(map[string]bool)
	visited := make(map[*checker.Type]bool)
	var visit func(*checker.Type)
	visit = func(value *checker.Type) {
		value = helpers.TypeSafetyConstrain(typeChecker, value)
		if value == nil || visited[value] {
			return
		}
		visited[value] = true
		for _, enumType := range typeSafetyEnums(typeChecker, value) {
			names[typeChecker.TypeToString(enumType)] = true
		}
		for _, argument := range rule.typeArguments(value) {
			visit(argument)
		}
		if element := typeChecker.GetIndexTypeOfType(value, typeChecker.GetNumberType()); element != nil {
			visit(element)
		}
		for _, property := range typeChecker.GetPropertiesOfType(value) {
			visit(typeChecker.GetTypeOfSymbol(property))
		}
	}
	for _, value := range values {
		visit(value)
	}
	result := make([]string, 0, len(names))
	for name := range names {
		result = append(result, name)
	}
	slices.Sort(result)
	for index := range result {
		result[index] = "'" + result[index] + "'"
	}
	return strings.Join(result, ", ")
}

func (rule *typescriptNoUnsafeEnumAssignmentRule) report(node *ast.Node, message *diagnostics.Message, receivers ...*checker.Type) {
	diagnosticLocation := rule.context.Range(node)
	if node.Kind == ast.KindParameter {
		diagnosticLocation = core.NewTextRange(scanner.GetTokenPosOfNode(node.Name(), rule.context.File, false), node.End())
	}
	rule.context.Report(diagnosticLocation, message, rule.names(receivers))
}

func (rule *typescriptNoUnsafeEnumAssignmentRule) returnValue(expression, reportingNode *ast.Node) {
	function := helpers.TypeSafetyParentFunction(expression)
	if function == nil {
		return
	}
	typeChecker := rule.context.GetChecker()
	signature := typeChecker.GetSignatureFromDeclaration(function)
	if signature == nil {
		return
	}
	receiver, sender := typeChecker.GetReturnTypeOfSignature(signature), typeChecker.GetTypeAtLocation(expression)
	if ast.IsAsyncFunction(function) {
		receiver, sender = typeChecker.GetAwaitedType(receiver), typeChecker.GetAwaitedType(sender)
	}
	if receiver != nil && sender != nil {
		rule.assignment(receiver, expression, reportingNode, diagnostics.The_value_returned_here_does_not_have_a_shared_enum_type_with_the_expected_enum_0, sender)
	}
}

func (rule *typescriptNoUnsafeEnumAssignmentRule) safeBitwise(node *ast.Node, receiver *checker.Type) bool {
	node = ast.SkipParentheses(node)
	safeOperand := func(operand *ast.Node) bool {
		return rule.safeBitwise(operand, receiver) || !rule.directMismatch(rule.context.GetChecker().GetTypeAtLocation(operand), receiver)
	}
	if node.Kind == ast.KindBinaryExpression {
		binary := node.AsBinaryExpression()
		return (binary.OperatorToken.Kind == ast.KindBarToken || binary.OperatorToken.Kind == ast.KindAmpersandToken || binary.OperatorToken.Kind == ast.KindCaretToken) && safeOperand(binary.Left) && safeOperand(binary.Right)
	}
	return node.Kind == ast.KindPrefixUnaryExpression && node.AsPrefixUnaryExpression().Operator == ast.KindTildeToken && safeOperand(node.AsPrefixUnaryExpression().Operand)
}

func (rule *typescriptNoUnsafeEnumAssignmentRule) typeArguments(value *checker.Type) []*checker.Type {
	if helpers.TypeSafetyReference(value) {
		return rule.context.GetChecker().GetTypeArguments(value)
	}
	return nil
}

func typeSafetyEnums(typeChecker *checker.Checker, value *checker.Type) []*checker.Type {
	var result []*checker.Type
	for _, part := range helpers.TypeSafetyUnionParts(value) {
		if part.Flags()&checker.TypeFlagsEnumLiteral == 0 {
			continue
		}
		if symbol := part.Symbol(); symbol != nil && symbol.Flags()&ast.SymbolFlagsEnumMember != 0 {
			part = typeChecker.GetTypeAtLocation(symbol.ValueDeclaration().Parent)
		}
		result = append(result, part)
	}
	return result
}

func newTypeScriptNoUnsafeEnumAssignment(context Context) Rule {
	return &typescriptNoUnsafeEnumAssignmentRule{context: context, checked: make(map[*ast.Node]bool), generic: make(map[*checker.Type]bool), mismatches: make(map[[2]*checker.Type]bool)}
}
