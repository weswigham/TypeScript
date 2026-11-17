package rules

import (
	"strings"
	"unicode"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type idLengthRule struct {
	context Context
}

func (rule *idLengthRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindIdentifier && node.Kind != ast.KindPrivateIdentifier {
		return true
	}
	options := helpers.SyntaxObject(rule.context, 0)
	name := node.Text()
	if node.Kind == ast.KindPrivateIdentifier {
		name = strings.TrimPrefix(name, "#")
	}
	minimum, maximum := helpers.IntegerOptionValue(options["min"], 2), helpers.IntegerOptionValue(options["max"], int(^uint(0)>>1))
	count := 0
	for _, character := range name {
		if !unicode.Is(unicode.Mn, character) && !unicode.Is(unicode.Me, character) {
			count++
		}
	}
	if count >= minimum && count <= maximum || helpers.StringListOptionContains(options["exceptions"], name) {
		return true
	}
	for _, pattern := range helpers.StringListOptionValue(options["exceptionPatterns"]) {
		if helpers.MatchesRegularExpression(pattern, name) {
			return true
		}
	}
	properties := helpers.StringOptionValue(options["properties"], "always") != "never"
	parent := node.Parent
	check := false
	switch parent.Kind {
	case ast.KindVariableDeclaration:
		check = parent.Name() == node
	case ast.KindParameter:
		check = parent.Name() == node
	case ast.KindBindingElement:
		binding := parent.AsBindingElement()
		check = binding.Name() == node
		if parent.Parent.Kind == ast.KindObjectBindingPattern && binding.PropertyName == nil && binding.DotDotDotToken == nil {
			check = properties
		}
	case ast.KindFunctionDeclaration, ast.KindFunctionExpression, ast.KindClassDeclaration, ast.KindMethodDeclaration, ast.KindGetAccessor, ast.KindSetAccessor, ast.KindPropertyDeclaration:
		check = parent.Name() == node
	case ast.KindPropertyAssignment:
		check = properties && parent.Name() == node
	case ast.KindShorthandPropertyAssignment:
		check = properties
	case ast.KindPropertyAccessExpression:
		if properties && parent.Name() == node {
			assignment := parent.Parent
			check = assignment.Kind == ast.KindBinaryExpression && assignment.AsBinaryExpression().Left == parent && ast.IsAssignmentOperator(assignment.AsBinaryExpression().OperatorToken.Kind)
			if assignment.Kind == ast.KindPropertyAssignment && assignment.Initializer() == parent {
				object := assignment.Parent
				check = object.Kind == ast.KindObjectLiteralExpression && object.Parent.Kind == ast.KindBinaryExpression && object.Parent.AsBinaryExpression().Left == object
			}
		}
	case ast.KindImportClause, ast.KindNamespaceImport:
		check = parent.Name() == node
	case ast.KindImportSpecifier:
		alias := parent.AsImportSpecifier()
		check = alias.Name() == node && alias.PropertyName != nil && alias.PropertyName.Text() != name
	case ast.KindBinaryExpression:
		check = parent.AsBinaryExpression().Left == node && parent.AsBinaryExpression().OperatorToken.Kind == ast.KindEqualsToken && parent.Parent.Kind == ast.KindArrayLiteralExpression
	}
	if !check {
		return true
	}
	display := name
	if node.Kind == ast.KindPrivateIdentifier {
		display = "#" + name
	}
	if count < minimum {
		rule.context.Report(rule.context.Range(node), diagnostics.Identifier_name_0_is_too_short_1, display, minimum)
	} else {
		rule.context.Report(rule.context.Range(node), diagnostics.Identifier_name_0_is_too_long_1, display, maximum)
	}
	return true
}

func (rule *idLengthRule) OnExitNode(node *ast.Node) {
}

func newIdLength(context Context) Rule {
	return &idLengthRule{context: context}
}
