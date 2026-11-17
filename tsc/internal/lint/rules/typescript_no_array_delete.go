package rules

import (
	"slices"
	"strings"
	"unicode/utf16"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoArrayDeleteRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func (rule *typescriptNoArrayDeleteRule) arrayType(valueType *checker.Type) bool {
	typeChecker := rule.context.GetChecker()
	predicate := func(part *checker.Type) bool { return typeChecker.IsArrayType(part) || checker.IsTupleType(part) }
	if valueType.IsUnion() {
		for _, part := range valueType.Types() {
			if !predicate(part) {
				return false
			}
		}
		return true
	}
	if valueType.IsIntersection() {
		return slices.ContainsFunc(valueType.Types(), predicate)
	}
	return predicate(valueType)
}

func (rule *typescriptNoArrayDeleteRule) arrayDelete(node *ast.Node) {
	member := ast.SkipParentheses(node.Expression())
	if !ast.IsAccessExpression(member) || !rule.arrayType(helpers.TypeSafetyConstrainedNode(rule.context, member.Expression())) {
		return
	}
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Using_the_delete_operator_with_an_array_expression_is_unsafe)
	if rule.context.NewTracker == nil {
		return
	}
	property := member.Name()
	if member.Kind == ast.KindElementAccessExpression {
		property = member.AsElementAccessExpression().ArgumentExpression
	}
	property = ast.SkipParentheses(property)
	key := typeSafetyNodeText(rule.context, property)
	if property.Kind == ast.KindBinaryExpression && property.AsBinaryExpression().OperatorToken.Kind == ast.KindCommaToken {
		key = "(" + key + ")"
	}
	replacement := typeSafetyNodeText(rule.context, ast.SkipParentheses(member.Expression())) + ".splice(" + key + ", 1)"
	start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
	comments := (&helpers.SourceCommentContext{Context: rule.context}).Comments(start, node.End())
	if len(comments) != 0 {
		lineStart := strings.LastIndex(rule.context.File.Text()[:start], "\n") + 1
		indent := strings.Repeat(" ", len(utf16.Encode([]rune(rule.context.File.Text()[lineStart:start]))))
		var texts []string
		for _, comment := range comments {
			texts = append(texts, rule.context.File.Text()[comment.Start:comment.End])
		}
		replacement = strings.Join(texts, "\n"+indent) + "\n" + indent + replacement
	}
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, node.End()), replacement)
	rule.AddSuggestion(diagnostic, "@typescript-eslint/"+"no-array-delete", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Use_array_splice_instead))
}

func (rule *typescriptNoArrayDeleteRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindDeleteExpression {
		rule.arrayDelete(node)
	}
	return true
}

func (rule *typescriptNoArrayDeleteRule) OnExitNode(node *ast.Node) {}

func typeSafetyNodeText(context Context, node *ast.Node) string {
	return context.File.Text()[scanner.GetTokenPosOfNode(node, context.File, false):node.End()]
}

func newTypeScriptNoArrayDelete(context Context) Rule {
	return &typescriptNoArrayDeleteRule{context: context}
}
