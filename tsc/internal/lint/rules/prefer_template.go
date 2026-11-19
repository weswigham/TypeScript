package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/parser"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type preferTemplateRule struct {
	context Context
}

func newPreferTemplate(context Context) Rule {
	rule := &preferTemplateRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindBinaryExpression},
	}
}

func (rule *preferTemplateRule) OnEnterNode(node *ast.Node) bool {
	rule.template(node)

	return true
}

func (rule *preferTemplateRule) replace(diagnostic *ast.Diagnostic, old *ast.Node, build func(*change.Tracker) *ast.Node) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	tracker.ReplaceNodePreservingComments(rule.context.File, old, build(tracker))
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("prefer-template", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "prefer-template"), "prefer-template", ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "prefer-template")))
}

func (rule *preferTemplateRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func (rule *preferTemplateRule) template(node *ast.Node) {
	if !expressionConcat(node) || node.Kind == ast.KindParenthesizedExpression {
		return
	}
	parent := node.Parent
	for parent != nil && parent.Kind == ast.KindParenthesizedExpression {
		parent = parent.Parent
	}
	if parent != nil && expressionConcat(parent) {
		return
	}
	hasString, hasOther := expressionStringParts(node)
	if !hasString || !hasOther {
		return
	}
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_string_concatenation)
	if rule.templateOctal(node) {
		return
	}
	replacement := rule.templateText(node, "", "")
	rule.replace(diagnostic, node, func(tracker *change.Tracker) *ast.Node { return expressionParsed(tracker, replacement) })
}

func (rule *preferTemplateRule) templateOctal(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	if expressionConcat(node) {
		return rule.templateOctal(node.AsBinaryExpression().Left) || rule.templateOctal(node.AsBinaryExpression().Right)
	}
	if node.Kind != ast.KindStringLiteral {
		return false
	}
	raw := rule.context.File.Text()[rule.Start(node):node.End()]
	for index := 1; index < len(raw)-1; index++ {
		if raw[index] != '\\' {
			continue
		}
		index++
		if index >= len(raw)-1 {
			break
		}
		if raw[index] >= '1' && raw[index] <= '9' || raw[index] == '0' && index+1 < len(raw)-1 && raw[index+1] >= '0' && raw[index+1] <= '9' {
			return true
		}
	}
	return false
}

func (rule *preferTemplateRule) templateText(node *ast.Node, before, after string) string {
	node = ast.SkipParentheses(node)
	text := rule.context.File.Text()[rule.Start(node):node.End()]
	if node.Kind == ast.KindStringLiteral {
		var result strings.Builder
		result.WriteByte('`')
		for index := 1; index < len(text)-1; index++ {
			character := text[index]
			if character == '\\' && index+1 < len(text)-1 {
				next := text[index+1]
				if next != text[0] {
					result.WriteByte(character)
				}
				result.WriteByte(next)
				index++
				continue
			}
			if character == '`' || character == '$' && index+1 < len(text)-1 && text[index+1] == '{' {
				result.WriteByte('\\')
			}
			result.WriteByte(character)
		}
		result.WriteByte('`')
		return result.String()
	}
	if node.Kind == ast.KindTemplateExpression || node.Kind == ast.KindNoSubstitutionTemplateLiteral {
		return text
	}
	if expressionConcat(node) {
		hasString, _ := expressionStringParts(node)
		if hasString {
			binary := node.AsBinaryExpression()
			left, right := ast.SkipParentheses(binary.Left), ast.SkipParentheses(binary.Right)
			beforePlus := rule.trivia(left.End(), rule.Start(binary.OperatorToken))
			afterPlus := rule.trivia(binary.OperatorToken.End(), rule.Start(right))
			if expressionTemplateCurly(left, true) {
				leftText, rightText := rule.templateText(left, before, beforePlus+afterPlus), rule.templateText(right, "", after)
				return leftText[:len(leftText)-1] + rightText[1:]
			}
			if expressionTemplateCurly(right, false) {
				leftText, rightText := rule.templateText(left, before, ""), rule.templateText(right, beforePlus+afterPlus, after)
				return leftText[:len(leftText)-1] + rightText[1:]
			}
			return rule.templateText(left, before, "") + beforePlus + "+" + afterPlus + rule.templateText(right, after, "")
		}
	}
	return "`${" + before + text + after + "}`"
}

func (rule *preferTemplateRule) trivia(start, end int) string {
	text := rule.context.File.Text()[start:end]
	lexer := scanner.NewScanner()
	lexer.SetText(text)
	lexer.SetSkipTrivia(false)
	var result strings.Builder
	for kind := lexer.Scan(); kind != ast.KindEndOfFile; kind = lexer.Scan() {
		if kind == ast.KindWhitespaceTrivia || kind == ast.KindNewLineTrivia || kind == ast.KindSingleLineCommentTrivia || kind == ast.KindMultiLineCommentTrivia {
			result.WriteString(text[lexer.TokenStart():lexer.TokenEnd()])
		}
	}
	return result.String()
}

func expressionParsed(tracker *change.Tracker, text string) *ast.Node {
	file := parser.ParseSourceFile(ast.SourceFileParseOptions{FileName: "/replacement.ts"}, "("+text+");", core.ScriptKindTS)
	expression := file.Statements.Nodes[0].Expression().Expression()
	return tracker.DeepCloneNode(expression)
}

func expressionConcat(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	return node.Kind == ast.KindBinaryExpression && node.AsBinaryExpression().OperatorToken.Kind == ast.KindPlusToken
}

func expressionString(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	return node.Kind == ast.KindStringLiteral || node.Kind == ast.KindNoSubstitutionTemplateLiteral || node.Kind == ast.KindTemplateExpression
}

func expressionStringParts(node *ast.Node) (bool, bool) {
	node = ast.SkipParentheses(node)
	if expressionConcat(node) {
		leftString, leftOther := expressionStringParts(node.AsBinaryExpression().Left)
		rightString, rightOther := expressionStringParts(node.AsBinaryExpression().Right)
		return leftString || rightString, leftOther || rightOther
	}
	return expressionString(node), !expressionString(node)
}

func expressionTemplateCurly(node *ast.Node, end bool) bool {
	node = ast.SkipParentheses(node)
	if node.Kind == ast.KindBinaryExpression {
		if end {
			return expressionTemplateCurly(node.AsBinaryExpression().Right, false)
		}
		return expressionTemplateCurly(node.AsBinaryExpression().Left, false)
	}
	if node.Kind == ast.KindTemplateExpression {
		expression := node.AsTemplateExpression()
		if end {
			return expression.TemplateSpans.Nodes[len(expression.TemplateSpans.Nodes)-1].AsTemplateSpan().Literal.Text() == ""
		}
		return expression.Head.Text() == ""
	}
	return !expressionString(node)
}
