package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noArrayConstructorRule struct{ context Context }

func newNoArrayConstructorRule(context Context) Rule {
	rule := &noArrayConstructorRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindCallExpression, ast.KindNewExpression},
	}
}

func (rule *noArrayConstructorRule) OnEnterNode(node *ast.Node) bool {
	rule.checkArrayConstructor(node)
	return true
}

func (rule *noArrayConstructorRule) checkArrayConstructor(node *ast.Node) {
	if node.Kind != ast.KindCallExpression && node.Kind != ast.KindNewExpression {
		return
	}
	callee := ast.SkipParentheses(node.Expression())
	if callee.Kind != ast.KindIdentifier || callee.Text() != "Array" {
		return
	}
	var arguments *ast.NodeList
	optional := false
	if node.Kind == ast.KindCallExpression {
		call := node.AsCallExpression()
		if call.TypeArguments != nil {
			return
		}
		arguments, optional = call.Arguments, call.QuestionDotToken != nil
	} else {
		call := node.AsNewExpression()
		if call.TypeArguments != nil {
			return
		}
		arguments = call.Arguments
	}
	var elements []*ast.Node
	if arguments != nil {
		elements = arguments.Nodes
	}
	if len(elements) == 1 && elements[0].Kind != ast.KindSpreadElement || !helpers.StatementBuiltin(rule.context, callee, true) {
		return
	}
	start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
	diagnostic := rule.context.Report(core.NewTextRange(start, node.End()), diagnostics.The_array_literal_notation_is_preferable)
	nonSpread := 0
	for _, argument := range elements {
		if argument.Kind != ast.KindSpreadElement {
			nonSpread++
		}
	}
	if rule.context.NewTracker == nil || optional || len(elements) > 0 && nonSpread < 2 {
		return
	}
	headerEnd := node.End()
	if arguments != nil {
		headerEnd = arguments.Pos()
	}
	lexer := scanner.NewScanner()
	lexer.SetText(rule.context.File.Text()[start:headerEnd])
	lexer.SetSkipTrivia(false)
	for kind := lexer.Scan(); kind != ast.KindEndOfFile; kind = lexer.Scan() {
		if kind == ast.KindSingleLineCommentTrivia || kind == ast.KindMultiLineCommentTrivia {
			return
		}
	}
	tracker := rule.context.NewTracker()
	if arguments == nil {
		arguments = tracker.NewNodeList(nil)
	}
	tracker.ReplaceNode(rule.context.File, node, tracker.NewArrayLiteralExpression(arguments, false), nil)
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("no-array-constructor", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Replace_with_an_array_literal), "no-array-constructor", ast.NewCompilerDiagnostic(diagnostics.Replace_Array_constructors_with_array_literals)))
}
