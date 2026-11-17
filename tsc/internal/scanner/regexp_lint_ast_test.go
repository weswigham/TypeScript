package scanner

import (
	"os/exec"
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/json"
)

func TestRegExpLintAST(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		pattern  string
		flags    string
		valid    bool
		captures int
		backrefs int
	}{
		{`(?<word>a|b)\k<word>`, "u", true, 1, 1},
		{`\1(a)`, "", true, 1, 1},
		{`\1`, "", true, 0, 0},
		{`\1`, "u", false, 0, 0},
		{`[[a-z]--[aeiou]]`, "v", true, 0, 0},
		{`[\q{ab|cd}]`, "v", true, 0, 0},
		{`[z-a]`, "", false, 0, 0},
		{`a`, "uv", false, 0, 0},
		{`/`, "u", true, 0, 0},
		{`[/]`, "v", false, 0, 0},
		{`[/]`, "u", true, 0, 0},
		{`[\c_-0]`, "", true, 0, 0},
		{`\k<name>`, "", true, 0, 0},
	} {
		t.Run(test.pattern+"/"+test.flags, func(t *testing.T) {
			t.Parallel()

			parsed := ParseRegExpLint(test.pattern, test.flags)
			if parsed.Valid != test.valid {
				t.Fatalf("valid = %v, want %v: %s", parsed.Valid, test.valid, parsed.Error)
			}
			if !test.valid {
				return
			}
			if len(parsed.Captures) != test.captures || len(parsed.Backreferences) != test.backrefs {
				t.Fatalf("captures/backrefs = %d/%d, want %d/%d", len(parsed.Captures), len(parsed.Backreferences), test.captures, test.backrefs)
			}
			parsed.Walk(func(node *RegExpLintNode, entering bool) {
				if node.Start < 0 || node.End < node.Start || node.End > len(test.pattern) {
					t.Errorf("invalid node range: %+v", node)
				}
				if node.Kind == RegExpLintBackreference && len(node.References) == 0 {
					t.Error("unresolved backreference")
				}
			})
		})
	}
}

func TestRegExpLintECMAScript(t *testing.T) {
	t.Parallel()

	node, err := exec.LookPath("node")
	if err != nil {
		t.Skip("Node.js is unavailable for the ECMAScript compatibility check")
	}
	patterns := []string{``, `/`, `[/]`, `a/b`, `\/`, `\\/`, `\1`, `\8`, `\08`, `\123`, `\1(a)`, `\2(a)`, `[\1]`, `[\8]`, `\k`, `\k<name>`, `\k<(a)>`, `(?<name>a)\k<name>`, `(?<name>a)|(?<name>b)`, `(?<name>a)(?<name>b)`, `[\c]`, `[\c_]`, `[\c_-0]`, `[\c0-0]`, `[[]`, `[]]`, `[^]`, `[a-\d]`, `[\d-a]`, `[z-a]`, `\u{61}`, `\u{1f600}`, `\uD83D\uDE00`, `[\uD83D\uDE00]`, `\x`, `\u`, `\p{ASCII}`, `\p{RGI_Emoji}`, `[\q{ab|cd}]`, `[\q{}]`, `[[a-z]--[aeiou]]`, `[a&&b]`, `[a&&&b]`, `[a--b]`, `[a&&b--c]`, `[!!]`, `[^\q{ab}]`, `(a)\1`, `(?<=\1(a))`, `(?i:a)`, `(?a:b)`, `a{2,1}`, `a{}`, `a{1`, `*`, `(`, `[`, `\`}
	type input struct {
		Pattern string `json:"Pattern"`
		Flags   string `json:"Flags"`
	}
	var inputs []input
	for _, flags := range []string{"", "u", "v"} {
		for _, pattern := range patterns {
			inputs = append(inputs, input{pattern, flags})
		}
	}
	data, err := json.Marshal(inputs)
	if err != nil {
		t.Fatal(err)
	}
	output, err := exec.Command(node, "-e", `process.stdout.write(JSON.stringify(JSON.parse(process.argv[1]).map(({Pattern,Flags})=>{try{new RegExp(Pattern,Flags);return true}catch{return false}})))`, string(data)).CombinedOutput()
	if err != nil {
		t.Fatalf("ECMAScript oracle failed: %v: %s", err, output)
	}
	var valid []bool
	if err := json.Unmarshal(output, &valid); err != nil {
		t.Fatal(err)
	}
	if len(valid) != len(inputs) {
		t.Fatalf("oracle returned %d results for %d patterns", len(valid), len(inputs))
	}
	for index, input := range inputs {
		parsed := ParseRegExpLint(input.Pattern, input.Flags)
		if parsed.Valid != valid[index] {
			t.Errorf("/%s/%s: native valid=%v, ECMAScript valid=%v (%s)", input.Pattern, input.Flags, parsed.Valid, valid[index], parsed.Error)
		}
	}
}

func TestRegExpLintStringSource(t *testing.T) {
	t.Parallel()

	for _, test := range []struct{ raw, value string }{
		{`"a\u0301"`, "a\u0301"},
		{`"\\x01"`, `\x01`},
		{`"\uD83D\uDE00"`, "\U0001f600"},
		{"`a\r\nb`", "a\nb"},
		{"\"a\\\nb\"", "ab"},
	} {
		value, ranges := RegExpLintStringSource(test.raw)
		if value != test.value || len(ranges) != len(value) {
			t.Fatalf("%q: value=%q ranges=%v; want %q", test.raw, value, ranges, test.value)
		}
		for _, span := range ranges {
			if span.Start < 1 || span.End <= span.Start || span.End >= len(test.raw) {
				t.Errorf("invalid source range %+v for %q", span, test.raw)
			}
		}
	}
}
