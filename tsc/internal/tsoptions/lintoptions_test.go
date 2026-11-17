package tsoptions_test

import (
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/collections"
	"github.com/microsoft/TypeScript/tsc/internal/json"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions/tsoptionstest"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"gotest.tools/v3/assert"
)

func TestLintOptionsInheritance(t *testing.T) {
	t.Parallel()
	fs := tsoptionstest.NewVFSWithSymlinks(map[string]string{
		"/project/base.json":     `{"lint":{"rules":{"no-debugger":"error"}}}`,
		"/project/empty.json":    `{"lint":{"rules":{}}}`,
		"/project/tsconfig.json": `{"extends":["./base.json","./empty.json"],"files":["input.ts"]}`,
		"/project/input.ts":      "debugger;",
	}, nil, "/project", tspath.CaseSensitive)
	config, errors := tsoptions.GetParsedCommandLineOfConfigFilePath("/project/tsconfig.json", "/project/tsconfig.json", nil, nil, tsoptions.NewDefaultParseConfigHost(fs), nil)
	assert.Equal(t, len(errors), 0)
	assert.Equal(t, len(config.Errors), 0)
	assert.Equal(t, config.LintRules()["no-debugger"], "error")
}

func TestLintOptionsOverrides(t *testing.T) {
	t.Parallel()
	for _, value := range []string{`"off"`, `null`, `"warning"`} {
		t.Run(value, func(t *testing.T) {
			t.Parallel()
			fs := tsoptionstest.NewVFSWithSymlinks(map[string]string{
				"/project/base.json":     `{"lint":{"rules":{"no-debugger":"error"}}}`,
				"/project/tsconfig.json": `{"extends":"./base.json","files":["input.ts"],"lint":{"rules":{"no-debugger":` + value + `}}}`,
				"/project/input.ts":      "",
			}, nil, "/project", tspath.CaseSensitive)
			config, errors := tsoptions.GetParsedCommandLineOfConfigFilePath("/project/tsconfig.json", "/project/tsconfig.json", nil, nil, tsoptions.NewDefaultParseConfigHost(fs), nil)
			assert.Equal(t, len(errors), 0)
			assert.Equal(t, len(config.Errors), 0)
			severity := "off"
			if value == `"warning"` {
				severity = "warning"
			}
			assert.Equal(t, config.LintRules()["no-debugger"], severity)
			assert.Equal(t, tsoptions.ConvertToTSConfig(config, "").Lint.Rules["no-debugger"], severity)
		})
	}
}

func TestLintOptionsTupleInheritance(t *testing.T) {
	t.Parallel()
	inherited := []any{map[string]any{"allow": []any{"warn"}, "nested": map[string]any{"enabled": true}}}
	for _, test := range []struct {
		value    string
		severity string
		options  []any
	}{
		{`"warning"`, "warning", inherited},
		{`["warning"]`, "warning", inherited},
		{`"warn"`, "warning", inherited},
		{`1`, "warning", inherited},
		{`[2]`, "error", inherited},
		{`"off"`, "off", inherited},
		{`null`, "off", inherited},
		{`["warn",{"replacement":true}]`, "warning", []any{map[string]any{"replacement": true}}},
		{`["error",{}]`, "error", []any{map[string]any{}}},
		{`["error",null]`, "error", []any{nil}},
		{`["error","always",false,2,[{"limit":3}]]`, "error", []any{"always", false, float64(2), []any{map[string]any{"limit": float64(3)}}}},
	} {
		t.Run(test.value, func(t *testing.T) {
			t.Parallel()
			fs := tsoptionstest.NewVFSWithSymlinks(map[string]string{
				"/project/base.json":     `{"lint":{"rules":{"configured":["error",{"allow":["warn"],"nested":{"enabled":true}}],"untouched":["error","always"]}}}`,
				"/project/tsconfig.json": `{"extends":"./base.json","files":["input.ts"],"lint":{"rules":{"configured":` + test.value + `}}}`,
				"/project/input.ts":      "",
			}, nil, "/project", tspath.CaseSensitive)
			config, errors := tsoptions.GetParsedCommandLineOfConfigFilePath("/project/tsconfig.json", "/project/tsconfig.json", nil, nil, tsoptions.NewDefaultParseConfigHost(fs), nil)
			assert.Equal(t, len(errors), 0)
			assert.Equal(t, len(config.Errors), 0)
			assert.Equal(t, config.LintRules()["configured"], test.severity)
			assert.DeepEqual(t, config.LintRuleOptions("configured"), test.options)
			assert.DeepEqual(t, config.LintRuleOptions("untouched"), []any{"always"})
			assert.Assert(t, config.LintRuleOptions("missing") == nil)

			serialized, err := json.Marshal(tsoptions.ConvertToTSConfig(config, ""))
			assert.NilError(t, err)
			var shown map[string]any
			assert.NilError(t, json.Unmarshal(serialized, &shown))
			shownRules := shown["lint"].(map[string]any)["rules"].(map[string]any)
			assert.DeepEqual(t, shownRules["configured"], append([]any{test.severity}, test.options...))
			roundTrip := tsoptions.ParseJsonConfigFileContent(shown, tsoptions.NewDefaultParseConfigHost(fs), "/project", nil, "/project/tsconfig.json", nil, nil)
			assert.Equal(t, len(roundTrip.Errors), 0)
			assert.Assert(t, config.ParsedConfig.Lint.Equals(roundTrip.ParsedConfig.Lint))
		})
	}
}

func TestLintOptionsTupleValues(t *testing.T) {
	t.Parallel()
	fs := tsoptionstest.NewVFSWithSymlinks(map[string]string{"/project/input.ts": ""}, nil, "/project", tspath.CaseSensitive)
	for _, value := range []any{
		map[string]any{"rule": []any{"error", map[string]any{"nested": []any{map[string]any{"count": float64(2)}}}, nil}},
		map[string]any{"rule": []any{1, "always"}},
		map[string]any{"rule": float64(0)},
		map[string]any{"rule": 2},
		map[string]any{"rule": "warn"},
	} {
		config := tsoptions.ParseJsonConfigFileContent(map[string]any{"files": []string{"input.ts"}, "lint": map[string]any{"rules": value}}, tsoptions.NewDefaultParseConfigHost(fs), "/project", nil, "/project/tsconfig.json", nil, nil)
		assert.Equal(t, len(config.Errors), 0)
		if tuple, ok := value.(map[string]any)["rule"].([]any); ok {
			assert.DeepEqual(t, config.LintRuleOptions("rule"), tuple[1:])
		} else {
			assert.Assert(t, config.LintRuleOptions("rule") == nil)
		}
	}
	for _, lint := range []any{nil, map[string]any{}, map[string]any{"rules": nil}} {
		config := tsoptions.ParseJsonConfigFileContent(map[string]any{"files": []string{"input.ts"}, "lint": lint}, tsoptions.NewDefaultParseConfigHost(fs), "/project", nil, "/project/tsconfig.json", nil, nil)
		assert.Equal(t, len(config.Errors), 0)
		assert.Assert(t, config.LintRuleOptions("missing") == nil)
	}
}

func TestLintTupleNullPositions(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		value   string
		valid   bool
		options []any
	}{
		{`[null]`, false, nil},
		{`[null,"error"]`, false, nil},
		{`["error",null]`, true, []any{nil}},
		{`["error",[null,{"values":[null,2,null]},null],null]`, true, []any{[]any{nil, map[string]any{"values": []any{nil, float64(2), nil}}, nil}, nil}},
		{`["error",[]]`, true, []any{[]any{}}},
	} {
		t.Run(test.value, func(t *testing.T) {
			t.Parallel()
			text := `{"files":["input.ts"],"lint":{"rules":{"configured":` + test.value + `}}}`
			fs := tsoptionstest.NewVFSWithSymlinks(map[string]string{
				"/project/tsconfig.json": text,
				"/project/input.ts":      "",
			}, nil, "/project", tspath.CaseSensitive)
			host := tsoptions.NewDefaultParseConfigHost(fs)
			fromFile, errors := tsoptions.GetParsedCommandLineOfConfigFilePath("/project/tsconfig.json", "/project/tsconfig.json", nil, nil, host, nil)
			assert.Equal(t, len(errors), 0)
			value, errors := tsoptions.ParseConfigFileTextToJson("/project/tsconfig.json", "/project/tsconfig.json", text)
			assert.Equal(t, len(errors), 0)
			fromJSON := tsoptions.ParseJsonConfigFileContent(value, host, "/project", nil, "/project/tsconfig.json", nil, nil)
			for _, config := range []*tsoptions.ParsedCommandLine{fromFile, fromJSON} {
				assert.Equal(t, len(config.Errors) == 0, test.valid)
				assert.DeepEqual(t, config.LintRuleOptions("configured"), test.options)
			}
		})
	}
}

func TestLintTupleMergeAcrossBases(t *testing.T) {
	t.Parallel()
	fs := tsoptionstest.NewVFSWithSymlinks(map[string]string{
		"/project/base.json":     `{"lint":{"rules":{"retained":["error",{"base":true}],"replaced":["error",{"base":true}]}}}`,
		"/project/later.json":    `{"extends":"./base.json","lint":{"rules":{"retained":null,"replaced":["warning",{"later":true}]}}}`,
		"/project/empty.json":    `{"lint":{"rules":{}}}`,
		"/project/tsconfig.json": `{"extends":["./base.json","./later.json","./empty.json"],"lint":{"rules":{"retained":["error"]}},"files":["input.ts"]}`,
		"/project/input.ts":      "",
	}, nil, "/project", tspath.CaseSensitive)
	config, errors := tsoptions.GetParsedCommandLineOfConfigFilePath("/project/tsconfig.json", "/project/tsconfig.json", nil, nil, tsoptions.NewDefaultParseConfigHost(fs), nil)
	assert.Equal(t, len(errors), 0)
	assert.Equal(t, len(config.Errors), 0)
	assert.DeepEqual(t, config.LintRules(), map[string]string{"retained": "error", "replaced": "warning"})
	assert.DeepEqual(t, config.LintRuleOptions("retained"), []any{map[string]any{"base": true}})
	assert.DeepEqual(t, config.LintRuleOptions("replaced"), []any{map[string]any{"later": true}})
}

func TestLintOptionsValidation(t *testing.T) {
	t.Parallel()
	fs := tsoptionstest.NewVFSWithSymlinks(map[string]string{"/project/input.ts": ""}, nil, "/project", tspath.CaseSensitive)
	for _, value := range []any{
		false,
		[]any{},
		map[string]any{"unknown": true},
		map[string]any{"rules": []any{}},
		map[string]any{"rules": map[string]any{"no-debugger": true}},
		map[string]any{"rules": map[string]any{"no-debugger": "invalid"}},
		map[string]any{"rules": map[string]any{"no-debugger": map[string]any{}}},
		map[string]any{"rules": map[string]any{"no-debugger": float64(3)}},
		map[string]any{"rules": map[string]any{"no-debugger": float64(-1)}},
		map[string]any{"rules": map[string]any{"no-debugger": 1.5}},
		map[string]any{"rules": map[string]any{"no-debugger": []any{}}},
		map[string]any{"rules": map[string]any{"no-debugger": []any{nil}}},
		map[string]any{"rules": map[string]any{"no-debugger": []any{true}}},
		map[string]any{"rules": map[string]any{"no-debugger": []any{"invalid", map[string]any{}}}},
		map[string]any{"rules": map[string]any{"no-debugger": []any{float64(3)}}},
	} {
		config := tsoptions.ParseJsonConfigFileContent(map[string]any{"files": []string{"input.ts"}, "lint": value}, tsoptions.NewDefaultParseConfigHost(fs), "/project", nil, "/project/tsconfig.json", nil, nil)
		assert.Assert(t, len(config.Errors) > 0)
	}
}

func TestLintRuleMerge(t *testing.T) {
	t.Parallel()
	fs := tsoptionstest.NewVFSWithSymlinks(map[string]string{
		"/project/base.json":     `{"lint":{"rules":{"first":"error","second":"warning"}}}`,
		"/project/later.json":    `{"lint":{"rules":{"first":"off","third":"error"}}}`,
		"/project/tsconfig.json": `{"extends":["./base.json","./later.json"],"lint":{"rules":{"third":null}},"files":["input.ts"]}`,
		"/project/input.ts":      "",
	}, nil, "/project", tspath.CaseSensitive)
	config, errors := tsoptions.GetParsedCommandLineOfConfigFilePath("/project/tsconfig.json", "/project/tsconfig.json", nil, nil, tsoptions.NewDefaultParseConfigHost(fs), nil)
	assert.Equal(t, len(errors), 0)
	assert.Equal(t, len(config.Errors), 0)
	assert.DeepEqual(t, config.LintRules(), map[string]string{"first": "off", "second": "warning", "third": "off"})
	assert.Assert(t, config.Raw.(*collections.OrderedMap[string, any]).Has("lint"))
}

func TestLintFixOptions(t *testing.T) {
	t.Parallel()
	fs := tsoptionstest.NewVFSWithSymlinks(nil, nil, "/project", tspath.CaseSensitive)
	for _, test := range []struct {
		args  []string
		valid bool
	}{
		{[]string{"--fix"}, false},
		{[]string{"--fix", "false"}, true},
		{[]string{"--fix", "--lint"}, true},
		{[]string{"--lintOnly", "--fix"}, true},
		{[]string{"--lint", "false", "--fix"}, false},
		{[]string{"--lintOnly", "false", "--fix"}, false},
		{[]string{"--format", "--fix"}, false},
		{[]string{"--generate", "--fix"}, false},
		{[]string{"--lint", "--fix", "--watch"}, true},
	} {
		command := tsoptions.ParseCommandLine(test.args, fs, "/project")
		assert.Equal(t, len(command.Errors) == 0, test.valid, "flags: %v", test.args)
		build := tsoptions.ParseBuildCommandLine(append([]string{"-b"}, test.args...), fs, "/project")
		assert.Equal(t, len(build.Errors) == 0, test.valid, "build flags: %v", test.args)
	}
}
