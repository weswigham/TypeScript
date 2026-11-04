package tsoptions_test

import (
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/collections"
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
