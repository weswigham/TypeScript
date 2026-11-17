package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typeScriptPreferReadonlyParameterTypes struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptPreferReadonlyParameterTypes(context Context) Rule {
	return &typeScriptPreferReadonlyParameterTypes{context: context}
}

func (rule *typeScriptPreferReadonlyParameterTypes) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typeScriptPreferReadonlyParameterTypes) OnEnterNode(node *ast.Node) bool {
	rule.parameters(node)
	return true
}

func (rule *typeScriptPreferReadonlyParameterTypes) OnExitNode(node *ast.Node) {}

func (rule *typeScriptPreferReadonlyParameterTypes) parameters(node *ast.Node) {
	if !ast.IsFunctionLike(node) {
		return
	}
	c := rule.context.GetChecker()
	for _, parameter := range node.Parameters() {
		if !helpers.SemanticMemberBoolean(rule.context, "checkParameterProperties", true) && ast.GetCombinedModifierFlags(parameter)&ast.ModifierFlagsParameterPropertyModifier != 0 {
			continue
		}
		if helpers.SemanticMemberBoolean(rule.context, "ignoreInferredTypes", false) && parameter.Type() == nil {
			continue
		}
		value := c.GetTypeAtLocation(parameter)
		if parameter.Type() != nil {
			value = c.GetTypeFromTypeNode(parameter.Type())
		}
		if !rule.readonlyType(value, make(map[*checker.Type]bool)) && !typeScriptPreferReadonlyParameterTypesBranded(c, value) {
			reportLocation := rule.context.Range(parameter)
			if ast.GetCombinedModifierFlags(parameter)&ast.ModifierFlagsParameterPropertyModifier != 0 {
				reportLocation = core.NewTextRange(scanner.GetTokenPosOfNode(parameter.Name(), rule.context.File, false), parameter.End())
			}
			rule.context.Report(reportLocation, diagnostics.Parameter_should_be_a_read_only_type)

		}
	}
}

func typeScriptPreferReadonlyParameterTypesBranded(c *checker.Checker, value *checker.Type) bool {
	for _, part := range helpers.SemanticMemberParts(value) {
		if !part.IsIntersection() {
			return false
		}
		primitive, object := false, false
		for _, item := range part.Types() {
			if item.Flags()&(checker.TypeFlagsLiteral|checker.TypeFlagsBigInt|checker.TypeFlagsNumber|checker.TypeFlagsString|checker.TypeFlagsTemplateLiteral) != 0 {
				primitive = true
			} else if item.Flags()&checker.TypeFlagsObject != 0 && !c.TypeHasCallOrConstructSignatures(item) {
				object = true
			} else {
				return false
			}
		}
		if !primitive || !object {
			return false
		}
	}
	return true
}

func (rule *typeScriptPreferReadonlyParameterTypes) readonlyType(value *checker.Type, seen map[*checker.Type]bool) bool {
	if seen[value] {
		return true
	}
	seen[value] = true
	c := rule.context.GetChecker()
	if rule.allowedType(value) {
		return true
	}
	if value.IsUnion() {
		for _, part := range value.Types() {
			if !rule.readonlyType(part, seen) {
				return false
			}
		}
		return true
	}
	if value.Flags()&checker.TypeFlagsConditional != 0 {
		return rule.readonlyType(c.GetTrueTypeOfConditionalType(value), seen) && rule.readonlyType(c.GetFalseTypeOfConditionalType(value), seen)
	}
	if value.IsIntersection() {
		for _, part := range value.Types() {
			if c.IsArrayType(part) || checker.IsTupleType(part) {
				for _, item := range value.Types() {
					if !rule.readonlyType(item, seen) {
						return false
					}
				}
				return true
			}
		}
	} else if value.Flags()&checker.TypeFlagsObject == 0 {
		return true
	}
	if c.IsArrayType(value) || checker.IsTupleType(value) {
		if checker.IsTupleType(value) {
			if !value.Target().AsTupleType().IsReadonly() {
				return false
			}
		} else if value.Symbol() == nil || value.Symbol().Name() == "Array" {
			return false
		}
		for _, argument := range c.GetTypeArguments(value) {
			if !rule.readonlyType(argument, seen) {
				return false
			}
		}
		return true
	}
	properties := c.GetPropertiesOfType(value)
	for _, property := range properties {
		declaration := property.ValueDeclaration()
		if declaration != nil && declaration.Name() != nil && declaration.Name().Kind == ast.KindPrivateIdentifier {
			continue
		}
		if helpers.SemanticMemberBoolean(rule.context, "treatMethodsAsReadonly", false) && property.Flags()&ast.SymbolFlagsMethod != 0 {
			continue
		}
		if !c.IsReadonlySymbol(property) {
			return false
		}
	}
	for _, property := range properties {
		if !rule.readonlyType(c.GetTypeOfSymbol(property), seen) {
			return false
		}
	}
	for _, index := range c.GetIndexInfosOfType(value) {
		if index.KeyType().Flags()&(checker.TypeFlagsString|checker.TypeFlagsNumber) != 0 && (!index.IsReadonly() || !rule.readonlyType(index.ValueType(), seen)) {
			return false
		}
	}
	return true
}

func (rule *typeScriptPreferReadonlyParameterTypes) allowedType(value *checker.Type) bool {
	allow, _ := helpers.SemanticMemberOptions(rule.context)["allow"].([]any)
	var alias *ast.Symbol
	if value.Alias() != nil {
		alias = value.Alias().Symbol()
	}
	for _, symbol := range []*ast.Symbol{alias, value.Symbol()} {
		if symbol == nil {
			continue
		}
		for _, item := range allow {
			options, structured := item.(map[string]any)
			names := helpers.SemanticOptionNames(item)
			if structured {
				names = helpers.SemanticOptionNames(options["name"])
			}
			if slices.Contains(names, symbol.Name()) && (!structured || helpers.SemanticTypeSpecifierOrigin(rule.context, symbol, options)) {
				return true
			}
		}
	}
	return false
}
