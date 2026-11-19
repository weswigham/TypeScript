package rules

import (
	"math"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typeScriptPreferFind struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptPreferFind(context Context) Rule {
	rule := &typeScriptPreferFind{context: context, suggestions: make(map[*ast.Diagnostic][]*codefix.CodeFixAction)}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindElementAccessExpression, ast.KindCallExpression},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typeScriptPreferFind) OnEnterNode(node *ast.Node) bool {
	if rule.context.GetChecker != nil {
		rule.find(node)
	}
	return true
}

func (rule *typeScriptPreferFind) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typeScriptPreferFind) arrayish(value *checker.Type) bool {
	seenArray := false
	for _, part := range helpers.SemanticExpressionParts(value) {
		if part.Flags()&(checker.TypeFlagsNull|checker.TypeFlagsUndefined) != 0 {
			continue
		}
		parts := []*checker.Type{part}
		if part.IsIntersection() {
			parts = part.Types()
		}
		for _, component := range parts {
			if !rule.context.GetChecker().IsArrayType(component) && !checker.IsTupleType(component) {
				return false
			}
		}
		seenArray = true
	}
	return seenArray
}

func (rule *typeScriptPreferFind) filters(node *ast.Node) []*ast.Node {
	node = ast.SkipParentheses(node)
	if node.Kind == ast.KindBinaryExpression && node.AsBinaryExpression().OperatorToken.Kind == ast.KindCommaToken {
		return rule.filters(node.AsBinaryExpression().Right)
	}
	if node.Kind == ast.KindConditionalExpression {
		expression := node.AsConditionalExpression()
		left, right := rule.filters(expression.WhenTrue), rule.filters(expression.WhenFalse)
		if len(left) > 0 && len(right) > 0 {
			return append(left, right...)
		}
		return nil
	}
	if node.Kind != ast.KindCallExpression || node.AsCallExpression().QuestionDotToken != nil {
		return nil
	}
	object, _, name, _ := helpers.SemanticExpressionMember(rule.context, node.Expression())
	if object != nil && name == "filter" && rule.arrayish(helpers.SemanticExpressionConstrained(rule.context, object)) {
		return []*ast.Node{ast.SkipParentheses(node.Expression())}
	}
	return nil
}

func (rule *typeScriptPreferFind) find(node *ast.Node) {
	var receiver *ast.Node
	if node.Kind == ast.KindElementAccessExpression && node.AsElementAccessExpression().QuestionDotToken == nil {
		value, known := helpers.SemanticExpressionStatic(rule.context, node.AsElementAccessExpression().ArgumentExpression, 0)
		if known && helpers.SemanticExpressionString(value) == "0" {
			receiver = node.Expression()
		}
	} else if node.Kind == ast.KindCallExpression && len(node.AsCallExpression().Arguments.Nodes) == 1 {
		object, _, name, optional := helpers.SemanticExpressionMember(rule.context, node.Expression())
		if name == "at" && !optional {
			value, known := helpers.SemanticExpressionStatic(rule.context, node.AsCallExpression().Arguments.Nodes[0], 0)
			if known {
				number := helpers.SemanticExpressionNumber(value)
				if math.IsNaN(number) || math.Trunc(number) == 0 {
					receiver = object
				}
			}
		}
	}
	if receiver == nil {
		return
	}
	filters := rule.filters(receiver)
	if len(filters) == 0 {
		return
	}
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Prefer_find_instead_of_filter_0)
	lexer := scanner.NewScanner()
	lexer.SetText(rule.context.File.Text())
	lexer.SetSkipTrivia(true)
	lexer.ResetPos(receiver.End())
	lexer.Scan()
	edits := []helpers.SemanticExpressionEdit{{Start: lexer.TokenStart(), End: node.End(), Text: ""}}
	for _, member := range filters {
		_, property, _, _ := helpers.SemanticExpressionMember(rule.context, member)
		text := "find"
		if member.Kind == ast.KindElementAccessExpression {
			text = `"find"`
		}
		edits = append(edits, helpers.SemanticExpressionEdit{Start: helpers.SemanticExpressionStart(rule.context, property), End: property.End(), Text: text})
	}
	rule.action(diagnostic, ast.NewCompilerDiagnostic(diagnostics.Use_find_instead_of_filter_0), true, edits...)
}

func (rule *typeScriptPreferFind) action(diagnostic *ast.Diagnostic, description *ast.Diagnostic, suggestion bool, edits ...helpers.SemanticExpressionEdit) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	for _, edit := range edits {
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(edit.Start, edit.End), edit.Text)
	}
	name := "@typescript-eslint/" + "prefer-find"
	action := codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), description, name, description)
	if suggestion {
		rule.suggestions[diagnostic] = append(rule.suggestions[diagnostic], action)
	} else {
		diagnostic.SetCodeFixes(action)
	}
}
