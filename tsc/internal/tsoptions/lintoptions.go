package tsoptions

import (
	"maps"
	"reflect"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/collections"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/json"
)

type LintOptions struct {
	Rules       map[string]string `json:"rules"`
	ruleOptions map[string][]any
}

func (p *ParsedCommandLine) LintRules() map[string]string {
	if p.ParsedConfig.Lint == nil {
		return nil
	}
	return p.ParsedConfig.Lint.Rules
}

// LintRuleOptions returns the rule's positional options without its severity.
// Objects are map[string]any, arrays are []any, and scalars are string, float64,
// bool, or nil. The returned values are shared configuration and must not be mutated.
func (p *ParsedCommandLine) LintRuleOptions(name string) []any {
	if p.ParsedConfig.Lint == nil {
		return nil
	}
	return p.ParsedConfig.Lint.ruleOptions[name]
}

func (options *LintOptions) MarshalJSONTo(enc *json.Encoder) error {
	rules := make(map[string]any, len(options.Rules))
	for name, severity := range options.Rules {
		if values := options.ruleOptions[name]; len(values) > 0 {
			rules[name] = append([]any{severity}, values...)
		} else {
			rules[name] = severity
		}
	}
	return json.MarshalEncode(enc, struct {
		Rules map[string]any `json:"rules"`
	}{Rules: rules})
}

func (options *LintOptions) Equals(other *LintOptions) bool {
	return options == other || options != nil && other != nil && maps.Equal(options.Rules, other.Rules) && maps.EqualFunc(options.ruleOptions, other.ruleOptions, func(a, b []any) bool {
		return reflect.DeepEqual(a, b)
	})
}

func mergeLintOptions(base, override *LintOptions) *LintOptions {
	if base == nil {
		return override
	}
	if override == nil {
		return base
	}
	result := &LintOptions{Rules: make(map[string]string, len(base.Rules)+len(override.Rules)), ruleOptions: maps.Clone(base.ruleOptions)}
	maps.Copy(result.Rules, base.Rules)
	maps.Copy(result.Rules, override.Rules)
	if len(override.ruleOptions) > 0 {
		if result.ruleOptions == nil {
			result.ruleOptions = make(map[string][]any)
		}
		maps.Copy(result.ruleOptions, override.ruleOptions)
	}
	return result
}

func lintSeverity(value any) (string, bool) {
	switch value := value.(type) {
	case string:
		switch value {
		case "off", "warning", "error":
			return value, true
		case "warn":
			return "warning", true
		}
	case float64:
		switch value {
		case 0:
			return "off", true
		case 1:
			return "warning", true
		case 2:
			return "error", true
		}
	}
	return "", false
}

func normalizeLintOption(value any) any {
	switch value := value.(type) {
	case *collections.OrderedMap[string, any]:
		result := make(map[string]any, value.Size())
		for name, item := range value.Entries() {
			result[name] = normalizeLintOption(item)
		}
		return result
	case []any:
		result := make([]any, len(value))
		for index, item := range value {
			result[index] = normalizeLintOption(item)
		}
		return result
	case int, int8, int16, int32, int64, uint, uint8, uint16, uint32, uint64, float32:
		return reflect.ValueOf(value).Convert(reflect.TypeFor[float64]()).Float()
	default:
		return value
	}
}

func parseLintOptions(value any) (*LintOptions, []*ast.Diagnostic) {
	if value == nil {
		return nil, nil
	}
	var errors []*ast.Diagnostic
	invalid := func(name, expected string) {
		errors = append(errors, ast.NewCompilerDiagnostic(diagnostics.Argument_for_0_option_must_be_Colon_1, name, expected))
	}
	object, ok := value.(*collections.OrderedMap[string, any])
	if !ok {
		invalid("lint", "an object")
		return nil, errors
	}
	result := &LintOptions{Rules: make(map[string]string)}
	for name, value := range object.Entries() {
		if name != "rules" {
			invalid("lint."+name, "'rules'")
			continue
		}
		if value == nil {
			continue
		}
		rules, ok := value.(*collections.OrderedMap[string, any])
		if !ok {
			invalid("lint.rules", "an object")
			continue
		}
		for name, value := range rules.Entries() {
			var values []any
			severityValue := value
			if tuple, ok := value.([]any); ok {
				if len(tuple) == 0 {
					invalid("lint.rules."+name, "a nonempty array starting with a severity")
					continue
				}
				severityValue = tuple[0]
				if len(tuple) > 1 {
					values = normalizeLintOption(tuple[1:]).([]any)
				}
			}
			severity, ok := lintSeverity(normalizeLintOption(severityValue))
			if value == nil {
				severity, ok = "off", true
			}
			if !ok {
				invalid("lint.rules."+name, "'off', 'warn', 'warning', 'error', 0, 1, 2, or a nonempty array starting with a severity")
				continue
			}
			result.Rules[name] = severity
			if len(values) > 0 {
				if result.ruleOptions == nil {
					result.ruleOptions = make(map[string][]any)
				}
				result.ruleOptions[name] = values
			}
		}
	}
	return result, errors
}
