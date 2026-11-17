package config

import "testing"

func TestRuleOptionValidation(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		name    string
		options []any
		valid   bool
	}{
		{"no-debugger", nil, true},
		{"no-debugger", []any{map[string]any{"unsupported": true}}, false},
		{"eqeqeq", []any{"always"}, true},
		{"eqeqeq", []any{"not-an-option"}, false},
		{"no-console", []any{map[string]any{"allow": []any{"warn"}}}, true},
		{"no-console", []any{map[string]any{"alow": []any{"warn"}}}, false},
		{"max-depth", []any{float64(4)}, true},
		{"max-depth", []any{4.5}, false},
		{"max-lines", []any{map[string]any{"skipComments": "yes"}}, false},
		{"@typescript-eslint/naming-convention", []any{map[string]any{"selector": "variable", "format": []any{"camelCase"}}}, true},
		{"@typescript-eslint/naming-convention", []any{map[string]any{"selector": "not-a-selector", "format": []any{"camelCase"}}}, false},
		{"@typescript-eslint/only-throw-error", []any{map[string]any{"allow": []any{map[string]any{"from": "file", "name": "Error", "path": "input.ts"}}}}, true},
		{"no-restricted-exports", []any{map[string]any{"restrictedNamedExports": []any{"default"}}}, true},
		{"no-restricted-exports", []any{map[string]any{"restrictedNamedExports": []any{"default"}, "restrictDefaultExports": map[string]any{}}}, false},
		{"no-restricted-exports", []any{map[string]any{"restrictedNamedExports": []any{"value"}}}, true},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			err := ValidateRuleOptions(test.name, test.options)
			if (err == nil) != test.valid {
				t.Fatalf("options %v: got %v, valid=%v", test.options, err, test.valid)
			}
		})
	}
}

func TestDefaultRuleOptions(t *testing.T) {
	t.Parallel()
	for name := range ruleOptions() {
		t.Run(name, func(t *testing.T) {
			t.Parallel()
			if err := ValidateRuleOptions(name, nil); err != nil {
				t.Fatal(err)
			}
		})
	}
}
