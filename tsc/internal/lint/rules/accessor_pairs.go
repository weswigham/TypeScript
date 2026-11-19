package rules

import (
	"fmt"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type accessorPairsRule struct {
	context Context
}

func newAccessorPairs(context Context) Rule {
	rule := &accessorPairsRule{context: context}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindClassDeclaration,
			ast.KindClassExpression,
			ast.KindObjectLiteralExpression,
			ast.KindTypeLiteral,
			ast.KindInterfaceDeclaration,
		},
	}
}

func (rule *accessorPairsRule) OnEnterNode(node *ast.Node) bool {
	var members []*ast.Node
	isClass := ast.IsClassLike(node)
	isType := node.Kind == ast.KindTypeLiteral || node.Kind == ast.KindInterfaceDeclaration
	if node.Kind == ast.KindObjectLiteralExpression {
		members = node.Properties()
	} else if isClass || isType {
		members = node.Members()
	} else {
		return true
	}
	if isType {
		if !helpers.BooleanOptionValue(helpers.SyntaxObject(rule.context, 0), "enforceForTSTypes", false) {
			return true
		}
	}
	if isClass && !helpers.BooleanOptionValue(helpers.SyntaxObject(rule.context, 0), "enforceForClassMembers", true) {
		return true
	}
	groups := make(map[string]*helpers.AccessorPositions)
	var order []string
	for index, member := range members {
		if member.Kind != ast.KindGetAccessor && member.Kind != ast.KindSetAccessor {
			continue
		}
		key := rule.key(member)
		if helpers.HasStaticModifier(member) {
			key = "class-static:" + key
		}
		pair := groups[key]
		if pair == nil {
			pair = &helpers.AccessorPositions{}
			groups[key] = pair
			order = append(order, key)
		}
		if member.Kind == ast.KindGetAccessor {
			pair.Getters = append(pair.Getters, index)
		} else {
			pair.Setters = append(pair.Setters, index)
		}
	}
	for _, key := range order {
		pair := groups[key]
		missing := ""
		var indexes []int
		if len(pair.Getters) == 0 && helpers.BooleanOptionValue(helpers.SyntaxObject(rule.context, 0), "setWithoutGet", true) {
			missing, indexes = "Getter", pair.Setters
		}
		if len(pair.Setters) == 0 && helpers.BooleanOptionValue(helpers.SyntaxObject(rule.context, 0), "getWithoutSet", false) {
			missing, indexes = "Setter", pair.Getters
		}
		container := ""
		if isClass {
			container = "class "
		} else if isType {
			container = "type "
		}
		for _, index := range indexes {
			rule.context.Report(rule.context.Range(members[index]), diagnostics.X_0_is_not_present_for_1_2, missing, container, helpers.FunctionDiagnosticName(members[index]))
		}
	}
	if helpers.IsPropertyDescriptorObject(node) {
		get, set := false, false
		for _, member := range members {
			if member.Name() != nil && member.Name().Kind == ast.KindIdentifier && (member.Kind == ast.KindPropertyAssignment || member.Kind == ast.KindShorthandPropertyAssignment || member.Kind == ast.KindMethodDeclaration) {
				get = get || member.Name().Text() == "get"
				set = set || member.Name().Text() == "set"
			}
		}
		if set && !get && helpers.BooleanOptionValue(helpers.SyntaxObject(rule.context, 0), "setWithoutGet", true) {
			rule.context.Report(rule.context.Range(node), diagnostics.Getter_is_not_present_in_property_descriptor)
		}
		if get && !set && helpers.BooleanOptionValue(helpers.SyntaxObject(rule.context, 0), "getWithoutSet", false) {
			rule.context.Report(rule.context.Range(node), diagnostics.Setter_is_not_present_in_property_descriptor)
		}
	}
	return true
}

func (rule *accessorPairsRule) key(node *ast.Node) string {
	name := node.Name()
	if text, ok := helpers.StaticDeclarationNameText(name); ok {
		return "static:" + text
	}
	if name == nil {
		return ""
	}
	if name.Kind == ast.KindComputedPropertyName {
		name = ast.SkipParentheses(name.Expression())
	}
	lexer := scanner.NewScanner()
	lexer.SetText(rule.context.File.Text()[name.Pos():name.End()])
	var result strings.Builder
	for kind := lexer.Scan(); kind != ast.KindEndOfFile; kind = lexer.Scan() {
		fmt.Fprintf(&result, "%d:%s;", kind, lexer.TokenText())
	}
	return "tokens:" + result.String()
}
