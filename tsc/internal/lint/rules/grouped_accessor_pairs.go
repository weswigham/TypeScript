package rules

import (
	"fmt"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type groupedAccessorPairsRule struct {
	context Context
}

func (rule *groupedAccessorPairsRule) OnEnterNode(node *ast.Node) bool {
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
		if !helpers.BooleanOptionValue(helpers.SyntaxObject(rule.context, 1), "enforceForTSTypes", false) {
			return true
		}
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
		if len(pair.Getters) == 1 && len(pair.Setters) == 1 {
			getter, setter := pair.Getters[0], pair.Setters[0]
			first, last := getter, setter
			if first > last {
				first, last = last, first
			}
			mode := helpers.StringOptionValue(helpers.SyntaxOption(rule.context, 0), "anyOrder")
			if last-first > 1 {
				rule.context.Report(rule.context.Range(members[last]), diagnostics.Accessor_pair_0_and_1_should_be_grouped, helpers.FunctionDiagnosticName(members[first]), helpers.FunctionDiagnosticName(members[last]))
			} else if mode == "getBeforeSet" && getter > setter || mode == "setBeforeGet" && setter > getter {
				rule.context.Report(rule.context.Range(members[last]), diagnostics.Expected_0_to_be_before_1, helpers.FunctionDiagnosticName(members[last]), helpers.FunctionDiagnosticName(members[first]))
			}
		}
	}
	return true
}

func (rule *groupedAccessorPairsRule) OnExitNode(node *ast.Node) {
}

func (rule *groupedAccessorPairsRule) key(node *ast.Node) string {
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

func newGroupedAccessorPairs(context Context) Rule {
	return &groupedAccessorPairsRule{context: context}
}
