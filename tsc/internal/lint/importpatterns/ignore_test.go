package importpatterns

import "testing"

func TestIgnore(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		patterns  []string
		path      string
		sensitive bool
		want      bool
	}{
		{[]string{"foo/*", "!foo/bar"}, "foo/bar", false, false},
		{[]string{"foo/*", "!foo/bar"}, "foo/bar/baz", false, false},
		{[]string{"foo", "!foo/bar"}, "foo/bar", false, true},
		{[]string{"foo/*", "!foo/bar/baz"}, "foo/bar/baz", false, true},
		{[]string{"foo/**", "!foo/bar", "!foo/bar/baz"}, "foo/bar/baz", false, false},
		{[]string{"**/private/**"}, "@scope/pkg/private/a", false, true},
		{[]string{"/foo"}, "other/foo", false, false},
		{[]string{"foo"}, "other/foo/deep", false, true},
		{[]string{"../foo/*"}, "../foo/bar", false, true},
		{[]string{"FOO"}, "foo", true, false},
		{[]string{"FOO"}, "foo", false, true},
		{[]string{`\!foo`}, "!foo", false, true},
		{[]string{"#foo"}, "#foo", false, false},
		{[]string{`foo\ `}, "foo ", false, true},
		{[]string{"foo/"}, "foo", false, false},
		{[]string{"foo/"}, "foo/bar", false, true},
		{[]string{"foo/[!ab]?"}, "foo/cd", false, true},
	} {
		matcher, err := Compile(test.patterns, test.sensitive)
		if err != nil {
			t.Fatal(err)
		}
		if got := matcher.Match(test.path); got != test.want {
			t.Errorf("%q %q: got %v, want %v", test.patterns, test.path, got, test.want)
		}
	}
}
