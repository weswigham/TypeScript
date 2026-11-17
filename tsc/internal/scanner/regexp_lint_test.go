package scanner

import (
	"os/exec"
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/json"
)

func TestRegExpEmptyCharacterClasses(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		pattern string
		flags   string
		count   int
	}{
		{`^abc[a-zA-Z]`, "", 0},
		{`[\[]`, "", 0},
		{`[\]]`, "u", 0},
		{`\[][\]]`, "", 0},
		{`[[]`, "", 0},
		{`[^]`, "", 0},
		{`\[][^]`, "", 0},
		{`[[^]]`, "v", 0},
		{`[\q{}]`, "v", 0},
		{`[[a][b]]`, "v", 0},
		{`^abc[]`, "", 1},
		{`[]]`, "", 1},
		{`\[[]`, "", 1},
		{`[(]\u{0}*[]`, "u", 1},
		{`[]`, "v", 1},
		{`[[]]`, "v", 1},
		{`[[a][]]`, "v", 1},
		{`[a[[b[]c]]d]`, "v", 1},
		{`[a--[]]`, "v", 1},
		{`[[]--b]`, "v", 1},
		{`[a&&[]]`, "v", 1},
		{`[[]&&b]`, "v", 1},
		{`[][]`, "", 2},
		{`\1[]`, "", 1},
		{`[\1][]`, "", 1},
		{`\08[]`, "", 1},
		{`[\8][]`, "", 1},
		{`\k<[]>`, "", 1},
		{`\k{2}[]`, "", 1},
		{`(?<name>a)\k<name>[]`, "u", 1},
		{`(?<name>a)|(?<name>b)[]`, "", 1},
		{`[](`, "", 0},
		{`[]\1`, "u", 0},
		{`[]\k<missing>`, "u", 0},
		{`[]\k<missing>(?<name>a)`, "", 0},
		{`[][z-a]`, "", 0},
		{`[][\q]`, "v", 0},
		{`[][a&&&b]`, "v", 0},
	} {
		t.Run(test.pattern+"/"+test.flags, func(t *testing.T) {
			t.Parallel()

			if count := RegExpEmptyCharacterClasses(test.pattern, test.flags); count != test.count {
				t.Fatalf("got %d empty classes, want %d", count, test.count)
			}
		})
	}
}

func TestRegExpEmptyCharacterClassesECMAScript(t *testing.T) {
	t.Parallel()
	node, err := exec.LookPath("node")
	if err != nil {
		t.Skip("Node.js is unavailable for the ECMAScript compatibility check")
	}
	patterns := []string{
		`[\c_-0][]`, `[\c0-0][]`, `[\c-0][]`, `[\c][]`, `[\c[][]`,
		`[\c_][]`, `[\c0][]`, `[\c9][]`, `[\c*][]`, `[\c-][]`,
		`[\c]-a][]`, `[\c-a][]`, `[\c\][][]`, `[\c-\d][]`,
		`\k<[]>`, `\k{2}[]`, `\1[]`, `[\1][]`, `\08[]`,
		`(?<name>a)|(?<name>b)[]`, `(?<name>a)\k<name>[]`,
	}
	data, err := json.Marshal(patterns)
	if err != nil {
		t.Fatal(err)
	}
	output, err := exec.Command(node, "-e", `process.stdout.write(JSON.stringify(JSON.parse(process.argv[1]).map(pattern => { try { new RegExp(pattern); return true; } catch { return false; } })))`, string(data)).CombinedOutput()
	if err != nil {
		t.Fatalf("JavaScript oracle failed: %v: %s", err, output)
	}
	var valid []bool
	if err := json.Unmarshal(output, &valid); err != nil {
		t.Fatal(err)
	}
	if len(valid) != len(patterns) {
		t.Fatalf("got %d oracle results for %d patterns", len(valid), len(patterns))
	}
	for index, pattern := range patterns {
		want := 0
		if valid[index] {
			want = 1
		}
		if count := RegExpEmptyCharacterClasses(pattern, ""); count != want {
			t.Errorf("%q: got %d empty classes, want %d (JavaScript valid: %t)", pattern, count, want, valid[index])
		}
	}
}
