package rules

import (
	"cmp"
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type preferConstRule struct {
	context    Context
	references map[*ast.Symbol][]*ast.Node
}

func newPreferConst(context Context) Rule {
	rule := &preferConstRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindVariableDeclarationList},
	}
}

func (rule *preferConstRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindVariableDeclarationList {
		rule.preferConst(node)
	}

	return true
}

func (rule *preferConstRule) constBinding(binding, declaration, list *ast.Node) declarationConst {
	result := declarationConst{binding: binding}
	writer := (*ast.Node)(nil)
	host := (*ast.Node)(nil)
	if declaration.Initializer() != nil || ast.IsForInOrOfStatement(list.Parent) {
		writer, host = binding, declaration
	}
	readBefore := false
	for _, reference := range rule.refs(binding) {
		if ast.IsAssignmentTarget(reference) {
			if writer != nil && writer != reference {
				return result
			}
			writer = reference
			host = declarationWriteHost(reference)
			if host == nil || host.Kind != ast.KindBinaryExpression || host.AsBinaryExpression().OperatorToken.Kind != ast.KindEqualsToken {
				return result
			}
			outer := helpers.DeclarationOuter(host)
			if outer.Parent == nil || outer.Parent.Kind != ast.KindExpressionStatement {
				return result
			}
			if outer.Parent.Parent.Kind != ast.KindBlock && outer.Parent.Parent.Kind != ast.KindSourceFile && outer.Parent.Parent.Kind != ast.KindCaseClause && outer.Parent.Parent.Kind != ast.KindDefaultClause && outer.Parent.Parent.Kind != ast.KindModuleBlock {
				return result
			}
			if helpers.DeclarationScope(reference, false) != helpers.DeclarationScope(declaration, false) {
				return result
			}
		} else if writer == nil || reference.Pos() < binding.Pos() {
			readBefore = true
		}
	}
	if writer == nil || readBefore && helpers.DeclarationBool(rule.option(0), "ignoreReadBeforeAssign", false) {
		return result
	}
	if host.Kind == ast.KindBinaryExpression {
		targets, invalid := declarationTargets(host.AsBinaryExpression().Left)
		for _, target := range targets {
			symbol := rule.symbol(target)
			if symbol != nil {
				for _, declaration := range symbol.Declarations() {
					if ast.GetRootDeclaration(declaration).Kind == ast.KindParameter || helpers.DeclarationScope(declaration, false) != helpers.DeclarationScope(binding, false) {
						invalid = true
					}
				}
			}
		}
		if invalid {
			return result
		}
	}
	result.report, result.host = writer, host
	if readBefore {
		result.report = binding
	}
	return result
}

func (rule *preferConstRule) fix(report *ast.Diagnostic, tracker *change.Tracker) {
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
	report.SetCodeFixes(codefix.CreateCodeFixAction("prefer-const", changes, ast.NewCompilerDiagnostic(diagnostics.Fix_0, "prefer-const"), "prefer-const", ast.NewCompilerDiagnostic(diagnostics.Fix_0, "prefer-const")))
}

func (rule *preferConstRule) keywordFix(report *ast.Diagnostic, list *ast.Node, keyword string) {
	if rule.context.NewTracker == nil {
		return
	}
	start := rule.Start(list)
	end := list.End()
	if list.Parent.Kind == ast.KindVariableStatement {
		end = list.Parent.End()
	}
	tracker := rule.context.NewTracker()
	rule.replace(tracker, start, end, keyword+rule.context.File.Text()[start+3:end])
	rule.fix(report, tracker)
}

func (rule *preferConstRule) option(index int) map[string]any {
	if index < len(rule.context.Options) {
		value, _ := rule.context.Options[index].(map[string]any)
		return value
	}
	return nil
}

func (rule *preferConstRule) preferConst(list *ast.Node) {
	if list.Flags&ast.NodeFlagsLet == 0 || list.Parent.Kind == ast.KindForStatement {
		return
	}
	groups := make(map[*ast.Node][]declarationConst)
	var order []*ast.Node
	allConst, allInitialized := true, true
	for _, declaration := range list.AsVariableDeclarationList().Declarations.Nodes {
		if declaration.Initializer() == nil && !ast.IsForInOrOfStatement(list.Parent) {
			allInitialized = false
		}
		for _, binding := range helpers.DeclarationBindings(declaration.Name()) {
			candidate := rule.constBinding(binding, declaration, list)
			if candidate.report == nil {
				allConst = false
			}
			hosts := make(map[*ast.Node]bool)
			var keys []*ast.Node
			if declaration.Initializer() != nil || ast.IsForInOrOfStatement(list.Parent) {
				hosts[declaration] = true
				keys = append(keys, declaration)
			}
			for _, reference := range rule.refs(binding) {
				if ast.IsAssignmentTarget(reference) {
					if host := declarationWriteHost(reference); host != nil && !hosts[host] {
						hosts[host] = true
						keys = append(keys, host)
					}
				}
			}
			for _, key := range keys {
				if _, ok := groups[key]; !ok {
					order = append(order, key)
				}
				groups[key] = append(groups[key], candidate)
			}
		}
	}
	var fixReport *ast.Diagnostic
	for _, host := range order {
		candidates := groups[host]
		all := true
		for _, candidate := range candidates {
			if candidate.report == nil {
				all = false
			}
		}
		if rule.option(0)["destructuring"] == "all" && !all {
			continue
		}
		for _, candidate := range candidates {
			if candidate.report != nil {
				fixReport = rule.context.Report(rule.context.Range(candidate.report), diagnostics.X_0_is_never_reassigned_Use_const_instead, candidate.binding.Text())
			}
		}
	}
	if allConst && allInitialized && fixReport != nil {
		rule.keywordFix(fixReport, list, "const")
	}
}

func (rule *preferConstRule) refs(node *ast.Node) []*ast.Node {
	if rule.references == nil {
		rule.references = make(map[*ast.Symbol][]*ast.Node)
		helpers.DeclarationWalk(rule.context.File.AsNode(), func(current *ast.Node) bool {
			if helpers.DeclarationReference(current) {
				if symbol := rule.symbol(current); symbol != nil {
					rule.references[symbol] = append(rule.references[symbol], current)
				}
			}
			return true
		})
	}
	return rule.references[rule.symbol(node)]
}

func (rule *preferConstRule) replace(tracker *change.Tracker, start, end int, text string) {
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), text)
}

func (rule *preferConstRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func (rule *preferConstRule) symbol(node *ast.Node) *ast.Symbol {
	if rule.context.GetChecker == nil {
		return nil
	}
	if node.Parent != nil && node.Parent.Kind == ast.KindShorthandPropertyAssignment {
		return rule.context.GetChecker().GetShorthandAssignmentValueSymbol(node.Parent)
	}
	return rule.context.GetChecker().GetSymbolAtLocation(node)
}

type declarationConst struct{ binding, report, host *ast.Node }

func declarationWriteHost(reference *ast.Node) *ast.Node {
	var host *ast.Node
	for current := reference.Parent; current != nil && !ast.IsStatement(current) && !ast.IsFunctionLike(current); current = current.Parent {
		if current.Kind == ast.KindBinaryExpression && current.AsBinaryExpression().OperatorToken.Kind == ast.KindEqualsToken && helpers.DeclarationContains(current.AsBinaryExpression().Left, reference) {
			host = current
		}
	}
	return host
}

func declarationTargets(node *ast.Node) ([]*ast.Node, bool) {
	node = ast.SkipParentheses(node)
	if node.Kind == ast.KindIdentifier {
		return []*ast.Node{node}, false
	}
	if ast.IsAccessExpression(node) {
		return nil, true
	}
	if node.Kind == ast.KindBinaryExpression && node.AsBinaryExpression().OperatorToken.Kind == ast.KindEqualsToken {
		return declarationTargets(node.AsBinaryExpression().Left)
	}
	if node.Kind == ast.KindSpreadElement || node.Kind == ast.KindSpreadAssignment {
		return declarationTargets(node.Expression())
	}
	var children []*ast.Node
	switch node.Kind {
	case ast.KindObjectLiteralExpression:
		for _, property := range node.AsObjectLiteralExpression().Properties.Nodes {
			switch property.Kind {
			case ast.KindShorthandPropertyAssignment:
				children = append(children, property.Name())
			case ast.KindPropertyAssignment:
				children = append(children, property.Initializer())
			case ast.KindSpreadAssignment:
				children = append(children, property.Expression())
			}
		}
	case ast.KindArrayLiteralExpression:
		children = node.AsArrayLiteralExpression().Elements.Nodes
	}
	var result []*ast.Node
	invalid := false
	for _, child := range children {
		names, member := declarationTargets(child)
		result = append(result, names...)
		invalid = invalid || member
	}
	return result, invalid
}
