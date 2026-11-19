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

type sortImportsRule struct {
	context        Context
	previousImport *ast.Node
}

func newSortImports(context Context) Rule {
	rule := &sortImportsRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindImportDeclaration},
	}
}

func (rule *sortImportsRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindImportDeclaration {
		rule.sortImports(node)
	}

	return true
}

func (rule *sortImportsRule) fix(diagnostic *ast.Diagnostic, start, end int, replacement string) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), replacement)
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("sort-imports", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "sort-imports"), "sort-imports", ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "sort-imports")))
}

func (rule *sortImportsRule) options(index int) map[string]any {
	if index < len(rule.context.Options) {
		options, _ := rule.context.Options[index].(map[string]any)
		return options
	}
	return nil
}

func (rule *sortImportsRule) sortImports(node *ast.Node) {
	options := rule.options(0)
	ignoreCase := helpers.BooleanOptionValue(options, "ignoreCase", false)
	syntax, first, members, bindings := styleImportParts(node)
	if !helpers.BooleanOptionValue(options, "ignoreDeclarationSort", false) {
		previous := rule.previousImport
		if previous != nil && helpers.BooleanOptionValue(options, "allowSeparatedGroups", false) && helpers.StyleLines(rule.context.File.Text()[previous.End():rule.Start(node)]) > 1 {
			previous = nil
		}
		if previous != nil {
			previousSyntax, previousFirst, _, _ := styleImportParts(previous)
			order := []string{"none", "all", "multiple", "single"}
			if configured, ok := options["memberSyntaxSortOrder"].([]any); ok {
				order = nil
				for _, value := range configured {
					order = append(order, value.(string))
				}
			} else if configured, ok := options["memberSyntaxSortOrder"].([]string); ok {
				order = configured
			}
			if syntax != previousSyntax {
				if slices.Index(order, syntax) < slices.Index(order, previousSyntax) {
					rule.context.Report(rule.context.Range(node), diagnostics.Expected_0_syntax_before_1_syntax, syntax, previousSyntax)
				}
			} else {
				if ignoreCase {
					first, previousFirst = strings.ToLower(first), strings.ToLower(previousFirst)
				}
				if first != "" && previousFirst != "" && helpers.StyleCompare(first, previousFirst) < 0 {
					rule.context.Report(rule.context.Range(node), diagnostics.Imports_should_be_sorted_alphabetically)
				}
			}
		}
		rule.previousImport = node
	}
	if helpers.BooleanOptionValue(options, "ignoreMemberSort", false) {
		return
	}
	for index := 1; index < len(members); index++ {
		left, right := members[index-1].Name().Text(), members[index].Name().Text()
		if ignoreCase {
			left, right = strings.ToLower(left), strings.ToLower(right)
		}
		if helpers.StyleCompare(left, right) > 0 {
			diagnostic := rule.context.Report(rule.context.Range(members[index]), diagnostics.Member_0_of_the_import_declaration_should_be_sorted_alphabetically, members[index].Name().Text())
			if rule.context.NewTracker != nil && !rule.context.NewTracker().NodeHasComments(rule.context.File, bindings) {
				rule.fix(diagnostic, rule.Start(members[0]), members[len(members)-1].End(), rule.sortedText(members, ignoreCase))
			}
			break
		}
	}
}

func (rule *sortImportsRule) sortedText(nodes []*ast.Node, ignoreCase bool) string {
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

func (rule *sortImportsRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func (rule *sortImportsRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[rule.Start(node):node.End()]
}

func styleImportParts(node *ast.Node) (string, string, []*ast.Node, *ast.Node) {
	clause := node.AsImportDeclaration().ImportClause
	if clause == nil {
		return "none", "", nil, nil
	}
	var first string
	count := 0
	if clause.Name() != nil {
		first = clause.Name().Text()
		count++
	}
	bindings := clause.AsImportClause().NamedBindings
	var members []*ast.Node
	if bindings != nil {
		if bindings.Kind == ast.KindNamespaceImport {
			if count == 0 {
				return "all", bindings.Name().Text(), nil, nil
			}
			count++
		} else {
			members = bindings.AsNamedImports().Elements.Nodes
			if count == 0 && len(members) > 0 {
				first = members[0].Name().Text()
			}
			count += len(members)
		}
	}
	syntax := "single"
	if count == 0 {
		syntax = "none"
	} else if count > 1 {
		syntax = "multiple"
	}
	return syntax, first, members, bindings
}
