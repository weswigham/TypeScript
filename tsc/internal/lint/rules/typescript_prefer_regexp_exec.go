package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typeScriptPreferRegexpExec struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptPreferRegexpExec(context Context) Rule {
	rule := &typeScriptPreferRegexpExec{context: context, suggestions: make(map[*ast.Diagnostic][]*codefix.CodeFixAction)}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindCallExpression},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typeScriptPreferRegexpExec) OnEnterNode(node *ast.Node) bool {
	if rule.context.GetChecker != nil {
		rule.regexpExec(node)
	}
	return true
}

func (rule *typeScriptPreferRegexpExec) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typeScriptPreferRegexpExec) regexpType(value *checker.Type) bool {
	if value == nil {
		return false
	}
	symbol := value.Symbol()
	return symbol != nil && symbol.Name() == "RegExp" && rule.context.GetChecker().IsLibSymbolForHoverVerbosity(symbol)
}

func (rule *typeScriptPreferRegexpExec) noGlobalFlag(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	if node.Kind != ast.KindCallExpression && node.Kind != ast.KindNewExpression {
		return false
	}
	if !helpers.SemanticExpressionGlobal(rule.context, ast.SkipParentheses(node.Expression()), "RegExp") {
		return false
	}
	var arguments []*ast.Node
	if node.Kind == ast.KindCallExpression {
		arguments = node.AsCallExpression().Arguments.Nodes
	} else if node.AsNewExpression().Arguments != nil {
		arguments = node.AsNewExpression().Arguments.Nodes
	}
	if len(arguments) < 2 {
		return true
	}
	value, known := helpers.SemanticExpressionStatic(rule.context, arguments[1], 0)
	if !known {
		return false
	}
	flags, isString := value.(string)
	return !isString || !strings.Contains(flags, "g")
}

func (rule *typeScriptPreferRegexpExec) regexpExec(node *ast.Node) {
	if node.Kind != ast.KindCallExpression || len(node.AsCallExpression().Arguments.Nodes) != 1 {
		return
	}
	object, property, name, _ := helpers.SemanticExpressionMember(rule.context, node.Expression())
	if name != "match" || !helpers.SemanticExpressionNodeIsString(rule.context, object) {
		return
	}
	argument := node.AsCallExpression().Arguments.Nodes[0]
	value, known := helpers.SemanticExpressionStatic(rule.context, argument, 0)
	if !known && !rule.noGlobalFlag(argument) {
		return
	}
	if regex, ok := value.(helpers.SemanticExpressionRegex); ok && strings.Contains(regex.Flags, "g") {
		return
	}
	var receiver string
	if literal := ast.SkipParentheses(argument); literal.Kind == ast.KindStringLiteral {
		pattern := literal.Text()
		if !scanner.ParseRegExpLint(pattern, "").Valid {
			return
		}
		receiver = helpers.RenderRegExpLiteral(pattern, "")
		receiver = strings.ReplaceAll(strings.ReplaceAll(receiver, "\u2028", `\u2028`), "\u2029", `\u2029`)
	} else {
		stringPart, regexpPart := false, false
		for _, part := range helpers.SemanticExpressionParts(rule.context.GetChecker().GetTypeAtLocation(argument)) {
			if part.Flags()&checker.TypeFlagsStringLike != 0 {
				stringPart = true
			} else if rule.regexpType(part) {
				regexpPart = true
			}
		}
		if stringPart == regexpPart {
			return
		}
		if regexpPart {
			receiver = helpers.SemanticExpressionReceiverText(rule.context, argument)
		} else {
			receiver = "RegExp(" + helpers.SemanticExpressionCallText(rule.context, argument) + ")"
		}
	}
	diagnostic := rule.context.Report(rule.context.Range(property), diagnostics.Use_the_RegExp_exec_method_instead)
	rule.replace(diagnostic, node, receiver+".exec("+helpers.SemanticExpressionCallText(rule.context, object)+")")
}

func (rule *typeScriptPreferRegexpExec) action(diagnostic *ast.Diagnostic, description *ast.Diagnostic, suggestion bool, edits ...helpers.SemanticExpressionEdit) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	for _, edit := range edits {
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(edit.Start, edit.End), edit.Text)
	}
	name := "@typescript-eslint/" + "prefer-regexp-exec"
	action := codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), description, name, description)
	if suggestion {
		rule.suggestions[diagnostic] = append(rule.suggestions[diagnostic], action)
	} else {
		diagnostic.SetCodeFixes(action)
	}
}

func (rule *typeScriptPreferRegexpExec) replace(diagnostic *ast.Diagnostic, node *ast.Node, text string) {
	description := diagnostic
	rule.action(diagnostic, description, false, helpers.SemanticExpressionEdit{Start: helpers.SemanticExpressionStart(rule.context, node), End: node.End(), Text: text})
}
