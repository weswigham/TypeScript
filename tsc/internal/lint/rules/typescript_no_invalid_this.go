package rules

import (
	"strings"
	"unicode"
	"unicode/utf8"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoInvalidThisRule struct {
	helpers.TypescriptScopeRuleContext
}

func newTypeScriptNoInvalidThis(context Context) Rule {
	rule := &typescriptNoInvalidThisRule{Context: context, Name: "no-invalid-this"}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindThisKeyword},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptNoInvalidThisRule) OnEnterNode(node *ast.Node) bool {
	rule.invalidThis(node)
	return true
}

func tsScopeThisArgument(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	return node.Kind != ast.KindNullKeyword && node.Kind != ast.KindVoidExpression && !helpers.TsScopeIdentifier(node, "undefined")
}

func tsScopeFunctionValue(node *ast.Node) *ast.Node {
	for node.Parent != nil {
		parent := node.Parent
		switch parent.Kind {
		case ast.KindParenthesizedExpression:
			node = parent
		case ast.KindConditionalExpression:
			if parent.AsConditionalExpression().Condition == node {
				return node
			}
			node = parent
		case ast.KindBinaryExpression:
			operator := parent.AsBinaryExpression().OperatorToken.Kind
			if operator != ast.KindBarBarToken && operator != ast.KindAmpersandAmpersandToken && operator != ast.KindQuestionQuestionToken {
				return node
			}
			node = parent
		case ast.KindReturnStatement:
			function := helpers.TsScopeFunction(parent)
			if function == nil || !ast.IsFunctionLike(function) {
				return node
			}
			outer := function
			for outer.Parent.Kind == ast.KindParenthesizedExpression {
				outer = outer.Parent
			}
			if outer.Parent.Kind != ast.KindCallExpression || outer.Parent.Expression() != outer {
				return node
			}
			node = outer.Parent
		case ast.KindArrowFunction:
			if parent.Body() != node {
				return node
			}
			outer := parent
			for outer.Parent.Kind == ast.KindParenthesizedExpression {
				outer = outer.Parent
			}
			if outer.Parent.Kind != ast.KindCallExpression || outer.Parent.Expression() != outer {
				return node
			}
			node = outer.Parent
		default:
			return node
		}
	}
	return node
}

func (rule *typescriptNoInvalidThisRule) invalidThis(node *ast.Node) {
	if node.Kind != ast.KindThisKeyword || node.Parent == nil || node.Parent.Kind == ast.KindParameter || helpers.TsScopeTypeOnly(node) {
		return
	}
	for current := node.Parent; current != nil; current = current.Parent {
		if current.Kind == ast.KindPropertyDeclaration && helpers.TsScopeContains(current.Initializer(), node) || current.Kind == ast.KindClassStaticBlockDeclaration || current.Kind == ast.KindConstructor || current.Kind == ast.KindMethodDeclaration || current.Kind == ast.KindGetAccessor || current.Kind == ast.KindSetAccessor {
			return
		}
		if current.Kind == ast.KindArrowFunction {
			continue
		}
		if current.Kind == ast.KindFunctionDeclaration || current.Kind == ast.KindFunctionExpression {
			lexer := scanner.GetScannerForSourceFile(rule.Context.File, 0)
			lexer.SetSkipTrivia(false)
			lexer.ResetPos(0)
			annotated := false
			for kind := lexer.Scan(); kind != ast.KindEndOfFile && lexer.TokenStart() < rule.Start(current); kind = lexer.Scan() {
				if kind == ast.KindMultiLineCommentTrivia {
					annotated = strings.Contains(rule.Context.File.Text()[lexer.TokenStart():lexer.TokenEnd()], "@this")
				} else if kind > ast.KindLastTriviaToken && kind != ast.KindReturnKeyword && kind != ast.KindExportKeyword && kind != ast.KindDefaultKeyword && kind != ast.KindAsyncKeyword {
					annotated = false
				}
			}
			if annotated {
				return
			}
			for _, parameter := range current.Parameters() {
				if parameter.Name().Kind == ast.KindIdentifier && parameter.Name().Text() == "this" || parameter.Name().Kind == ast.KindThisKeyword {
					return
				}
			}
			name := ""
			if current.Name() != nil {
				name = current.Name().Text()
			}
			outer := tsScopeFunctionValue(current)
			parent := outer.Parent
			if name == "" && parent != nil && (parent.Kind == ast.KindVariableDeclaration || parent.Kind == ast.KindParameter) && parent.Name().Kind == ast.KindIdentifier {
				name = parent.Name().Text()
			}
			if name == "" && parent != nil && parent.Kind == ast.KindBinaryExpression && parent.AsBinaryExpression().Left.Kind == ast.KindIdentifier {
				name = parent.AsBinaryExpression().Left.Text()
			}
			initial, _ := utf8.DecodeRuneInString(name)
			if rule.Boolean("capIsConstructor", true) && unicode.IsUpper(initial) {
				return
			}
			if parent != nil {
				if parent.Kind == ast.KindPropertyAssignment || parent.Kind == ast.KindPropertyDeclaration {
					return
				}
				if parent.Kind == ast.KindBinaryExpression && ast.IsAssignmentOperator(parent.AsBinaryExpression().OperatorToken.Kind) && ast.IsAccessExpression(parent.AsBinaryExpression().Left) {
					return
				}
				if ast.IsAccessExpression(parent) && parent.Expression() == outer && (helpers.TsScopeMemberName(parent) == "bind" || helpers.TsScopeMemberName(parent) == "call" || helpers.TsScopeMemberName(parent) == "apply") && parent.Parent.Kind == ast.KindCallExpression && len(parent.Parent.Arguments()) > 0 && tsScopeThisArgument(parent.Parent.Arguments()[0]) {
					return
				}
				if parent.Kind == ast.KindCallExpression && parent.Expression() != outer && len(parent.Arguments()) > 1 && ast.IsAccessExpression(parent.Expression()) {
					method := helpers.TsScopeMemberName(parent.Expression())
					if strings.Contains("|forEach|map|filter|some|every|find|findIndex|findLast|findLastIndex|flatMap|", "|"+method+"|") && parent.Arguments()[0] == outer && tsScopeThisArgument(parent.Arguments()[1]) {
						return
					}
					if method == "apply" && helpers.TsScopeIdentifier(parent.Expression().Expression(), "Reflect") && parent.Arguments()[0] == outer && tsScopeThisArgument(parent.Arguments()[1]) {
						return
					}
					if method == "from" && helpers.TsScopeIdentifier(parent.Expression().Expression(), "Array") && len(parent.Arguments()) > 2 && parent.Arguments()[1] == outer && tsScopeThisArgument(parent.Arguments()[2]) {
						return
					}
				}
			}
			strict := ast.IsExternalModule(rule.Context.File)
			for ancestor := current; ancestor != nil; ancestor = ancestor.Parent {
				if ast.IsClassLike(ancestor) {
					strict = true
				}
				body := ancestor.Body()
				var statements []*ast.Node
				if ancestor.Kind == ast.KindSourceFile {
					statements = rule.Context.File.Statements.Nodes
				} else if body != nil && body.Kind == ast.KindBlock {
					statements = body.AsBlock().Statements.Nodes
				}
				for _, statement := range statements {
					if statement.Kind != ast.KindExpressionStatement || statement.Expression().Kind != ast.KindStringLiteral {
						break
					}
					if statement.Expression().Text() == "use strict" {
						strict = true
					}
				}
			}
			if strict {
				rule.Context.Report(rule.Context.Range(node), diagnostics.Unexpected_this)
			}
			return
		}
	}
	if ast.IsExternalModule(rule.Context.File) {
		rule.Context.Report(rule.Context.Range(node), diagnostics.Unexpected_this)
	}
}
