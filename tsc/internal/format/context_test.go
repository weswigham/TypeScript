package format

import (
	"strings"
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/ls/lsutil"
	"github.com/microsoft/TypeScript/tsc/internal/parser"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
	"gotest.tools/v3/assert"
)

func TestFormattingRuleRequiresDiagnostic(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		name      string
		action    ruleAction
		wantPanic bool
	}{
		{"none", ruleActionNone, false},
		{"stop spaces", ruleActionStopProcessingSpaceActions, false},
		{"stop tokens", ruleActionStopProcessingTokenActions, false},
		{"stop both", ruleActionStopAction, false},
		{"insert space", ruleActionInsertSpace, true},
		{"insert newline", ruleActionInsertNewLine, true},
		{"delete space", ruleActionDeleteSpace, true},
		{"delete token", ruleActionDeleteToken, true},
		{"insert semicolon", ruleActionInsertTrailingSemicolon, true},
		{"mixed stop and edit", ruleActionStopProcessingSpaceActions | ruleActionInsertSpace, true},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			var panicValue any
			func() {
				defer func() { panicValue = recover() }()
				rule("test", nil, ast.KindIdentifier, ast.KindIdentifier, anyContext, test.action)
			}()
			assert.Equal(t, panicValue != nil, test.wantPanic)
			if test.wantPanic {
				assert.Equal(t, panicValue, "Formatting rule test requires a diagnostic")
			}
			message := diagnostics.Expected_a_space_before_1
			spec := rule("valid", message, ast.KindIdentifier, ast.KindIdentifier, anyContext, test.action)
			assert.Assert(t, spec.rule.diagnostic == message)
		})
	}
}

func TestFormattingRulesHaveDiagnostics(t *testing.T) {
	t.Parallel()
	for _, spec := range getAllRules() {
		if spec.rule.action&(ruleActionModifySpaceAction|ruleActionModifyTokenAction) != 0 {
			assert.Assert(t, spec.rule.diagnostic != nil, "Missing diagnostic for %s", spec.rule.debugName)
		}
	}
}

func TestFormattingLinePositions(t *testing.T) {
	t.Parallel()
	for _, text := range []string{"", "value", strings.Repeat("first\r\n\u4e2d\u2028next\nlast\u2029", 32)} {
		file := parser.ParseSourceFile(ast.SourceFileParseOptions{FileName: "/test.ts", PathKey: "/test.ts"}, text, core.ScriptKindTS)
		context := NewFormattingContext(file, FormatRequestKindFormatDocument, lsutil.GetDefaultFormatCodeSettings())
		for _, reverse := range []bool{false, true, false} {
			for i := range len(text) + 1 {
				pos := i
				if reverse {
					pos = len(text) - i
				}
				start := scanner.GetECMALineOfPosition(file, pos)
				for _, end := range []int{pos, min(pos+1, len(text)), len(text)} {
					want := start == scanner.GetECMALineOfPosition(file, end)
					assert.Equal(t, context.rangeIsOnOneLine(core.NewTextRange(pos, end)).IsTrue(), want)
				}
			}
		}
	}
}
