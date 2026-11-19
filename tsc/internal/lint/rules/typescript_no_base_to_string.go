package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"

	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoBaseToStringRule struct{ context Context }

func newTypeScriptNoBaseToString(context Context) Rule {
	rule := &typescriptNoBaseToStringRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindBinaryExpression, ast.KindCallExpression, ast.KindTemplateExpression},
	}
}

func (rule *typescriptNoBaseToStringRule) OnEnterNode(node *ast.Node) bool {
	rule.baseToString(node)
	return true
}

func (rule *typescriptNoBaseToStringRule) baseCertainty(value *checker.Type, join bool, seen map[*checker.Type]bool) string {
	if seen[value] {
		return "always"
	}
	c := rule.context.GetChecker()
	if !join {
		if value.Flags()&checker.TypeFlagsTypeParameter != 0 {
			if constraint := c.GetBaseConstraintOfType(value); constraint != nil {
				return rule.baseCertainty(constraint, false, seen)
			}
			if helpers.SemanticBooleanOption(rule.context,

				"checkUnknown", false) {
				return "may"
			}
			return "always"
		}
		if value.Flags()&checker.TypeFlagsBooleanLike != 0 {
			return "always"
		}
		ignored := []string{"Error", "RegExp", "URL", "URLSearchParams"}
		if option, exists := helpers.SemanticRuleOptions(rule.context.Options)["ignoredTypeNames"]; exists {
			ignored = helpers.SemanticOptionNames(option)
		}
		symbol := value.Symbol()
		if alias := value.Alias(); alias != nil {
			symbol = alias.Symbol()
		}
		if symbol != nil && slices.Contains(ignored, symbol.Name()) {
			for _, declaration := range symbol.Declarations() {
				if (declaration.Kind == ast.KindClassDeclaration || declaration.Kind == ast.KindInterfaceDeclaration || declaration.Kind == ast.KindTypeAliasDeclaration) && len(declaration.TypeParameters()) > 0 {
					return "always"
				}
			}
		}
		if helpers.SemanticMatchesBase(rule.context,

			value, func(part *checker.Type) bool {
				return slices.Contains(ignored, helpers.SemanticTypeName(rule.context,

					part))
			}, make(map[*checker.Type]bool)) {
			return "always"
		}
	}
	if value.IsUnion() || value.IsIntersection() {
		allAlways, allNever := true, true
		for _, part := range value.Types() {
			certainty := rule.baseCertainty(part, join, seen)
			if value.IsIntersection() && certainty == "always" {
				return "always"
			}
			allAlways = allAlways && certainty == "always"
			allNever = allNever && certainty == "will"
		}
		if allAlways {
			return "always"
		}
		if allNever || value.IsIntersection() {
			return "will"
		}
		return "may"
	}
	if checker.IsTupleType(value) || c.IsArrayType(value) {
		seen[value] = true
		defer delete(seen, value)
		if checker.IsTupleType(value) {
			result := "always"
			for _, argument := range c.GetTypeArguments(value) {
				certainty := rule.baseCertainty(argument, false, seen)
				if certainty == "will" {
					return "will"
				}
				if certainty == "may" {
					result = "may"
				}
			}
			return result
		}
		if element := c.GetIndexTypeOfType(value, c.GetNumberType()); element != nil {
			return rule.baseCertainty(element, false, seen)
		}
		return "always"
	}
	if join {
		return "always"
	}
	for _, property := range c.GetPropertiesOfType(value) {
		declaration := property.ValueDeclaration()
		if declaration == nil || declaration.Kind != ast.KindMethodSignature || declaration.Name().Kind != ast.KindComputedPropertyName {
			continue
		}
		name := declaration.Name().Expression()
		if name.Kind == ast.KindPropertyAccessExpression && name.Name().Text() == "toPrimitive" && name.Expression().Kind == ast.KindIdentifier && name.Expression().Text() == "Symbol" && helpers.SemanticLibrarySymbol(rule.context,

			c.GetSymbolAtLocation(name.Expression())) {
			return "always"
		}
	}
	fallback := false
	for _, name := range []string{"toLocaleString", "toString", "valueOf"} {
		property := c.GetPropertyOfType(value, name)
		if property == nil {
			continue
		}
		for _, declaration := range property.Declarations() {
			if declaration.Parent == nil || declaration.Parent.Kind != ast.KindInterfaceDeclaration || declaration.Parent.Name().Text() != "Object" {
				return "always"
			}
			fallback = true
		}
	}
	if fallback {
		return "will"
	}
	if value.Flags() == checker.TypeFlagsUnknown && helpers.SemanticBooleanOption(rule.context,

		"checkUnknown", false) {
		return "may"
	}
	return "always"
}

func (rule *typescriptNoBaseToStringRule) checkString(node *ast.Node, join bool) {
	node = ast.SkipParentheses(node)
	if !join && (ast.IsLiteralExpression(node) || node.Kind == ast.KindTrueKeyword || node.Kind == ast.KindFalseKeyword || node.Kind == ast.KindNullKeyword || node.Kind == ast.KindRegularExpressionLiteral) {
		return
	}
	value := rule.context.GetChecker().GetTypeAtLocation(node)
	if join {
		value = helpers.SemanticConstrainedType(rule.context,

			value)
	}
	certainty := rule.baseCertainty(value, join, make(map[*checker.Type]bool))
	if certainty == "always" {
		return
	}
	message := diagnostics.X_0_1_use_Object_s_default_stringification_format_object_Object_when_stringified
	if join {
		message = diagnostics.Using_join_for_0_1_use_Object_s_default_stringification_format_object_Object_when_stringified
	}
	rule.context.Report(rule.context.Range(node), message, helpers.SemanticSourceText(rule.context,

		node), certainty)
}

func (rule *typescriptNoBaseToStringRule) baseToString(node *ast.Node) {
	c := rule.context.GetChecker()
	switch node.Kind {
	case ast.KindBinaryExpression:
		binary := node.AsBinaryExpression()
		if binary.OperatorToken.Kind != ast.KindPlusToken && binary.OperatorToken.Kind != ast.KindPlusEqualsToken {
			return
		}
		if helpers.SemanticTypeName(rule.context,

			c.GetTypeAtLocation(binary.Left)) == "string" {
			rule.checkString(binary.Right, false)
		} else if binary.Left.Kind != ast.KindPrivateIdentifier && helpers.SemanticTypeName(rule.context,

			c.GetTypeAtLocation(binary.Right)) == "string" {
			rule.checkString(binary.Left, false)
		}
	case ast.KindCallExpression:
		callee := ast.SkipParentheses(node.Expression())
		if callee.Kind == ast.KindIdentifier && callee.Text() == "String" && len(node.Arguments()) > 0 && node.Arguments()[0].Kind != ast.KindSpreadElement {
			symbol := c.GetSymbolAtLocation(callee)
			if symbol == nil || helpers.SemanticLibrarySymbol(rule.context,

				symbol) {
				rule.checkString(node.Arguments()[0], false)
			}
		}
		if callee.Kind == ast.KindPropertyAccessExpression || callee.Kind == ast.KindElementAccessExpression {
			var name string
			if callee.Kind == ast.KindPropertyAccessExpression {
				name = callee.Name().Text()
			} else {
				argument := ast.SkipParentheses(callee.AsElementAccessExpression().ArgumentExpression)
				if argument.Kind == ast.KindIdentifier {
					name = argument.Text()
				}
			}
			if name == "toString" || name == "toLocaleString" {
				rule.checkString(callee.Expression(), false)
			}
			if name == "join" {
				rule.checkString(callee.Expression(), true)
			}
		}
	case ast.KindTemplateExpression:
		if node.Parent.Kind != ast.KindTaggedTemplateExpression {
			for _, span := range node.AsTemplateExpression().TemplateSpans.Nodes {
				rule.checkString(ast.SkipParentheses(span.Expression()), false)
			}
		}
	}
}
