package helpers

import (
	"fmt"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/lint/regex"
)

func CompileRegexMatcher(pattern, flags string) (func(string) bool, error) {
	var modifiers strings.Builder
	for _, flag := range flags {
		switch flag {
		case 'i', 'm', 's':
			modifiers.WriteRune(flag)
		case 'u':
			continue
		default:
			return nil, fmt.Errorf("unsupported regular expression flag %q", flag)
		}
	}
	if modifiers.Len() != 0 {
		pattern = "(?" + modifiers.String() + ":" + pattern + ")"
	}
	compiled := regex.Compile(pattern)
	if !compiled.IsValid() {
		return nil, fmt.Errorf("invalid ECMAScript regular expression %q", pattern)
	}
	return compiled.MatchString, nil
}

func MustCompileRegexMatcher(pattern, flags string) func(string) bool {
	compiled, err := CompileRegexMatcher(pattern, flags)
	if err != nil {
		panic(err)
	}
	return compiled
}
