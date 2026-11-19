package rules

import (
	"cmp"
	"math"
	"slices"
	"strconv"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type preferDestructuringRule struct {
	context Context
}

func newPreferDestructuring(context Context) Rule {
	rule := &preferDestructuringRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindBinaryExpression, ast.KindVariableDeclaration},
	}
}

func (rule *preferDestructuringRule) OnEnterNode(node *ast.Node) bool {
	rule.destructuring(node)

	return true
}

func (rule *preferDestructuringRule) destructuring(node *ast.Node) {
	var left, right *ast.Node
	host := "VariableDeclarator"
	switch node.Kind {
	case ast.KindVariableDeclaration:
		if node.Parent.Kind != ast.KindVariableDeclarationList || node.Parent.Flags&ast.NodeFlagsUsing != 0 {
			return
		}
		left, right = node.Name(), node.Initializer()
	case ast.KindBinaryExpression:
		if node.AsBinaryExpression().OperatorToken.Kind != ast.KindEqualsToken {
			return
		}
		left, right = node.AsBinaryExpression().Left, node.AsBinaryExpression().Right
		host = "AssignmentExpression"
	default:
		return
	}
	if right == nil {
		return
	}
	right = ast.SkipParentheses(right)
	object, property := helpers.DeclarationAccess(right)
	if object == nil || ast.SkipParentheses(object).Kind == ast.KindSuperKeyword || property.Kind == ast.KindPrivateIdentifier || right.Flags&ast.NodeFlagsOptionalChain != 0 {
		return
	}
	kind := "object"
	if right.Kind == ast.KindElementAccessExpression && property.Kind == ast.KindNumericLiteral {
		value, err := strconv.ParseFloat(property.Text(), 64)
		if err == nil && math.Trunc(value) == value {
			kind = "array"
		}
	}
	options := rule.option(0)
	enabled := len(rule.context.Options) == 0
	if len(rule.context.Options) > 0 {
		_, array := options["array"]
		_, objectOption := options["object"]
		if !array && !objectOption {
			options, _ = options[host].(map[string]any)
		}
		enabled = helpers.DeclarationBool(options, kind, false)
	}
	if !enabled {
		return
	}
	matching := left.Kind == ast.KindIdentifier && (right.Kind == ast.KindPropertyAccessExpression && property.Kind == ast.KindIdentifier && property.Text() == left.Text() || right.Kind == ast.KindElementAccessExpression && property.Kind == ast.KindStringLiteral && property.Text() == left.Text())
	if kind == "object" && !matching && !helpers.DeclarationBool(rule.option(1), "enforceForRenamedProperties", false) {
		return
	}
	report := rule.context.Report(rule.context.Range(node), diagnostics.Use_0_destructuring, kind)
	if node.Kind != ast.KindVariableDeclaration || kind != "object" || !matching || right.Kind != ast.KindPropertyAccessExpression || node.Type() != nil || rule.context.NewTracker == nil {
		return
	}
	if helpers.DeclarationComment(rule.context.File.Text()[rule.Start(node):rule.Start(object)]) || helpers.DeclarationComment(rule.context.File.Text()[object.End():node.End()]) {
		return
	}
	tracker := rule.context.NewTracker()
	rule.replace(tracker, rule.Start(node), node.End(), "{"+left.Text()+"} = "+rule.Text(object))
	rule.fix(report, tracker)
}

func (rule *preferDestructuringRule) fix(report *ast.Diagnostic, tracker *change.Tracker) {
	changes := tracker.GetTextChanges()
	for index := range changes {
		edits := changes[index].TextChanges
		if len(edits) < 2 {
			continue
		}
		slices.SortStableFunc(edits, func(left, right core.TextChange) int {
			if order := cmp.Compare(left.Pos(), right.Pos()); order != 0 {
				return order
			}
			return cmp.Compare(left.End(), right.End())
		})
		start, end := edits[0].Pos(), edits[0].Pos()
		var text strings.Builder
		for _, edit := range edits {
			if edit.Pos() < end {
				return
			}
			text.WriteString(rule.context.File.Text()[end:edit.Pos()])
			text.WriteString(edit.NewText)
			end = edit.End()
		}
		changes[index].TextChanges = []core.TextChange{{TextRange: core.NewTextRange(start, end), NewText: text.String()}}
	}
	report.SetCodeFixes(codefix.CreateCodeFixAction("prefer-destructuring", changes, ast.NewCompilerDiagnostic(diagnostics.Fix_0, "prefer-destructuring"), "prefer-destructuring", ast.NewCompilerDiagnostic(diagnostics.Fix_0, "prefer-destructuring")))
}

func (rule *preferDestructuringRule) option(index int) map[string]any {
	if index < len(rule.context.Options) {
		value, _ := rule.context.Options[index].(map[string]any)
		return value
	}
	return nil
}

func (rule *preferDestructuringRule) replace(tracker *change.Tracker, start, end int, text string) {
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), text)
}

func (rule *preferDestructuringRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func (rule *preferDestructuringRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[rule.Start(node):node.End()]
}
