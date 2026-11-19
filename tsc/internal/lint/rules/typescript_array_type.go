package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptArrayTypeRule struct {
	helpers.TypescriptScopeRuleContext
}

func newTypeScriptArrayType(context Context) Rule {
	rule := &typescriptArrayTypeRule{Context: context, Name: "array-type"}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindArrayType, ast.KindTypeReference},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptArrayTypeRule) OnEnterNode(node *ast.Node) bool {
	rule.arrayType(node)
	return true
}

func tsScopeUnwrapType(node *ast.Node) *ast.Node {
	for node != nil && node.Kind == ast.KindParenthesizedType {
		node = node.Type()
	}
	return node
}

func tsScopeSimpleType(node *ast.Node) bool {
	node = tsScopeUnwrapType(node)
	if node == nil {
		return false
	}
	switch node.Kind {
	case ast.KindIdentifier, ast.KindQualifiedName, ast.KindAnyKeyword, ast.KindBooleanKeyword, ast.KindNeverKeyword, ast.KindNumberKeyword, ast.KindBigIntKeyword, ast.KindObjectKeyword, ast.KindStringKeyword, ast.KindSymbolKeyword, ast.KindUnknownKeyword, ast.KindVoidKeyword, ast.KindUndefinedKeyword, ast.KindThisType, ast.KindArrayType:
		return true
	case ast.KindLiteralType:
		return node.AsLiteralTypeNode().Literal.Kind == ast.KindNullKeyword
	case ast.KindTypeReference:
		reference := node.AsTypeReferenceNode()
		if reference.TypeName.Kind == ast.KindIdentifier && reference.TypeName.Text() == "Array" {
			return len(node.TypeArguments()) == 0 || len(node.TypeArguments()) == 1 && tsScopeSimpleType(node.TypeArguments()[0])
		}
		return node.TypeArgumentList() == nil && tsScopeSimpleType(reference.TypeName)
	}
	return false
}

func tsScopeArrayParens(node *ast.Node) bool {
	switch node.Kind {
	case ast.KindUnionType, ast.KindIntersectionType, ast.KindFunctionType, ast.KindConstructorType, ast.KindTypeOperator, ast.KindInferType, ast.KindConditionalType:
		return true
	case ast.KindTypeReference:
		return helpers.TsScopeIdentifier(node.AsTypeReferenceNode().TypeName, "ReadonlyArray")
	}
	return false
}

func (rule *typescriptArrayTypeRule) arrayType(node *ast.Node) {
	mode := rule.StringOption("default", "array")
	if node.Kind == ast.KindArrayType {
		element := tsScopeUnwrapType(node.AsArrayTypeNode().ElementType)
		target := node
		readonly := node.Parent.Kind == ast.KindTypeOperator && node.Parent.AsTypeOperatorNode().Operator == ast.KindReadonlyKeyword
		if readonly {
			mode = rule.StringOption("readonly", mode)
			target = node.Parent
		}
		if mode == "array" || mode == "array-simple" && tsScopeSimpleType(element) {
			return
		}
		className, prefix := "Array", ""
		if readonly {
			className, prefix = "ReadonlyArray", "readonly "
		}
		display := "T"
		if tsScopeSimpleType(element) {
			display = rule.Text(element)
		}
		message := diagnostics.Array_type_using_0_1_is_forbidden_Use_2_1_instead
		if mode == "array-simple" {
			message = diagnostics.Array_type_using_0_1_is_forbidden_for_non_simple_types_Use_2_1_instead
		}
		diagnostic := rule.Context.Report(rule.Context.Range(target), message, prefix, display, className)
		rule.Edits(diagnostic, nil, helpers.TsScopeEdit{Start: rule.Start(target), End: rule.Start(element), Text: className + "<"}, helpers.TsScopeEdit{Start: element.End(), End: target.End(), Text: ">"})
		return
	}
	if node.Kind != ast.KindTypeReference || len(node.TypeArguments()) != 1 {
		return
	}
	name := node.AsTypeReferenceNode().TypeName
	if name.Kind != ast.KindIdentifier || name.Text() != "Array" && name.Text() != "ReadonlyArray" && name.Text() != "Readonly" {
		return
	}
	element := node.TypeArguments()[0]
	readonlyGeneric := name.Text() == "Readonly" && element.Kind == ast.KindArrayType
	if name.Text() == "Readonly" && !readonlyGeneric {
		return
	}
	if binding := rule.Bindings().Nodes[name].Find(name.Text()); binding != nil && (binding.Frame.Owner.Kind != ast.KindSourceFile || ast.IsExternalModule(rule.Context.File)) {
		return
	}
	readonly := name.Text() != "Array"
	if readonly {
		mode = rule.StringOption("readonly", mode)
	}
	if mode == "generic" || mode == "array-simple" && !tsScopeSimpleType(element) {
		return
	}
	prefix, suffix := "", "[]"
	if readonly {
		prefix = "readonly "
	}
	if tsScopeArrayParens(element) {
		prefix += "("
		suffix = ")" + suffix
	}
	if readonlyGeneric {
		suffix = ""
	}
	if readonly && node.Parent.Kind == ast.KindArrayType {
		prefix = "(" + prefix
		suffix += ")"
	}
	display := "T"
	if tsScopeSimpleType(element) {
		display = rule.Text(element)
	}
	message := diagnostics.Array_type_using_0_1_is_forbidden_Use_2_instead
	if mode == "array-simple" {
		message = diagnostics.Array_type_using_0_1_is_forbidden_for_simple_types_Use_2_instead
	}
	diagnostic := rule.Context.Report(rule.Context.Range(node), message, name.Text(), display, prefix+display+suffix)
	rule.Edits(diagnostic, nil, helpers.TsScopeEdit{Start: rule.Start(node), End: rule.Start(element), Text: prefix}, helpers.TsScopeEdit{Start: element.End(), End: node.End(), Text: suffix})
}
