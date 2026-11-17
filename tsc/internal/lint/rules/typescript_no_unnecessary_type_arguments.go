package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoUnnecessaryTypeArgumentsRule struct{ context Context }

func (rule *typescriptNoUnnecessaryTypeArgumentsRule) OnEnterNode(node *ast.Node) bool {
	var declaration *ast.Node
	c := rule.context.GetChecker()
	switch node.Kind {
	case ast.KindCallExpression, ast.KindNewExpression, ast.KindTaggedTemplateExpression, ast.KindJsxOpeningElement, ast.KindJsxSelfClosingElement:
		if len(node.TypeArguments()) == 0 {
			return true
		}
		if signature := c.GetResolvedSignature(node); signature != nil {
			declaration = signature.Declaration()
		}
		if declaration != nil {
			break
		}
		if node.Kind != ast.KindNewExpression {
			return true
		}
		fallthrough
	case ast.KindTypeReference, ast.KindExpressionWithTypeArguments:
		if len(node.TypeArguments()) == 0 {
			return true
		}
		if node.Kind == ast.KindExpressionWithTypeArguments && node.Parent.Kind != ast.KindHeritageClause {
			return true
		}
		var target *ast.Node
		if node.Kind == ast.KindTypeReference {
			target = node.AsTypeReferenceNode().TypeName
		} else {
			target = node.Expression()
		}
		symbol := c.GetSymbolAtLocation(target)
		if symbol == nil {
			return true
		}
		if symbol.Flags()&ast.SymbolFlagsAlias != 0 {
			symbol = c.GetAliasedSymbol(symbol)
		}
		typeContext := node.Kind == ast.KindTypeReference || node.Parent.Kind == ast.KindHeritageClause && node.Parent.AsHeritageClause().Token == ast.KindImplementsKeyword
		declarations := slices.Clone(symbol.Declarations())
		slices.SortStableFunc(declarations, func(left, right *ast.Node) int {
			leftType := left.Kind == ast.KindTypeAliasDeclaration || left.Kind == ast.KindInterfaceDeclaration
			rightType := right.Kind == ast.KindTypeAliasDeclaration || right.Kind == ast.KindInterfaceDeclaration
			if leftType == rightType {
				return 0
			}
			if leftType == typeContext {
				return -1
			}
			return 1
		})
		for _, candidate := range declarations {
			switch candidate.Kind {
			case ast.KindClassDeclaration, ast.KindClassExpression, ast.KindInterfaceDeclaration, ast.KindTypeAliasDeclaration:
				declaration = candidate
			case ast.KindVariableDeclaration:
				signatures := c.GetSignaturesOfType(c.GetTypeOfSymbol(symbol), checker.SignatureKindConstruct)
				if len(signatures) > 0 {
					declaration = signatures[0].Declaration()
				}
			}
			if declaration != nil && len(declaration.TypeParameters()) > 0 {
				break
			}
		}
	default:
		return true
	}
	if declaration == nil {
		return true
	}
	arguments, parameters := node.TypeArguments(), declaration.TypeParameters()
	index := len(arguments) - 1
	if index < 0 || index >= len(parameters) {
		return true
	}
	defaultNode := parameters[index].AsTypeParameterDeclaration().DefaultType
	if defaultNode == nil {
		return true
	}
	argumentType, defaultType := c.GetTypeAtLocation(arguments[index]), c.GetTypeAtLocation(defaultNode)
	if argumentType != defaultType {
		if !helpers.TypeSafetyAssertionReference(argumentType) || !helpers.TypeSafetyAssertionReference(defaultType) || argumentType.Target() != defaultType.Target() || !slices.Equal(c.GetTypeArguments(argumentType), c.GetTypeArguments(defaultType)) {
			return true
		}
	}
	diagnostic := rule.context.Report(rule.context.Range(arguments[index]), diagnostics.This_is_the_default_value_for_this_type_parameter_so_it_can_be_omitted)
	var start int
	end := arguments[index].End()
	if index > 0 {
		start = arguments[index-1].End()
	} else {
		text := rule.context.File.Text()
		start = node.Pos() + strings.LastIndex(text[node.Pos():scanner.GetTokenPosOfNode(arguments[0], rule.context.File, false)], "<")
		lexer := scanner.NewScanner()
		lexer.SetText(text)
		lexer.ResetPos(end)
		for token := lexer.Scan(); token != ast.KindEndOfFile; token = lexer.Scan() {
			if token == ast.KindGreaterThanToken || token == ast.KindGreaterThanGreaterThanToken || token == ast.KindGreaterThanGreaterThanGreaterThanToken {
				end = lexer.TokenStart() + 1
				break
			}
		}
	}
	helpers.TypeSafetyAssertionFix(rule.context, diagnostic, "no-unnecessary-type-arguments", start, end, "")
	return true
}

func (rule *typescriptNoUnnecessaryTypeArgumentsRule) OnExitNode(node *ast.Node) {}

func newTypeScriptNoUnnecessaryTypeArguments(context Context) Rule {
	return &typescriptNoUnnecessaryTypeArgumentsRule{context: context}
}
