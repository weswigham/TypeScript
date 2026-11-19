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

type noVarRule struct {
	context    Context
	references map[*ast.Symbol][]*ast.Node
}

func newNoVar(context Context) Rule {
	rule := &noVarRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindVariableDeclarationList},
	}
}

func (rule *noVarRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindVariableDeclarationList {
		rule.noVar(node)
	}

	return true
}

func (rule *noVarRule) canLet(list *ast.Node) bool {
	parent := list.Parent
	if parent.Kind == ast.KindVariableStatement {
		if parent.Parent.Kind != ast.KindBlock && parent.Parent.Kind != ast.KindSourceFile && parent.Parent.Kind != ast.KindModuleBlock {
			return false
		}
	} else if !ast.IsForInOrOfStatement(parent) && parent.Kind != ast.KindForStatement {
		return false
	}
	scope := helpers.DeclarationScope(list, false)
	functionScope := helpers.DeclarationScope(list, true)
	inLoop := false
	for current := list.Parent; current != nil && !ast.IsFunctionLike(current); current = current.Parent {
		if ast.IsIterationStatement(current, false) {
			inLoop = true
			break
		}
	}
	for _, declaration := range list.AsVariableDeclarationList().Declarations.Nodes {
		if inLoop && declaration.Initializer() == nil && !ast.IsForInOrOfStatement(parent) {
			return false
		}
		for _, binding := range helpers.DeclarationBindings(declaration.Name()) {
			if binding.Text() == "let" {
				return false
			}
			symbol := rule.symbol(binding)
			if symbol == nil || len(symbol.Declarations()) != 1 {
				return false
			}
			for current := declaration.Parent; current != nil && current != functionScope; current = current.Parent {
				if current.Kind == ast.KindCatchClause && current.AsCatchClause().VariableDeclaration != nil {
					for _, caught := range helpers.DeclarationBindings(current.AsCatchClause().VariableDeclaration.Name()) {
						if caught.Text() == binding.Text() {
							return false
						}
					}
				}
			}
			for _, reference := range rule.refs(binding) {
				if !helpers.DeclarationContains(scope, reference) || reference.Pos() < binding.Pos() {
					return false
				}
				if inLoop && helpers.DeclarationScope(reference, true) != functionScope {
					return false
				}
				if initializer := declaration.Initializer(); initializer != nil && helpers.DeclarationContains(initializer, reference) && !ast.IsFunctionLike(ast.SkipParentheses(initializer)) {
					return false
				}
				for current := reference.Parent; current != nil && current != functionScope; current = current.Parent {
					if current.Kind == ast.KindFunctionDeclaration && current.Name() != nil {
						for _, callRef := range rule.refs(current.Name()) {
							outer := helpers.DeclarationOuter(callRef)
							if outer.Pos() < declaration.Pos() && outer.Parent != nil && outer.Parent.Kind == ast.KindCallExpression && outer.Parent.Expression() == outer {
								return false
							}
						}
					}
				}
				for current := binding.Parent; current != nil && current != declaration; current = current.Parent {
					if current.Kind == ast.KindBindingElement && current.Initializer() != nil && helpers.DeclarationContains(current.Initializer(), reference) {
						return false
					}
				}
			}
		}
	}
	return true
}

func (rule *noVarRule) fix(report *ast.Diagnostic, tracker *change.Tracker) {
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
	report.SetCodeFixes(codefix.CreateCodeFixAction("no-var", changes, ast.NewCompilerDiagnostic(diagnostics.Fix_0, "no-var"), "no-var", ast.NewCompilerDiagnostic(diagnostics.Fix_0, "no-var")))
}

func (rule *noVarRule) keywordFix(report *ast.Diagnostic, list *ast.Node, keyword string) {
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

func (rule *noVarRule) noVar(list *ast.Node) {
	if list.Flags&ast.NodeFlagsBlockScoped != 0 {
		return
	}
	if list.Parent.Kind == ast.KindVariableStatement && list.Parent.Parent.Kind == ast.KindModuleBlock && list.Parent.Parent.Parent != nil && ast.IsGlobalScopeAugmentation(list.Parent.Parent.Parent) {
		return
	}
	reportNode := list
	if list.Parent.Kind == ast.KindVariableStatement {
		reportNode = list.Parent
	}
	report := rule.context.Report(rule.context.Range(reportNode), diagnostics.Unexpected_var_use_let_or_const_instead)
	if !rule.canLet(list) {
		return
	}
	rule.keywordFix(report, list, "let")
}

func (rule *noVarRule) refs(node *ast.Node) []*ast.Node {
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

func (rule *noVarRule) replace(tracker *change.Tracker, start, end int, text string) {
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), text)
}

func (rule *noVarRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func (rule *noVarRule) symbol(node *ast.Node) *ast.Symbol {
	if rule.context.GetChecker == nil {
		return nil
	}
	if node.Parent != nil && node.Parent.Kind == ast.KindShorthandPropertyAssignment {
		return rule.context.GetChecker().GetShorthandAssignmentValueSymbol(node.Parent)
	}
	return rule.context.GetChecker().GetSymbolAtLocation(node)
}
