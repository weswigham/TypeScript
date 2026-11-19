package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoUselessConstructorRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func newTypeScriptNoUselessConstructor(context Context) Rule {
	rule := &typescriptNoUselessConstructorRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindConstructor},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptNoUselessConstructorRule) OnEnterNode(node *ast.Node) bool {
	rule.uselessConstructor(node)
	return true
}

func (rule *typescriptNoUselessConstructorRule) uselessConstructor(node *ast.Node) {
	if node.Kind != ast.KindConstructor || node.Body() == nil || ast.HasSyntacticModifier(node, ast.ModifierFlagsPrivate|ast.ModifierFlagsProtected) {
		return
	}
	derived := typescriptNoUselessConstructorHasBase(node.Parent)
	if derived && ast.HasSyntacticModifier(node, ast.ModifierFlagsPublic) {
		return
	}
	parameters := node.FunctionLikeData().Parameters.Nodes
	for _, parameter := range parameters {
		if ast.HasSyntacticModifier(parameter, ast.ModifierFlagsParameterPropertyModifier) {
			return
		}
		for _, modifier := range parameter.ModifierNodes() {
			if modifier.Kind == ast.KindDecorator {
				return
			}
		}
	}
	body := node.Body().Statements()
	useless := !derived && len(body) == 0
	if derived && len(body) == 1 && body[0].Kind == ast.KindExpressionStatement {
		expression := ast.SkipParentheses(body[0].Expression())
		if expression.Kind == ast.KindCallExpression && ast.SkipParentheses(expression.Expression()).Kind == ast.KindSuperKeyword {
			arguments := expression.Arguments()
			useless = true
			for _, parameter := range parameters {
				if parameter.Initializer() != nil || parameter.Name().Kind != ast.KindIdentifier {
					useless = false
				}
			}
			spreadArguments := len(arguments) == 1 && arguments[0].Kind == ast.KindSpreadElement && arguments[0].Expression().Kind == ast.KindIdentifier && arguments[0].Expression().Text() == "arguments"
			if !spreadArguments {
				if len(parameters) != len(arguments) {
					useless = false
				} else {
					for index, parameter := range parameters {
						argument := ast.SkipParentheses(arguments[index])
						if (parameter.AsParameterDeclaration().DotDotDotToken != nil) != (argument.Kind == ast.KindSpreadElement) {
							useless = false
							continue
						}
						if argument.Kind == ast.KindSpreadElement {
							argument = argument.Expression()
						}
						if argument.Kind != ast.KindIdentifier || argument.Text() != parameter.Name().Text() {
							useless = false
						}
					}
				}
			}
		}
	}
	if !useless {
		return
	}
	start := rule.Start(node)
	lexer := scanner.GetScannerForSourceFile(rule.context.File, start)
	end := start
	for kind := lexer.Token(); kind != ast.KindEndOfFile; kind = lexer.Scan() {
		if kind == ast.KindConstructorKeyword {
			start = lexer.TokenStart()
			end = lexer.TokenEnd()
			break
		}
		if lexer.TokenStart() >= node.Body().Pos() {
			break
		}
	}
	diagnostic := rule.context.Report(core.NewTextRange(start, end), diagnostics.Useless_constructor)
	replacement := ""
	members := node.Parent.Members()
	for index, member := range members {
		if member == node && index > 0 && index+1 < len(members) && members[index-1].Kind == ast.KindPropertyDeclaration && !strings.HasSuffix(rule.Text(members[index-1]), ";") && strings.HasPrefix(rule.Text(members[index+1]), "[") {
			replacement = ";"
		}
	}
	rule.suggest(diagnostic, rule.Start(node), node.End(), replacement, ast.NewCompilerDiagnostic(diagnostics.Remove_the_constructor))
}

func (rule *typescriptNoUselessConstructorRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func (rule *typescriptNoUselessConstructorRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[rule.Start(node):node.End()]
}

func (rule *typescriptNoUselessConstructorRule) suggest(diagnostic *ast.Diagnostic, start, end int, text string, description *ast.Diagnostic) {
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), text)
	rule.AddSuggestion(diagnostic, "@typescript-eslint/no-useless-constructor", tracker.GetTextChanges(), description)
}

func typescriptNoUselessConstructorHasBase(node *ast.Node) bool {
	if node.ClassLikeData().HeritageClauses == nil {
		return false
	}
	for _, clause := range node.ClassLikeData().HeritageClauses.Nodes {
		if clause.AsHeritageClause().Token == ast.KindExtendsKeyword {
			return true
		}
	}
	return false
}
