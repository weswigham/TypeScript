package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoInvalidVoidTypeRule struct {
	context Context
}

func (rule *typescriptNoInvalidVoidTypeRule) OnEnterNode(node *ast.Node) bool {
	rule.invalidVoid(node)
	return true
}

func (rule *typescriptNoInvalidVoidTypeRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptNoInvalidVoidTypeRule) invalidVoid(node *ast.Node) {
	if node.Kind != ast.KindVoidKeyword {
		return
	}
	outer := node
	for outer.Parent.Kind == ast.KindParenthesizedType {
		outer = outer.Parent
	}
	parent := outer.Parent
	allowGeneric := true
	if value, exists := rule.Options()["allowInGenericTypeArguments"]; exists {
		if boolean, ok := value.(bool); ok {
			allowGeneric = boolean
		}
	}
	allowThis := rule.Boolean("allowAsThisParameter", false)
	message := diagnostics.X_void_is_only_valid_as_a_return_type

	if allowGeneric && allowThis {
		message = diagnostics.X_void_is_only_valid_as_a_return_type_or_generic_type_argument_or_the_type_of_a_this_parameter
	} else if allowGeneric {
		message = diagnostics.X_void_is_only_valid_as_a_return_type_or_generic_type_argument
	} else if allowThis {
		message = diagnostics.X_void_is_only_valid_as_return_type_or_type_of_this_parameter
	}
	if parent.Kind == ast.KindTypeReference && slices.Contains(parent.TypeArguments(), outer) {
		if !allowGeneric {
			rule.context.Report(rule.context.Range(node), message)
			return
		}
		if names := helpers.TypescriptSyntaxStrings(rule.Options()["allowInGenericTypeArguments"]); names != nil {
			name := strings.ReplaceAll(rule.Text(parent.AsTypeReferenceNode().TypeName), " ", "")
			for _, allowed := range names {
				if strings.ReplaceAll(allowed, " ", "") == name {
					return
				}
			}
			rule.context.Report(rule.context.Range(node), diagnostics.X_0_may_not_have_void_as_a_type_argument, name)
		}
		return
	}
	if (parent.Kind == ast.KindNewExpression || parent.Kind == ast.KindExpressionWithTypeArguments || parent.Kind == ast.KindImportType) && slices.Contains(parent.TypeArguments(), outer) && allowGeneric {
		return
	}
	if allowGeneric && parent.Kind == ast.KindTypeParameter && typescriptNoInvalidVoidTypeUnwrap(parent.AsTypeParameterDeclaration().DefaultType) == node {
		return
	}
	if parent.Kind == ast.KindUnionType {
		valid := true
		for _, member := range parent.AsUnionTypeNode().Types.Nodes {
			member = typescriptNoInvalidVoidTypeUnwrap(member)
			if member.Kind == ast.KindVoidKeyword || member.Kind == ast.KindNeverKeyword {
				continue
			}
			generic := false
			if member.Kind == ast.KindTypeReference {
				for _, argument := range member.TypeArguments() {
					if typescriptNoInvalidVoidTypeUnwrap(argument).Kind == ast.KindVoidKeyword {
						generic = true
						break
					}
				}
			}
			if !generic {
				valid = false
				break
			}
		}
		if valid {
			return
		}
		for ancestor := parent.Parent; ancestor != nil; ancestor = ancestor.Parent {
			if ancestor.Kind != ast.KindFunctionDeclaration && !(ancestor.Kind == ast.KindMethodDeclaration && ancestor.Body() != nil) {
				continue
			}
			if ancestor.Body() != nil {
				members := ancestor.Parent.Statements()
				if ast.IsClassLike(ancestor.Parent) {
					members = ancestor.Parent.Members()
				}
				for _, member := range members {
					if member != ancestor && member.Kind == ancestor.Kind && member.Body() == nil && (member.Name() == nil && ancestor.Name() == nil || member.Name() != nil && ancestor.Name() != nil && rule.Text(member.Name()) == rule.Text(ancestor.Name()) && ast.HasSyntacticModifier(member, ast.ModifierFlagsStatic) == ast.HasSyntacticModifier(ancestor, ast.ModifierFlagsStatic)) {
						return
					}
				}
			}
			break
		}
		if allowGeneric && !allowThis {
			message = diagnostics.X_void_is_not_valid_as_a_constituent_in_a_union_type
		}
	}
	if ast.IsFunctionLike(parent) && typescriptNoInvalidVoidTypeUnwrap(parent.Type()) == node {
		return
	}
	if parent.Kind == ast.KindParameter && parent.Name().Kind == ast.KindIdentifier && parent.Name().Text() == "this" && allowThis {
		return
	}
	rule.context.Report(rule.context.Range(node), message)
}

func (rule *typescriptNoInvalidVoidTypeRule) Options() map[string]any {
	if len(rule.context.Options) != 0 {
		options, _ := rule.context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func (rule *typescriptNoInvalidVoidTypeRule) Boolean(name string, fallback bool) bool {
	if value, ok := rule.Options()[name].(bool); ok {
		return value
	}
	return fallback
}

func (rule *typescriptNoInvalidVoidTypeRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[rule.Start(node):node.End()]
}

func (rule *typescriptNoInvalidVoidTypeRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func typescriptNoInvalidVoidTypeUnwrap(node *ast.Node) *ast.Node {
	for node != nil && node.Kind == ast.KindParenthesizedType {
		node = node.Type()
	}
	return node
}

func newTypeScriptNoInvalidVoidType(context Context) Rule {
	return &typescriptNoInvalidVoidTypeRule{context: context}
}
