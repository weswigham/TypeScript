package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typeScriptUnboundMethod struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptUnboundMethod(context Context) Rule {
	rule := &typeScriptUnboundMethod{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindPropertyAccessExpression, ast.KindElementAccessExpression, ast.KindObjectBindingPattern, ast.KindObjectLiteralExpression},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typeScriptUnboundMethod) OnEnterNode(node *ast.Node) bool {
	rule.unbound(node)
	return true
}

func (rule *typeScriptUnboundMethod) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typeScriptUnboundMethod) unbound(node *ast.Node) {
	c := rule.context.GetChecker()
	if ast.IsAccessExpression(node) {
		if typeScriptUnboundMethodSafeMethodUse(node) {
			return
		}
		object := node.Expression()
		if node.Kind == ast.KindPropertyAccessExpression {
			name := node.Name().Text()
			if !rule.nativeBound(c.GetTypeAtLocation(object), name) {
				rule.checkMethodType(node, name, c.GetTypeAtLocation(object))
			}
		} else {
			argument := node.AsElementAccessExpression().ArgumentExpression
			for _, part := range helpers.SemanticMemberParts(c.GetTypeAtLocation(argument)) {
				if !part.IsStringLiteral() && !part.IsNumberLiteral() {
					continue
				}
				name := c.TypeToString(part)
				if part.IsStringLiteral() {
					name = part.AsLiteralType().Value().(string)
				}
				if rule.nativeBound(c.GetTypeAtLocation(object), name) {
					continue
				}
				if rule.checkMethodType(node, name, c.GetTypeAtLocation(object)) {
					break
				}
			}
		}
		return
	}
	if node.Kind != ast.KindObjectBindingPattern && !(node.Kind == ast.KindObjectLiteralExpression && typeScriptUnboundMethodAssignmentPattern(node)) {
		return
	}
	for parent := node.Parent; parent != nil; parent = parent.Parent {
		if ast.GetCombinedModifierFlags(parent)&(ast.ModifierFlagsAmbient|ast.ModifierFlagsAbstract) != 0 || parent.Kind == ast.KindTypeAliasDeclaration || parent.Kind == ast.KindInterfaceDeclaration || parent.Kind == ast.KindFunctionType || parent.Kind == ast.KindConstructorType {
			return
		}
	}
	var properties []*ast.Node
	if node.Kind == ast.KindObjectBindingPattern {
		properties = node.AsBindingPattern().Elements.Nodes
	} else {
		properties = node.AsObjectLiteralExpression().Properties.Nodes
	}
	var initializer *ast.Node
	parent := node.Parent
	if parent.Kind == ast.KindVariableDeclaration || parent.Kind == ast.KindParameter || parent.Kind == ast.KindBindingElement {
		initializer = parent.Initializer()
	}
	if parent.Kind == ast.KindBinaryExpression && parent.AsBinaryExpression().OperatorToken.Kind == ast.KindEqualsToken {
		initializer = parent.AsBinaryExpression().Right
	}
	for _, property := range properties {
		var key *ast.Node
		switch property.Kind {
		case ast.KindBindingElement:
			if property.AsBindingElement().DotDotDotToken != nil {
				continue
			}
			key = property.AsBindingElement().PropertyName
			if key == nil {
				key = property.Name()
			}
		case ast.KindPropertyAssignment, ast.KindShorthandPropertyAssignment:
			key = property.Name()
		default:
			continue
		}
		if key == nil || key.Kind != ast.KindIdentifier {
			continue
		}
		name := key.Text()
		if initializer != nil {
			value := c.GetTypeAtLocation(initializer)
			if rule.nativeBound(value, name) {
				if parent.Kind != ast.KindParameter {
					continue
				}
			} else if rule.checkMethodType(key, name, value) {
				continue
			}
		}
		rule.checkMethodType(key, name, c.GetTypeAtLocation(node))
	}
}

func typeScriptUnboundMethodAssignmentPattern(node *ast.Node) bool {
	for node.Parent != nil {
		parent := node.Parent
		switch parent.Kind {
		case ast.KindParenthesizedExpression, ast.KindObjectLiteralExpression, ast.KindArrayLiteralExpression, ast.KindPropertyAssignment, ast.KindSpreadAssignment, ast.KindSpreadElement:
			node = parent
		case ast.KindBinaryExpression:
			return parent.AsBinaryExpression().Left == node && parent.AsBinaryExpression().OperatorToken.Kind == ast.KindEqualsToken
		default:
			return false
		}
	}
	return false
}

func (rule *typeScriptUnboundMethod) checkMethodType(node *ast.Node, name string, value *checker.Type) bool {
	c := rule.context.GetChecker()
	for _, union := range helpers.SemanticMemberParts(value) {
		for _, part := range helpers.SemanticMemberIntersection(union) {
			symbol := c.GetPropertyOfType(part, name)
			if symbol == nil {
				continue
			}
			declaration := symbol.ValueDeclaration()
			if declaration == nil {
				continue
			}
			if declaration.Kind == ast.KindPropertyAssignment || declaration.Kind == ast.KindPropertyDeclaration {
				declaration = declaration.Initializer()
				if declaration == nil || declaration.Kind != ast.KindFunctionExpression {
					continue
				}
			} else if declaration.Kind != ast.KindMethodDeclaration && declaration.Kind != ast.KindMethodSignature {
				continue
			}
			parameters := declaration.Parameters()
			thisParameter := len(parameters) > 0 && parameters[0].Name().Kind == ast.KindIdentifier && parameters[0].Name().Text() == "this"
			if thisParameter && parameters[0].Type() != nil && parameters[0].Type().Kind == ast.KindVoidKeyword {
				continue
			}
			if helpers.SemanticMemberBoolean(rule.context, "ignoreStatic", false) && ast.GetCombinedModifierFlags(declaration)&ast.ModifierFlagsStatic != 0 {
				continue
			}
			message := diagnostics.A_method_that_is_not_declared_with_this_Colon_void_may_cause_unintentional_scoping_of_this_when_separated_from_its_object_Consider_using_an_arrow_function_or_explicitly_bind_ing_the_method_to_avoid_calling_the_method_with_an_unintended_this_value_If_a_function_does_not_access_this_it_can_be_annotated_with_this_Colon_void
			if thisParameter {
				message = diagnostics.A_method_that_is_not_declared_with_this_Colon_void_may_cause_unintentional_scoping_of_this_when_separated_from_its_object_Consider_using_an_arrow_function_or_explicitly_bind_ing_the_method_to_avoid_calling_the_method_with_an_unintended_this_value
			}
			rule.context.Report(rule.context.Range(node), message)
			return true
		}
	}
	return false
}

func (rule *typeScriptUnboundMethod) nativeBound(value *checker.Type, name string) bool {
	for _, union := range helpers.SemanticMemberParts(value) {
		for _, part := range helpers.SemanticMemberIntersection(union) {
			symbol := part.Symbol()
			if !helpers.SemanticMemberLibrary(symbol) {
				return false
			}
			if symbol.Name() == "Collator" && name == "compare" {
				continue
			}
			if !slices.Contains([]string{"NumberConstructor", "ObjectConstructor", "StringConstructor", "SymbolConstructor", "ArrayConstructor", "Array", "ProxyConstructor", "Console", "DateConstructor", "Atomics", "Math", "JSON", "Reflect", "RegExpConstructor", "Intl"}, symbol.Name()) {
				return false
			}
			if !helpers.SemanticMemberLibrary(rule.context.GetChecker().GetPropertyOfType(part, name)) {
				return false
			}
		}
	}
	return true
}

func typeScriptUnboundMethodSafeMethodUse(node *ast.Node) bool {
	parent := node.Parent
	if parent == nil {
		return false
	}
	switch parent.Kind {
	case ast.KindParenthesizedExpression, ast.KindAsExpression, ast.KindTypeAssertionExpression, ast.KindNonNullExpression:
		return typeScriptUnboundMethodSafeMethodUse(parent)
	case ast.KindIfStatement, ast.KindForStatement, ast.KindPropertyAccessExpression, ast.KindElementAccessExpression, ast.KindSwitchStatement, ast.KindPostfixUnaryExpression, ast.KindWhileStatement:
		return true
	case ast.KindCallExpression, ast.KindTaggedTemplateExpression:
		return parent.Expression() == node
	case ast.KindConditionalExpression:
		return parent.AsConditionalExpression().Condition == node
	case ast.KindTypeOfExpression, ast.KindDeleteExpression, ast.KindVoidExpression:
		return true
	case ast.KindPrefixUnaryExpression:
		operator := parent.AsPrefixUnaryExpression().Operator
		return operator == ast.KindExclamationToken || operator == ast.KindPlusPlusToken || operator == ast.KindMinusMinusToken
	case ast.KindBinaryExpression:
		binary := parent.AsBinaryExpression()
		switch binary.OperatorToken.Kind {
		case ast.KindEqualsEqualsToken, ast.KindEqualsEqualsEqualsToken, ast.KindExclamationEqualsToken, ast.KindExclamationEqualsEqualsToken, ast.KindInstanceOfKeyword:
			return true
		case ast.KindEqualsToken:
			return binary.Left == node || node.Expression() != nil && node.Expression().Kind == ast.KindSuperKeyword && ast.IsAccessExpression(binary.Left) && binary.Left.Expression().Kind == ast.KindThisKeyword
		case ast.KindAmpersandAmpersandToken:
			if binary.Left == node {
				return true
			}
			return typeScriptUnboundMethodSafeMethodUse(parent)
		case ast.KindBarBarToken, ast.KindQuestionQuestionToken:
			return typeScriptUnboundMethodSafeMethodUse(parent)
		}
	}
	return false
}
