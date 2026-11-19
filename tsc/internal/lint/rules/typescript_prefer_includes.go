package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typeScriptPreferIncludes struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptPreferIncludes(context Context) Rule {
	rule := &typeScriptPreferIncludes{context: context, suggestions: make(map[*ast.Diagnostic][]*codefix.CodeFixAction)}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindBinaryExpression, ast.KindCallExpression},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typeScriptPreferIncludes) OnEnterNode(node *ast.Node) bool {
	if rule.context.GetChecker != nil {
		rule.includes(node)
	}
	return true
}

func (rule *typeScriptPreferIncludes) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typeScriptPreferIncludes) action(diagnostic *ast.Diagnostic, description *ast.Diagnostic, suggestion bool, edits ...helpers.SemanticExpressionEdit) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	for _, edit := range edits {
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(edit.Start, edit.End), edit.Text)
	}
	name := "@typescript-eslint/" + "prefer-includes"
	action := codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), description, name, description)
	if suggestion {
		rule.suggestions[diagnostic] = append(rule.suggestions[diagnostic], action)
	} else {
		diagnostic.SetCodeFixes(action)
	}
}

func (rule *typeScriptPreferIncludes) replace(diagnostic *ast.Diagnostic, node *ast.Node, text string) {
	description := diagnostic
	rule.action(diagnostic, description, false, helpers.SemanticExpressionEdit{Start: helpers.SemanticExpressionStart(rule.context, node), End: node.End(), Text: text})
}

func typeScriptPreferIncludesSameParameters(left, right *ast.Node) bool {
	if !ast.IsFunctionLike(left) || !ast.IsFunctionLike(right) {
		return false
	}
	leftParameters, rightParameters := left.Parameters(), right.Parameters()
	if len(leftParameters) != len(rightParameters) {
		return false
	}
	for index, parameter := range leftParameters {
		other := rightParameters[index]
		file, otherFile := ast.GetSourceFileOfNode(parameter), ast.GetSourceFileOfNode(other)
		if file.Text()[scanner.GetTokenPosOfNode(parameter, file, false):parameter.End()] != otherFile.Text()[scanner.GetTokenPosOfNode(other, otherFile, false):other.End()] {
			return false
		}
	}
	return true
}

func (rule *typeScriptPreferIncludes) includesCompatible(member *ast.Node) bool {
	typeChecker := rule.context.GetChecker()
	_, property, _, _ := helpers.SemanticExpressionMember(rule.context, member)
	symbol := typeChecker.GetSymbolAtLocation(property)
	if symbol == nil || len(symbol.Declarations()) == 0 {
		return false
	}
	for _, declaration := range symbol.Declarations() {
		if declaration.Parent == nil {
			return false
		}
		owner := typeChecker.GetTypeAtLocation(declaration.Parent)
		includes := typeChecker.GetPropertyOfType(owner, "includes")
		if includes == nil {
			return false
		}
		matched := false
		for _, candidate := range includes.Declarations() {
			matched = matched || typeScriptPreferIncludesSameParameters(declaration, candidate)
		}
		if !matched {
			return false
		}
	}
	return true
}

func (rule *typeScriptPreferIncludes) includes(node *ast.Node) {
	if node.Kind == ast.KindBinaryExpression {
		expression := node.AsBinaryExpression()
		call := ast.SkipParentheses(expression.Left)
		if call.Kind != ast.KindCallExpression {
			return
		}
		_, property, name, _ := helpers.SemanticExpressionMember(rule.context, call.Expression())
		if name != "indexOf" {
			return
		}
		negative, positive := false, false
		switch expression.OperatorToken.Kind {
		case ast.KindExclamationEqualsEqualsToken, ast.KindExclamationEqualsToken, ast.KindGreaterThanToken:
			positive = helpers.SemanticExpressionNodeIsNumber(rule.context, expression.Right, -1)
		case ast.KindGreaterThanEqualsToken:
			positive = helpers.SemanticExpressionNodeIsNumber(rule.context, expression.Right, 0)
		case ast.KindEqualsEqualsEqualsToken, ast.KindEqualsEqualsToken, ast.KindLessThanEqualsToken:
			negative = helpers.SemanticExpressionNodeIsNumber(rule.context, expression.Right, -1)
		case ast.KindLessThanToken:
			negative = helpers.SemanticExpressionNodeIsNumber(rule.context, expression.Right, 0)
		}
		if !positive && !negative || !rule.includesCompatible(ast.SkipParentheses(call.Expression())) {
			return
		}
		diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Use_includes_method_instead)
		if rule.optionalChain(call) {
			return
		}
		replacement := "includes"
		if ast.SkipParentheses(call.Expression()).Kind == ast.KindElementAccessExpression {
			replacement = helpers.SemanticExpressionQuote("includes", helpers.SemanticExpressionText(rule.context, property)[0] == '\'')
		}
		edits := []helpers.SemanticExpressionEdit{{Start: helpers.SemanticExpressionStart(rule.context, property), End: property.End(), Text: replacement}, {Start: call.End(), End: node.End(), Text: ""}}
		if negative {
			edits = append(edits, helpers.SemanticExpressionEdit{Start: helpers.SemanticExpressionStart(rule.context, call), End: helpers.SemanticExpressionStart(rule.context, call), Text: "!"})
		}
		rule.action(diagnostic, ast.NewCompilerDiagnostic(diagnostics.Use_includes_method_instead), false, edits...)
		return
	}
	if node.Kind != ast.KindCallExpression || len(node.AsCallExpression().Arguments.Nodes) != 1 {
		return
	}
	member := ast.SkipParentheses(node.Expression())
	object, _, name, optional := helpers.SemanticExpressionMember(rule.context, member)
	if member.Kind != ast.KindPropertyAccessExpression || name != "test" {
		return
	}
	text, _, known := helpers.SemanticExpressionRegexText(rule.context, object, false)
	argument := node.AsCallExpression().Arguments.Nodes[0]
	if !known || rule.context.GetChecker().GetPropertyOfType(helpers.SemanticExpressionConstrained(rule.context, argument), "includes") == nil {
		return
	}
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Use_String_includes_method_with_a_string_instead)
	separator := "."
	if optional {
		separator = "?."
	}
	rule.replace(diagnostic, node, helpers.SemanticExpressionReceiverText(rule.context, argument)+separator+"includes("+helpers.SemanticExpressionQuote(text, true)+")")
}

func (rule *typeScriptPreferIncludes) optionalChain(node *ast.Node) bool {
	for node != nil {
		node = ast.SkipParentheses(node)
		switch node.Kind {
		case ast.KindPropertyAccessExpression, ast.KindElementAccessExpression, ast.KindCallExpression:
			if node.QuestionDotToken() != nil {
				return true
			}
			node = node.Expression()
		default:
			return false
		}
	}
	return false
}
