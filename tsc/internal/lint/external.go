package lint

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"unicode/utf8"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	lintconfig "github.com/microsoft/TypeScript/tsc/internal/lint/config"
	linthost "github.com/microsoft/TypeScript/tsc/internal/lint/host"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
)

type fileRuleSet struct {
	names      []string
	severities map[string]string
	options    map[string][]any
	custom     map[string]any
}

type pluginRun struct {
	host    Host
	options linthost.PluginOptions
}

func configuredRules(config *tsoptions.ParsedCommandLine) map[string]any {
	result := make(map[string]any, len(config.LintRules()))
	for name, severity := range config.LintRules() {
		if options := config.LintRuleOptions(name); len(options) != 0 {
			result[name] = append([]any{severity}, options...)
		} else {
			result[name] = severity
		}
	}
	return result
}

func prepareRuleSets(ctx context.Context, program *compiler.Program, files []*ast.SourceFile) ([]*fileRuleSet, *pluginRun, map[string]bool, []*ast.Diagnostic) {
	config := program.CommandLine()
	options := config.ParsedConfig.Lint
	sets := make([]*fileRuleSet, len(files))
	if !options.HasExternalCode() && (options == nil || len(options.Overrides) == 0 && len(options.Ignores) == 0) {
		set, diagnostics := prepareRuleSet(configuredRules(config), nil)
		unused := options != nil && options.ReportUnusedDisableDirectives != "" && options.ReportUnusedDisableDirectives != "off"
		if len(set.names) == 0 && !unused {
			return nil, nil, nil, diagnostics
		}
		for index := range sets {
			sets[index] = set
		}
		return sets, nil, nil, diagnostics
	}
	fail := func(err error) ([]*fileRuleSet, *pluginRun, map[string]bool, []*ast.Diagnostic) {
		return nil, nil, nil, []*ast.Diagnostic{ast.NewCompilerDiagnostic(diagnostics.Lint_plugin_failed_Colon_0, err.Error())}
	}
	var run *pluginRun
	var knownRules map[string]bool
	if options.HasExternalCode() {
		if !program.Options().RunExternalCode.IsTrue() {
			return nil, nil, nil, []*ast.Diagnostic{ast.NewCompilerDiagnostic(diagnostics.Lint_plugins_require_the_runExternalCode_command_line_flag_to_be_enabled)}
		}
		host := hostFromContext(ctx)
		if host == nil {
			return fail(errors.New("this compiler host does not support external lint plugins"))
		}
		resolveFrom := make(map[string]string)
		for name := range options.Plugins {
			if directory := options.PluginResolveFrom(name); directory != "" {
				resolveFrom[name] = directory.AsString()
			}
		}
		pluginOptions := linthost.PluginOptions{
			CurrentDirectory:  program.GetCurrentDirectory().AsString(),
			Plugins:           options.Plugins,
			PluginResolveFrom: resolveFrom,
		}
		names, err := host.InspectPlugins(ctx, pluginOptions)
		if err != nil {
			return fail(err)
		}
		knownRules = make(map[string]bool, len(names))
		for _, name := range names {
			if _, exists := rules.Factories[name]; exists {
				return fail(fmt.Errorf("plugin rule %q conflicts with a native rule", name))
			}
			knownRules[name] = true
		}
		run = &pluginRun{host: host, options: pluginOptions}
	}
	sets, result, err := planRuleSets(files, options.Overrides, options.Ignores, configuredRules(config), knownRules)
	if err != nil {
		return fail(err)
	}
	return sets, run, knownRules, result
}

func prepareRuleSet(values map[string]any, customRules map[string]bool) (*fileRuleSet, []*ast.Diagnostic) {
	set := &fileRuleSet{severities: make(map[string]string, len(values)), options: make(map[string][]any)}
	var result []*ast.Diagnostic
	for name, value := range values {
		var options []any
		if tuple, ok := value.([]any); ok {
			if len(tuple) == 0 {
				result = append(result, ast.NewCompilerDiagnostic(diagnostics.Invalid_lint_rule_options_for_0_Colon_1, name, "empty configuration"))
				continue
			}
			value, options = tuple[0], tuple[1:]
		}
		severity, valid := tsoptions.LintSeverity(value)
		if value == nil {
			severity, valid = "off", true
		}
		if !valid {
			result = append(result, ast.NewCompilerDiagnostic(diagnostics.Invalid_lint_rule_options_for_0_Colon_1, name, "invalid severity"))
			continue
		}
		set.severities[name] = severity
		if severity == "off" {
			continue
		}
		if _, native := rules.Factories[name]; native {
			if err := lintconfig.ValidateRuleOptions(name, options); err != nil {
				result = append(result, ast.NewCompilerDiagnostic(diagnostics.Invalid_lint_rule_options_for_0_Colon_1, name, err.Error()))
			} else {
				set.names = append(set.names, name)
				set.options[name] = options
			}
		} else if customRules[name] {
			if set.custom == nil {
				set.custom = make(map[string]any)
			}
			level := 2
			if severity == "warning" {
				level = 1
			}
			if len(options) != 0 {
				set.custom[name] = append([]any{level}, options...)
			} else {
				set.custom[name] = level
			}
		} else {
			result = append(result, ast.NewCompilerDiagnostic(diagnostics.Unknown_lint_rule_0, name))
		}
	}
	slices.Sort(set.names)
	return set, result
}

func externalDiagnostics(file *ast.SourceFile, set *fileRuleSet, messages []linthost.Message) ([]*ast.Diagnostic, error) {
	result := make([]*ast.Diagnostic, 0, len(messages))
	for _, message := range messages {
		if severity := set.severities[message.RuleID]; severity == "" || severity == "off" || message.RuleID == "" || message.Message == "" ||
			message.Severity != 1 && message.Severity != 2 {
			return nil, fmt.Errorf("invalid report from lint rule %q for %s", message.RuleID, file.FileName())
		}
		location, err := lintRange(file, message.Start, message.End)
		if err != nil {
			return nil, fmt.Errorf("invalid report from lint rule %q: %w", message.RuleID, err)
		}
		category := diagnostics.CategoryError
		if message.Severity == 1 {
			category = diagnostics.CategoryWarning
		}
		diagnostic := ast.NewLintDiagnostic(file, location, category, message.RuleID, message.MessageID, message.Message)
		if message.Fix != nil {
			fix, err := externalFix(file, message.RuleID, *message.Fix)
			if err != nil {
				return nil, err
			}
			diagnostic.SetCodeFixes(fix)
		}
		for _, suggestion := range message.Suggestions {
			fix, err := externalFix(file, message.RuleID, suggestion.Fix)
			if err != nil {
				return nil, err
			}
			fix.FixID = ""
			fix.FixAllDescription = nil
			fix.Description = ast.NewCompilerDiagnostic(diagnostics.NewAdHocMessage(suggestion.Description))
			diagnostic.SetCodeFixSuggestions(append(diagnostic.CodeFixSuggestions(), fix)...)
		}
		result = append(result, diagnostic)
	}
	return result, nil
}

func lintRange(file *ast.SourceFile, start, end int) (core.TextRange, error) {
	text := file.Text()
	positions := file.GetPositionMap()
	length := positions.UTF8ToUTF16(len(text))
	if start < 0 || end < start || end > length {
		return core.TextRange{}, fmt.Errorf("UTF-16 range [%d, %d) is outside %s", start, end, file.FileName())
	}
	first, last := positions.UTF16ToUTF8(start), positions.UTF16ToUTF8(end)
	if first > len(text) || last > len(text) || first < len(text) && !utf8.RuneStart(text[first]) || last < len(text) && !utf8.RuneStart(text[last]) {
		return core.TextRange{}, fmt.Errorf("UTF-16 range [%d, %d) splits a character in %s", start, end, file.FileName())
	}
	return core.NewTextRange(first, last), nil
}

func externalFix(file *ast.SourceFile, ruleID string, fix linthost.Fix) (*ast.CodeFixAction, error) {
	location, err := lintRange(file, fix.Range[0], fix.Range[1])
	if err != nil {
		return nil, fmt.Errorf("invalid fix from lint rule %q: %w", ruleID, err)
	}
	return &ast.CodeFixAction{
		Description:       ast.NewCompilerDiagnostic(diagnostics.Fix_0, ruleID),
		Changes:           []core.FileTextChanges{{FileName: file.FileName(), TextChanges: []core.TextChange{{TextRange: location, NewText: fix.Text}}}},
		FixName:           ruleID,
		FixID:             ruleID,
		FixAllDescription: ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, ruleID),
	}, nil
}
