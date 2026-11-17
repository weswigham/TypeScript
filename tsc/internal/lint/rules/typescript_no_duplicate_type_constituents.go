package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typeScriptNoDuplicateTypeConstituents struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptNoDuplicateTypeConstituents(context Context) Rule {
	return &typeScriptNoDuplicateTypeConstituents{context: context}
}

func (rule *typeScriptNoDuplicateTypeConstituents) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typeScriptNoDuplicateTypeConstituents) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindUnionType || node.Kind == ast.KindIntersectionType {
		rule.duplicates(node)
	}
	return true
}

func (rule *typeScriptNoDuplicateTypeConstituents) OnExitNode(node *ast.Node) {}

func typeScriptNoDuplicateTypeConstituentsSameSyntax(left, right *ast.Node) bool {
	left, right = ast.SkipTypeParentheses(left), ast.SkipTypeParentheses(right)
	if left.Kind != right.Kind {
		return false
	}
	if ast.IsIdentifier(left) || ast.IsLiteralExpression(left) {
		return left.Text() == right.Text()
	}
	var leftChildren, rightChildren []*ast.Node
	left.ForEachChild(func(child *ast.Node) bool { leftChildren = append(leftChildren, child); return false })
	right.ForEachChild(func(child *ast.Node) bool { rightChildren = append(rightChildren, child); return false })
	if len(leftChildren) != len(rightChildren) {
		return false
	}
	for index, child := range leftChildren {
		if !typeScriptNoDuplicateTypeConstituentsSameSyntax(child, rightChildren[index]) {
			return false
		}
	}
	return true
}

func (rule *typeScriptNoDuplicateTypeConstituents) duplicates(node *ast.Node) {
	if node.Kind == ast.KindUnionType && helpers.SemanticTypeOptions(rule.context)["ignoreUnions"] == true || node.Kind == ast.KindIntersectionType && helpers.SemanticTypeOptions(rule.context)["ignoreIntersections"] == true {
		return
	}
	parent := node.Parent
	for parent != nil && parent.Kind == ast.KindParenthesizedType {
		parent = parent.Parent
	}
	if parent != nil && parent.Kind == node.Kind {
		return
	}
	typeChecker := rule.context.GetChecker()
	cached := make(map[*checker.Type]*ast.Node)
	var unique []*ast.Node
	kind := "Union"
	if node.Kind == ast.KindIntersectionType {
		kind = "Intersection"
	}
	optional := parent != nil && parent.Kind == ast.KindParameter && parent.QuestionToken() != nil && ast.IsIdentifier(parent.Name()) && parent.Type() == node
	var visit func(*ast.Node)
	visit = func(raw *ast.Node) {
		part := ast.SkipTypeParentheses(raw)
		var previous *ast.Node
		for _, existing := range unique {
			if typeScriptNoDuplicateTypeConstituentsSameSyntax(part, existing) {
				previous = existing
				break
			}
		}
		value := typeChecker.GetTypeAtLocation(part)
		if previous == nil && value.Flags()&checker.TypeFlagsAny != 0 && value.AsIntrinsicType().IntrinsicName() == "error" {
			return
		}
		if previous == nil {
			previous = cached[value]
		}
		if previous != nil {
			rule.removeConstituent(part, diagnostics.X_0_type_constituent_is_duplicated_with_1, kind, helpers.SemanticTypeText(rule.context, previous))
			return
		}
		if optional && value.Flags()&checker.TypeFlagsUndefined != 0 {
			rule.removeConstituent(part, diagnostics.Explicit_undefined_is_unnecessary_on_an_optional_parameter)
		}
		cached[value] = part
		unique = append(unique, part)
		if part.Kind == node.Kind {
			for _, child := range helpers.SemanticTypeTypes(part) {
				visit(child)
			}
		}
	}
	for _, part := range helpers.SemanticTypeTypes(node) {
		visit(part)
	}
}

func (rule *typeScriptNoDuplicateTypeConstituents) removeConstituent(node *ast.Node, message *diagnostics.Message, args ...any) {
	outer := node
	for outer.Parent.Kind == ast.KindParenthesizedType {
		outer = outer.Parent
	}
	parent := outer.Parent
	parts := helpers.SemanticTypeTypes(parent)
	index := 0
	for parts[index] != outer {
		index++
	}
	reportNode := node
	if outer != node && rule.context.NewTracker != nil {
		reportNode = node.Clone(rule.context.NewTracker())
		reportNode.Loc = core.NewTextRange(node.Pos(), outer.End())
	}
	report := rule.context.Report(rule.context.Range(reportNode), message, args...)
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	tracker.DeleteRange(rule.context.File, core.NewTextRange(helpers.SemanticTypeStart(rule.context, node), node.End()))
	deleteTokens := func(start, end int, separator bool) {
		lexer := scanner.GetScannerForSourceFile(rule.context.File, start)
		for token := lexer.Token(); token != ast.KindEndOfFile && lexer.TokenStart() < end; token = lexer.Scan() {
			if token == ast.KindOpenParenToken || token == ast.KindCloseParenToken || separator && (token == ast.KindBarToken || token == ast.KindAmpersandToken) {
				tracker.DeleteRange(rule.context.File, core.NewTextRange(lexer.TokenStart(), lexer.TokenEnd()))
			}
		}
	}
	deleteTokens(helpers.SemanticTypeStart(rule.context, outer), helpers.SemanticTypeStart(rule.context, node), false)
	deleteTokens(node.End(), outer.End(), false)
	if index > 0 {
		deleteTokens(parts[index-1].End(), helpers.SemanticTypeStart(rule.context, outer), true)
	} else {
		deleteTokens(outer.End(), helpers.SemanticTypeStart(rule.context, parts[1]), true)
	}
	description := ast.NewCompilerDiagnostic(message, args...)
	report.SetCodeFixes(codefix.CreateCodeFixAction("@typescript-eslint/"+"no-duplicate-type-constituents", tracker.GetTextChanges(), description, "", nil))
}
