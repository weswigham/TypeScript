package regex_test

import (
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/lint/regex"
)

func TestECMAScriptPatterns(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		pattern, value string
		valid, match   bool
	}{
		{`^foo(?=Bar)`, "fooBar", true, true},
		{`falls?(?!ing) through`, "falling through", true, false},
		{`(?<word>fall)\s+\k<word>`, "fall fall", true, true},
		{`^\p{Letter}+\s+\p{Number}+$`, "Éclair\u00a0123", true, true},
		{`(`, "anything", false, false},
		{`^.+$`, "value", true, true},
		{`^.+$`, "", true, false},
		{`^(?!foo)(?!bar).+$`, "foo", true, false},
		{`^(?!foo)(?!bar).+$`, "valid", true, true},
		{`^(?=a)[a-z]+$`, "apple", true, true},
		{`(?<=foo)bar`, "foobar", true, true},
		{`(?<!foo)bar`, "foobar", true, false},
		{`^(a+)\1$`, "aaaa", true, true},
		{`^(a+)\1$`, "aaa", true, false},
		{`^(?<part>foo)\k<part>$`, "foofoo", true, true},
		{`^(a|(b))\2$`, "a", true, true},
		{`^\p{Letter}+$`, "\u03b1\u03b2", true, true},
		{`^\p{Script=Greek}+$`, "\u03b1\u03b2", true, true},
		{`^\w+$`, "\u03b1", true, false},
		{`^\s$`, "\ufeff", true, true},
		{`^\s$`, "\u0085", true, false},
		{`^\u{10400}$`, "\U00010400", true, true},
		{`^\uD801\uDC00$`, "\U00010400", true, true},
		{`^a{2,4}?$`, "aaa", true, true},
		{`^a{2,4}$`, "a", true, false},
		{`^[]$`, "a", true, false},
		{`^[^]$`, "\n", true, true},
		{`\bfoo\b`, "foo", true, true},
		{`\bfoo\b`, "foobar", true, false},
		{`^(?:a|b)+$`, "abba", true, true},
		{`^([a-z]+)_\1$`, "same_same", true, true},
		{`^([a-z]+)_\1$`, "same_other", true, false},
	} {
		t.Run(test.pattern+"/"+test.value, func(t *testing.T) {
			t.Parallel()
			pattern := regex.Compile(test.pattern)
			if pattern.IsValid() != test.valid {
				t.Fatalf("valid = %v, want %v", pattern.IsValid(), test.valid)
			}
			if match := pattern.MatchString(test.value); match != test.match {
				t.Fatalf("match = %v, want %v", match, test.match)
			}
		})
	}
}
