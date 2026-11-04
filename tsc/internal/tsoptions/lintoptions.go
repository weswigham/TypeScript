package tsoptions

import (
	"maps"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/collections"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type LintOptions struct {
	Rules map[string]string `json:"rules"`
}

func (p *ParsedCommandLine) LintRules() map[string]string {
	if p.ParsedConfig.Lint == nil {
		return nil
	}
	return p.ParsedConfig.Lint.Rules
}

func (options *LintOptions) Equals(other *LintOptions) bool {
	return options == other || options != nil && other != nil && maps.Equal(options.Rules, other.Rules)
}

func mergeLintOptions(base, override *LintOptions) *LintOptions {
	if base == nil {
		return override
	}
	if override == nil {
		return base
	}
	result := &LintOptions{Rules: maps.Clone(base.Rules)}
	maps.Copy(result.Rules, override.Rules)
	return result
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
			severity, ok := value.(string)
			if value == nil {
				severity, ok = "off", true
			}
			if !ok || severity != "off" && severity != "warning" && severity != "error" {
				invalid("lint.rules."+name, "'off', 'warning', or 'error'")
				continue
			}
			result.Rules[name] = severity
		}
	}
	return result, errors
}
