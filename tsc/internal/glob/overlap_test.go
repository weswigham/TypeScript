package glob

import "testing"

func TestOverlaps(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		left, right string
		want        bool
	}{
		{"src/**/*.ts", "src/generated.ts", true},
		{"src/foo*.ts", "src/*bar.ts", true},
		{"src/**/*.ts", "other/**/*.ts", false},
		{"src/**/*.ts", "src/**/*.js", false},
		{"src/*.{ts,js}", "src/file.js", true},
		{"src/[a-z].ts", "src/[0-9].ts", false},
		{"src/*.ts", "src/nested/file.ts", false},
	} {
		left, err := Parse(test.left)
		if err != nil {
			t.Fatal(err)
		}
		right, err := Parse(test.right)
		if err != nil {
			t.Fatal(err)
		}
		if got := left.Overlaps(right); got != test.want {
			t.Errorf("%q overlaps %q = %v, want %v", test.left, test.right, got, test.want)
		}
	}
}

func TestGenerationGlobSemantics(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		pattern, name string
		want          bool
	}{
		{"generated/*.ts", "generated/value.ts", true},
		{"generated/*.ts", "generated/nested/value.ts", false},
		{"generated/**/*.ts", "generated/nested/value.ts", true},
		{"generated/*.{ts,json}", "generated/value.json", true},
		{"generated/[!a-z].ts", "generated/1.ts", true},
		{"generated/[!a-z].ts", "generated/a.ts", false},
		{"generated/?.ts", "generated/\u00e9.ts", true},
	} {
		pattern, err := Parse(test.pattern)
		if err != nil {
			t.Fatal(err)
		}
		literal := (&Glob{}).WithLiteralPrefix(test.name)
		if got := pattern.Match(test.name); got != test.want {
			t.Errorf("%q matches %q = %v, want %v", test.pattern, test.name, got, test.want)
		}
		if got := pattern.Overlaps(literal); got != test.want {
			t.Errorf("%q overlaps literal %q = %v, want %v", test.pattern, test.name, got, test.want)
		}
	}
	shallow, err := Parse("generated/*.ts")
	if err != nil {
		t.Fatal(err)
	}
	recursive, err := Parse("generated/**/*.ts")
	if err != nil {
		t.Fatal(err)
	}
	if shallow.CanMatchPrefix("generated/nested/") {
		t.Fatal("shallow pattern must prune nested directories")
	}
	if !recursive.CanMatchPrefix("generated/nested/") {
		t.Fatal("recursive pattern must traverse nested directories")
	}
}
