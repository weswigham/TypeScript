package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type sortVarsRule struct {
	context Context
}

func (rule *sortVarsRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindVariableDeclarationList {
		rule.sortVars(node)
	}

	return true
}

func (rule *sortVarsRule) OnExitNode(node *ast.Node) {
}

func (rule *sortVarsRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return nil
}

func (rule *sortVarsRule) fix(diagnostic *ast.Diagnostic, start, end int, replacement string) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), replacement)
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("sort-vars", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "sort-vars"), "sort-vars", ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "sort-vars")))
}

func (rule *sortVarsRule) options(index int) map[string]any {
	if index < len(rule.context.Options) {
		options, _ := rule.context.Options[index].(map[string]any)
		return options
	}
	return nil
}

func (rule *sortVarsRule) sortVars(node *ast.Node) {
	var declarations []*ast.Node
	unfixable := false
	for _, declaration := range node.AsVariableDeclarationList().Declarations.Nodes {
		if declaration.Name().Kind != ast.KindIdentifier {
			continue
		}
		declarations = append(declarations, declaration)
		if initializer := declaration.Initializer(); initializer != nil {
			if !slices.Contains([]ast.Kind{ast.KindNumericLiteral, ast.KindStringLiteral, ast.KindBigIntLiteral, ast.KindRegularExpressionLiteral, ast.KindTrueKeyword, ast.KindFalseKeyword, ast.KindNullKeyword}, ast.SkipParentheses(initializer).Kind) {
				unfixable = true
			}
		}
	}
	ignoreCase := helpers.BooleanOptionValue(rule.options(0), "ignoreCase", false)
	maximum := ""
	fixed := false
	for index, declaration := range declarations {
		name := declaration.Name().Text()
		if ignoreCase {
			name = strings.ToLower(name)
		}
		if index > 0 && helpers.StyleCompare(name, maximum) < 0 {
			diagnostic := rule.context.Report(rule.context.Range(declaration), diagnostics.Variables_within_the_same_declaration_block_should_be_sorted_alphabetically)
			if !fixed && !unfixable {
				rule.fix(diagnostic, rule.Start(declarations[0]), declarations[len(declarations)-1].End(), rule.sortedText(declarations, ignoreCase))
			}
			fixed = true
		} else {
			maximum = name
		}
	}
}

func (rule *sortVarsRule) sortedText(nodes []*ast.Node, ignoreCase bool) string {
	sorted := slices.Clone(nodes)
	slices.SortStableFunc(sorted, func(left, right *ast.Node) int {
		leftName, rightName := left.Name().Text(), right.Name().Text()
		if ignoreCase {
			leftName, rightName = strings.ToLower(leftName), strings.ToLower(rightName)
		}
		return helpers.StyleCompare(leftName, rightName)
	})
	var result strings.Builder
	for index, node := range sorted {
		result.WriteString(rule.Text(node))
		if index+1 < len(nodes) {
			result.WriteString(rule.context.File.Text()[nodes[index].End():rule.Start(nodes[index+1])])
		}
	}
	return result.String()
}

func (rule *sortVarsRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func (rule *sortVarsRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[rule.Start(node):node.End()]
}

func newSortVars(context Context) Rule { return &sortVarsRule{context: context} }
