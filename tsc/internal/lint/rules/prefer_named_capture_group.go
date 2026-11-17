package rules

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type preferNamedCaptureGroup struct{ helpers.RegexSource }

func (rule *preferNamedCaptureGroup) OnEnterNode(node *ast.Node) bool {
	input := rule.Input(node)
	if input == nil || !input.KnownPattern {
		return true
	}
	parsed := helpers.ParseRegexInput(input)
	if parsed.Valid {
		rule.named(input, parsed)
	}
	return true
}

func (rule *preferNamedCaptureGroup) named(input *helpers.RegexInput, parsed *scanner.RegExpLint) {
	for _, capture := range parsed.Captures {
		if capture.Name != "" {
			continue
		}
		diagnostic := rule.Context.Report(rule.Context.Range(input.Node), diagnostics.Capture_group_0_should_be_converted_to_a_named_or_non_capturing_group, input.Pattern[capture.Start:capture.End])
		if input.Pattern != input.RawPattern {
			continue
		}
		maximum := 0
		for index := 0; index+4 < len(input.Pattern); index++ {
			if !strings.HasPrefix(input.Pattern[index:], "temp") {
				continue
			}
			end := index + 4
			for end < len(input.Pattern) && input.Pattern[end] >= '0' && input.Pattern[end] <= '9' {
				end++
			}
			value, _ := strconv.Atoi(input.Pattern[index+4 : end])
			if value > maximum {
				maximum = value
			}
		}
		rule.Edit(diagnostic, "prefer-named-capture-group", input.Start+capture.Start+1, input.Start+capture.Start+1, fmt.Sprintf("?<temp%d>", maximum+1), ast.NewCompilerDiagnostic(diagnostics.Add_name_to_capture_group), true)
		rule.Edit(diagnostic, "prefer-named-capture-group", input.Start+capture.Start+1, input.Start+capture.Start+1, "?:", ast.NewCompilerDiagnostic(diagnostics.Convert_group_to_non_capturing), true)
	}
}

func newPreferNamedCaptureGroup(context Context) Rule {
	return &preferNamedCaptureGroup{RegexSource: helpers.NewRegexSource(context)}
}
