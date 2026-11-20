package glob

import "testing"

func TestStarDirectorySegments(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		pattern, input string
		match          bool
	}{
		{"src/*/file.ts", "src/common/file.ts", true},
		{"src/pre*/file.ts", "src/prefix/file.ts", true},
		{"**/src/vs/*/**/*.d.ts", "project/src/vs/base/common/lib.d.ts", true},
		{"**/src/vs/*/**/*.d.ts", "project/src/vs/base/common/lib.ts", false},
		{"src/*/file.ts", "src/common/nested/file.ts", false},
		{"src/*/file.ts", "src/commonfile.ts", false},
	} {
		pattern, err := Parse(test.pattern)
		if err != nil {
			t.Fatal(err)
		}
		if got := pattern.Match(test.input); got != test.match {
			t.Errorf("%q.Match(%q) = %v, want %v", test.pattern, test.input, got, test.match)
		}
	}
}
