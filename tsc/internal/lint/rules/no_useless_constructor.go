package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noUselessConstructorRule struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newNoUselessConstructor(context Context) Rule {
	rule := &noUselessConstructorRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindConstructor},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *noUselessConstructorRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindConstructor {
		rule.uselessConstructor(node)
	}

	return true
}

func (rule *noUselessConstructorRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *noUselessConstructorRule) replace(tracker *change.Tracker, start, end int, text string) {
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), text)
}

func (rule *noUselessConstructorRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func (rule *noUselessConstructorRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[rule.Start(node):node.End()]
}

func (rule *noUselessConstructorRule) tokens(start, end int) []helpers.DeclarationToken {
	lexer := scanner.NewScanner()
	lexer.SetText(rule.context.File.Text())
	lexer.SetSkipTrivia(true)
	lexer.ResetPos(start)
	var result []helpers.DeclarationToken
	for kind := lexer.Scan(); kind != ast.KindEndOfFile && lexer.TokenStart() < end; kind = lexer.Scan() {
		result = append(result, helpers.DeclarationToken{Kind: kind, Start: lexer.TokenStart(), End: lexer.TokenEnd()})
	}
	return result
}

func (rule *noUselessConstructorRule) uselessConstructor(node *ast.Node) {
	if node.Body() == nil {
		return
	}
	derived := ast.GetHeritageClause(node.Parent, ast.KindExtendsKeyword) != nil
	modifiers := ast.GetCombinedModifierFlags(node)
	if modifiers&(ast.ModifierFlagsPrivate|ast.ModifierFlagsProtected) != 0 || derived && modifiers&ast.ModifierFlagsPublic != 0 {
		return
	}
	for _, parameter := range node.Parameters() {
		if ast.GetCombinedModifierFlags(parameter)&(ast.ModifierFlagsParameterPropertyModifier|ast.ModifierFlagsDecorator) != 0 {
			return
		}
	}
	statements := node.Body().AsBlock().Statements.Nodes
	if !derived {
		if len(statements) != 0 {
			return
		}
	} else {
		if len(statements) != 1 || statements[0].Kind != ast.KindExpressionStatement {
			return
		}
		call := statements[0].Expression()
		if call.Kind != ast.KindCallExpression || call.Expression().Kind != ast.KindSuperKeyword {
			return
		}
		for _, parameter := range node.Parameters() {
			if parameter.Name().Kind != ast.KindIdentifier || parameter.Initializer() != nil {
				return
			}
		}
		arguments := call.Arguments()
		spreadArguments := len(arguments) == 1 && arguments[0].Kind == ast.KindSpreadElement && arguments[0].Expression().Kind == ast.KindIdentifier && arguments[0].Expression().Text() == "arguments"
		if !spreadArguments {
			if len(arguments) != len(node.Parameters()) {
				return
			}
			for index, parameter := range node.Parameters() {
				argument := arguments[index]
				rest := parameter.AsParameterDeclaration().DotDotDotToken != nil
				if rest != (argument.Kind == ast.KindSpreadElement) {
					return
				}
				if rest {
					argument = argument.Expression()
				}
				if argument.Kind != ast.KindIdentifier || argument.Text() != parameter.Name().Text() {
					return
				}
			}
		}
	}
	reportLocation := rule.context.Range(node)
	for _, token := range rule.tokens(rule.Start(node), rule.Start(node.Body())) {
		if token.Kind == ast.KindConstructorKeyword || token.Kind == ast.KindStringLiteral {
			reportLocation = core.NewTextRange(rule.Start(node), token.End)
			break
		}
	}
	report := rule.context.Report(reportLocation, diagnostics.Useless_constructor)

	if rule.context.NewTracker == nil {
		return
	}
	text := ""
	members := node.Parent.Members()
	for index, member := range members {
		if member != node || index == 0 || index+1 == len(members) {
			continue
		}
		previous, next := members[index-1], members[index+1]
		if previous.Kind != ast.KindPropertyDeclaration || previous.Initializer() == nil || strings.HasSuffix(rule.Text(previous), ";") {
			continue
		}
		tokens := rule.tokens(rule.Start(next), next.End())
		if len(tokens) > 0 {
			switch tokens[0].Kind {
			case ast.KindOpenBracketToken, ast.KindAsteriskToken, ast.KindInKeyword, ast.KindInstanceOfKeyword:
				text = ";"
			}
		}
	}
	tracker := rule.context.NewTracker()
	rule.replace(tracker, rule.Start(node), node.End(), text)
	if rule.suggestions == nil {
		rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	rule.suggestions[report] = []*codefix.CodeFixAction{codefix.CreateCodeFixAction("no-useless-constructor", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Remove_the_constructor), "", nil)}
}
