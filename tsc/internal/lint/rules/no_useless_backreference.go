package rules

import (
	"fmt"
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noUselessBackreference struct{ helpers.RegexSource }

func newNoUselessBackreference(context Context) Rule {
	rule := &noUselessBackreference{RegexSource: helpers.NewRegexSource(context)}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindRegularExpressionLiteral, ast.KindCallExpression, ast.KindNewExpression},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *noUselessBackreference) OnEnterNode(node *ast.Node) bool {
	input := rule.Input(node)
	if input == nil || !input.KnownPattern {
		return true
	}
	parsed := helpers.ParseRegexInput(input)
	if parsed.Valid {
		rule.backreferences(input, parsed)
	}
	return true
}

func (rule *noUselessBackreference) backreferences(input *helpers.RegexInput, parsed *scanner.RegExpLint) {
	messages := []*diagnostics.Message{
		diagnostics.Backreference_0_will_be_ignored_It_references_group_1_2_from_within_that_group,
		diagnostics.Backreference_0_will_be_ignored_It_references_group_1_2_which_appears_later_in_the_pattern,
		diagnostics.Backreference_0_will_be_ignored_It_references_group_1_2_which_appears_before_in_the_same_lookbehind,
		diagnostics.Backreference_0_will_be_ignored_It_references_group_1_2_which_is_in_another_alternative,
		diagnostics.Backreference_0_will_be_ignored_It_references_group_1_2_which_is_in_a_negative_lookaround,
	}
	for _, reference := range parsed.Backreferences {
		problems := make([]int, len(reference.References))
		valid, same := false, false
		for index, capture := range reference.References {
			problems[index] = regexBackreferenceProblem(reference, capture)
			valid = valid || problems[index] < 0
			same = same || problems[index] != 3
		}
		if valid || len(problems) == 0 {
			continue
		}
		selected, count := -1, 0
		for index, problem := range problems {
			if !same || problem != 3 {
				if selected < 0 {
					selected = index
				}
				count++
			}
		}
		other := ""
		if count == 2 {
			other = " and another group"
		} else if count > 2 {
			other = fmt.Sprintf(" and other %d groups", count-1)
		}
		capture := reference.References[selected]
		rule.Context.Report(rule.Context.Range(input.Node), messages[problems[selected]], input.Pattern[reference.Start:reference.End], input.Pattern[capture.Start:capture.End], other)
	}
}

func regexAncestorPath(node *scanner.RegExpLintNode) []*scanner.RegExpLintNode {
	var result []*scanner.RegExpLintNode
	for ; node != nil; node = node.Parent {
		result = append(result, node)
	}
	return result
}

func regexBackreferenceProblem(reference, capture *scanner.RegExpLintNode) int {
	referencePath, capturePath := regexAncestorPath(reference), regexAncestorPath(capture)
	if slices.Contains(referencePath, capture) {
		return 0
	}
	referenceIndex, captureIndex := len(referencePath)-1, len(capturePath)-1
	for referenceIndex >= 0 && captureIndex >= 0 && referencePath[referenceIndex] == capturePath[captureIndex] {
		referenceIndex--
		captureIndex--
	}
	if captureIndex >= 0 && capturePath[captureIndex].Kind == scanner.RegExpLintAlternative {
		return 3
	}
	backward := false
	for _, ancestor := range capturePath[captureIndex+1:] {
		if ancestor.Kind == scanner.RegExpLintAssertion && len(ancestor.Children) > 0 {
			backward = ancestor.Behind
			break
		}
	}
	if !backward && reference.End <= capture.Start {
		return 1
	}
	if backward && capture.End <= reference.Start {
		return 2
	}
	for _, ancestor := range capturePath[:captureIndex+1] {
		if ancestor.Kind == scanner.RegExpLintAssertion && ancestor.Negative {
			return 4
		}
	}
	return -1
}
