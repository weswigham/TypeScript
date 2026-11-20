package tsoptions

import (
	"fmt"
	"maps"
	"reflect"
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/collections"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/json"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
)

type LintOptions struct {
	Rules                         map[string]string `json:"rules"`
	Plugins                       map[string]string `json:"plugins,omitzero"`
	Ignores                       []string          `json:"ignores,omitempty"`
	Overrides                     []LintOverride    `json:"overrides,omitempty"`
	ReportUnusedDisableDirectives string            `json:"reportUnusedDisableDirectives,omitzero"`
	ruleOptions                   map[string][]any
	pluginResolveFrom             map[string]tspath.RootedDirectoryPath
}

type LintOverride struct {
	Name    string         `json:"name,omitzero"`
	Files   []string       `json:"files,omitempty"`
	Ignores []string       `json:"ignores,omitempty"`
	Rules   map[string]any `json:"rules,omitzero"`
}

func (options *LintOptions) PluginResolveFrom(name string) tspath.RootedDirectoryPath {
	return options.pluginResolveFrom[name]
}

func (options *LintOptions) HasExternalCode() bool {
	return options != nil && len(options.Plugins) != 0
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
	plugins := make(map[string]any, len(options.Plugins))
	for name, specifier := range options.Plugins {
		if directory := options.pluginResolveFrom[name]; directory != "" {
			plugins[name] = struct {
				Specifier   string                     `json:"specifier"`
				ResolveFrom tspath.RootedDirectoryPath `json:"resolveFrom"`
			}{specifier, directory}
		} else {
			plugins[name] = specifier
		}
	}
	return json.MarshalEncode(enc, struct {
		Rules                         map[string]any `json:"rules"`
		Plugins                       map[string]any `json:"plugins,omitempty"`
		Ignores                       []string       `json:"ignores,omitempty"`
		Overrides                     []LintOverride `json:"overrides,omitempty"`
		ReportUnusedDisableDirectives string         `json:"reportUnusedDisableDirectives,omitzero"`
	}{rules, plugins, options.Ignores, options.Overrides, options.ReportUnusedDisableDirectives})
}

func (options *LintOptions) Equals(other *LintOptions) bool {
	return options == other || options != nil && other != nil &&
		slices.Equal(options.Ignores, other.Ignores) &&
		slices.EqualFunc(options.Overrides, other.Overrides, func(a, b LintOverride) bool {
			return a.Name == b.Name && slices.Equal(a.Files, b.Files) && slices.Equal(a.Ignores, b.Ignores) && reflect.DeepEqual(a.Rules, b.Rules)
		}) &&
		options.ReportUnusedDisableDirectives == other.ReportUnusedDisableDirectives &&
		maps.Equal(options.Plugins, other.Plugins) &&
		maps.Equal(options.pluginResolveFrom, other.pluginResolveFrom) &&
		maps.Equal(options.Rules, other.Rules) && maps.EqualFunc(options.ruleOptions, other.ruleOptions, func(a, b []any) bool {
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
	result := &LintOptions{
		Rules:                         make(map[string]string, len(base.Rules)+len(override.Rules)),
		Plugins:                       maps.Clone(base.Plugins),
		Ignores:                       append(slices.Clone(base.Ignores), override.Ignores...),
		Overrides:                     append(slices.Clone(base.Overrides), override.Overrides...),
		ReportUnusedDisableDirectives: base.ReportUnusedDisableDirectives,
		ruleOptions:                   maps.Clone(base.ruleOptions),
		pluginResolveFrom:             maps.Clone(base.pluginResolveFrom),
	}
	maps.Copy(result.Rules, base.Rules)
	maps.Copy(result.Rules, override.Rules)
	if len(override.Plugins) != 0 {
		if result.Plugins == nil {
			result.Plugins = make(map[string]string, len(override.Plugins))
		}
		maps.Copy(result.Plugins, override.Plugins)
	}
	for name := range override.Plugins {
		delete(result.pluginResolveFrom, name)
	}
	if len(override.pluginResolveFrom) != 0 {
		if result.pluginResolveFrom == nil {
			result.pluginResolveFrom = make(map[string]tspath.RootedDirectoryPath)
		}
		maps.Copy(result.pluginResolveFrom, override.pluginResolveFrom)
	}
	if override.ReportUnusedDisableDirectives != "" {
		result.ReportUnusedDisableDirectives = override.ReportUnusedDisableDirectives
	}
	if len(override.ruleOptions) > 0 {
		if result.ruleOptions == nil {
			result.ruleOptions = make(map[string][]any)
		}
		maps.Copy(result.ruleOptions, override.ruleOptions)
	}
	return result
}

func LintSeverity(value any) (string, bool) {
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

func lintRuleValue(value any) (string, []any, string) {
	var values []any
	severityValue := value
	if tuple, ok := value.([]any); ok {
		if len(tuple) == 0 {
			return "", nil, "a nonempty array starting with a severity"
		}
		severityValue = tuple[0]
		if len(tuple) > 1 {
			values = normalizeLintOption(tuple[1:]).([]any)
		}
	}
	severity, ok := LintSeverity(normalizeLintOption(severityValue))
	if value == nil {
		severity, ok = "off", true
	}
	if !ok {
		return "", nil, "'off', 'warn', 'warning', 'error', 0, 1, 2, or a nonempty array starting with a severity"
	}
	return severity, values, ""
}

func lintPatterns(value any, basePath tspath.RootedDirectoryPath) ([]string, bool) {
	if value == nil {
		return nil, true
	}
	var patterns []string
	switch value := value.(type) {
	case []string:
		patterns = value
	case []any:
		patterns = make([]string, len(value))
		for index, item := range value {
			pattern, ok := item.(string)
			if !ok {
				return nil, false
			}
			patterns[index] = pattern
		}
	default:
		return nil, false
	}
	result := make([]string, len(patterns))
	for index, pattern := range patterns {
		original := pattern
		count := 0
		for strings.HasPrefix(pattern, "!") && !strings.HasPrefix(pattern, "!(") {
			count++
			pattern = pattern[1:]
		}
		if pattern == "" {
			return nil, false
		}
		result[index] = original[:count] + basePath.ResolveFile(pattern).AsString()
	}
	return result, true
}

func parseLintOptions(value any, basePath tspath.RootedDirectoryPath) (*LintOptions, []*ast.Diagnostic) {
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
		switch name {
		case "plugins":
			if value == nil {
				continue
			}
			plugins, ok := value.(*collections.OrderedMap[string, any])
			if !ok {
				invalid("lint.plugins", "an object")
				continue
			}
			result.Plugins = make(map[string]string, plugins.Size())
			for alias, value := range plugins.Entries() {
				if alias == "" || strings.ContainsAny(alias, " \t\r\n,") {
					invalid("lint.plugins", "nonempty plugin names without whitespace or commas")
					continue
				}
				specifier, isString := value.(string)
				resolveFrom := basePath
				if descriptor, ok := value.(*collections.OrderedMap[string, any]); ok {
					valid := true
					for property, value := range descriptor.Entries() {
						text, ok := value.(string)
						if !ok || text == "" {
							valid = false
							continue
						}
						switch property {
						case "specifier":
							specifier = text
						case "resolveFrom":
							resolveFrom = basePath.ResolveDirectory(text)
						default:
							valid = false
						}
					}
					isString = valid && specifier != ""
				}
				if !isString || specifier == "" {
					invalid("lint.plugins."+alias, "a nonempty module specifier or an object with 'specifier' and optional 'resolveFrom'")
					continue
				}
				if tspath.IsExternalModuleNameRelative(specifier) || tspath.IsRootedDiskPath(specifier) {
					specifier = resolveFrom.ResolveFile(specifier).AsString()
				} else {
					if result.pluginResolveFrom == nil {
						result.pluginResolveFrom = make(map[string]tspath.RootedDirectoryPath)
					}
					result.pluginResolveFrom[alias] = resolveFrom
				}
				result.Plugins[alias] = specifier
			}
			continue
		case "ignores":
			patterns, ok := lintPatterns(value, basePath)
			if !ok {
				invalid("lint.ignores", "an array of nonempty file patterns")
			}
			result.Ignores = patterns
			continue
		case "overrides":
			if value == nil {
				continue
			}
			overrides, ok := value.([]any)
			if !ok {
				invalid("lint.overrides", "an array of objects")
				continue
			}
			for index, value := range overrides {
				object, ok := value.(*collections.OrderedMap[string, any])
				if !ok {
					invalid("lint.overrides", "an array of objects")
					continue
				}
				prefix := fmt.Sprintf("lint.overrides[%d]", index)
				block := LintOverride{}
				for name, value := range object.Entries() {
					switch name {
					case "name":
						text, ok := value.(string)
						if !ok {
							invalid(prefix+".name", "a string")
						}
						block.Name = text
					case "files", "ignores":
						patterns, ok := lintPatterns(value, basePath)
						if !ok {
							invalid(prefix+"."+name, "an array of nonempty file patterns")
						}
						if name == "files" {
							block.Files = patterns
						} else {
							block.Ignores = patterns
						}
					case "rules":
						if value == nil {
							continue
						}
						rules, ok := value.(*collections.OrderedMap[string, any])
						if !ok {
							invalid(prefix+".rules", "an object")
							continue
						}
						block.Rules = make(map[string]any, rules.Size())
						for rule, value := range rules.Entries() {
							severity, options, expected := lintRuleValue(value)
							if expected != "" {
								invalid(prefix+".rules."+rule, expected)
							} else if len(options) != 0 {
								block.Rules[rule] = append([]any{severity}, options...)
							} else {
								block.Rules[rule] = severity
							}
						}
					default:
						invalid(prefix+"."+name, "'name', 'files', 'ignores', or 'rules'")
					}
				}
				result.Overrides = append(result.Overrides, block)
			}
			continue
		case "reportUnusedDisableDirectives":
			severity, ok := LintSeverity(normalizeLintOption(value))
			if !ok {
				invalid("lint.reportUnusedDisableDirectives", "'off', 'warn', 'warning', 'error', 0, 1, or 2")
			} else {
				result.ReportUnusedDisableDirectives = severity
			}
			continue
		case "rules":
			if value == nil {
				continue
			}
		default:
			invalid("lint."+name, "'rules', 'plugins', 'ignores', 'overrides', or 'reportUnusedDisableDirectives'")
			continue
		}
		rules, ok := value.(*collections.OrderedMap[string, any])
		if !ok {
			invalid("lint.rules", "an object")
			continue
		}
		for name, value := range rules.Entries() {
			severity, values, expected := lintRuleValue(value)
			if expected != "" {
				invalid("lint.rules."+name, expected)
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
