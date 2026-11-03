package tsoptions_test

import (
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions/tsoptionstest"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"gotest.tools/v3/assert"
)

func TestFormattingSelection(t *testing.T) {
	t.Parallel()
	fs := tsoptionstest.NewVFSWithSymlinks(nil, nil, "/project", tspath.CaseSensitive)
	command := tsoptions.ParseCommandLine([]string{"--formatOnly", "input.ts:2-4"}, fs, "/project")
	assert.Equal(t, len(command.Errors), 0)
	selection := command.FormattingSelection()
	command.FileNames()[0] = "/project/changed.ts"
	command.FormattingRanges["/project/input.ts"][0].Start = 99
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{}, []tspath.RootedFilePath{"/project/other.ts"}, nil, "/project", tspath.CaseSensitive)
	for range 2 {
		applied := selection.Apply(config)
		assert.DeepEqual(t, applied.FileNames(), []tspath.RootedFilePath{"/project/input.ts"})
		assert.DeepEqual(t, applied.FormattingRanges["/project/input.ts"], []tsoptions.FormattingLineRange{{Start: 2, End: 4}})
		applied.FileNames()[0] = "/project/changed.ts"
		applied.FormattingRanges["/project/input.ts"][0].Start = 99
	}
	assert.DeepEqual(t, config.FileNames(), []tspath.RootedFilePath{"/project/other.ts"})
	assert.Assert(t, config.FormattingRanges == nil)
	project := tsoptions.ParseCommandLine([]string{"--formatOnly", "-p", "."}, fs, "/project")
	assert.DeepEqual(t, project.FormattingSelection().Apply(config).FileNames(), config.FileNames())
}

func TestFormattingOptionsInheritance(t *testing.T) {
	t.Parallel()
	fs := tsoptionstest.NewVFSWithSymlinks(map[string]string{
		"/project/first.json":    `{"formattingOptions":{"indentSize":2,"insertSpaceAfterCommaDelimiter":true}}`,
		"/project/second.json":   `{"formattingOptions":{"tabSize":8,"indentSize":6}}`,
		"/project/tsconfig.json": `{"extends":["./first.json","./second.json"],"files":["input.ts"],"formattingOptions":{"insertSpaceAfterCommaDelimiter":false,"baseIndentSize":0}}`,
		"/project/input.ts":      "const value=1;",
	}, nil, "/project", tspath.CaseSensitive)
	config, errors := tsoptions.GetParsedCommandLineOfConfigFilePath("/project/tsconfig.json", "/project/tsconfig.json", nil, nil, tsoptions.NewDefaultParseConfigHost(fs), nil)
	assert.Equal(t, len(errors), 0)
	assert.Equal(t, len(config.Errors), 0)
	assert.Equal(t, *config.FormattingOptions().IndentSize, 6)
	assert.Equal(t, *config.FormattingOptions().TabSize, 8)
	assert.Assert(t, config.FormattingOptions().InsertSpaceAfterCommaDelimiter.IsFalse())
	assert.Equal(t, *config.FormattingOptions().BaseIndentSize, 0)
}

func TestFormattingOptionsNullInheritance(t *testing.T) {
	t.Parallel()
	fs := tsoptionstest.NewVFSWithSymlinks(map[string]string{
		"/project/first.json":    `{"formattingOptions":{"indentSize":2,"insertSpaceAfterCommaDelimiter":false,"indentStyle":"none","newLineCharacter":"\r\n"}}`,
		"/project/reset.json":    `{"extends":"./first.json","formattingOptions":{"indentSize":null,"insertSpaceAfterCommaDelimiter":null}}`,
		"/project/second.json":   `{"formattingOptions":{"indentSize":6,"tabSize":8,"insertSpaceAfterCommaDelimiter":true}}`,
		"/project/tsconfig.json": `{"extends":["./second.json","./reset.json"],"files":["input.ts"]}`,
		"/project/input.ts":      "",
	}, nil, "/project", tspath.CaseSensitive)
	config, errors := tsoptions.GetParsedCommandLineOfConfigFilePath("/project/tsconfig.json", "/project/tsconfig.json", nil, nil, tsoptions.NewDefaultParseConfigHost(fs), nil)
	assert.Equal(t, len(errors), 0)
	assert.Equal(t, len(config.Errors), 0)
	options := config.FormattingOptions()
	assert.Assert(t, options.IndentSize == nil)
	assert.Equal(t, *options.TabSize, 8)
	assert.Equal(t, options.InsertSpaceAfterCommaDelimiter, core.TSUnknown)
	assert.Equal(t, *options.IndentStyle, core.FormattingIndentStyleNone)
	assert.Equal(t, *options.NewLineCharacter, "\r\n")
}

func TestFormattingOptionsJSONValidation(t *testing.T) {
	t.Parallel()
	fs := tsoptionstest.NewVFSWithSymlinks(map[string]string{"/project/input.ts": ""}, nil, "/project", tspath.CaseSensitive)
	for _, value := range []any{-1, 1.5, 1e100, "two"} {
		config := tsoptions.ParseJsonConfigFileContent(map[string]any{
			"files":             []string{"input.ts"},
			"formattingOptions": map[string]any{"indentSize": value},
		}, tsoptions.NewDefaultParseConfigHost(fs), "/project", nil, "/project/tsconfig.json", nil, nil)
		assert.Assert(t, len(config.Errors) > 0)
	}
	config := tsoptions.ParseJsonConfigFileContent(map[string]any{
		"files":             []string{"input.ts"},
		"formattingOptions": map[string]any{"indentSize": 0, "indentStyle": "none", "insertSpaceAfterCommaDelimiter": false},
	}, tsoptions.NewDefaultParseConfigHost(fs), "/project", nil, "/project/tsconfig.json", nil, nil)
	assert.Equal(t, len(config.Errors), 0)
	assert.Equal(t, *config.FormattingOptions().IndentSize, 0)
	assert.Equal(t, *config.FormattingOptions().IndentStyle, core.FormattingIndentStyleNone)
	assert.Assert(t, config.FormattingOptions().InsertSpaceAfterCommaDelimiter.IsFalse())
}

func TestFormattingCommandLineRanges(t *testing.T) {
	t.Parallel()
	fs := tsoptionstest.NewVFSWithSymlinks(nil, nil, "/project", tspath.CaseSensitive)
	for _, test := range []struct {
		name   string
		args   []string
		want   []tsoptions.FormattingLineRange
		errors int
	}{
		{"disjoint", []string{"--formatOnly", "file.ts:2-4,9-12"}, []tsoptions.FormattingLineRange{{Start: 2, End: 4}, {Start: 9, End: 12}}, 0},
		{"overlap", []string{"--formatOnly", "file.ts:4-8,2-6"}, []tsoptions.FormattingLineRange{{Start: 2, End: 8}}, 0},
		{"whole file dominates", []string{"--formatOnly", "file.ts:2-4", "file.ts"}, nil, 0},
		{"zero", []string{"--formatOnly", "file.ts:0-4"}, nil, 1},
		{"reversed", []string{"--formatOnly", "file.ts:4-2"}, nil, 1},
		{"malformed", []string{"--formatOnly", "file.ts:2-bad"}, nil, 1},
		{"requires format only", []string{"--format", "file.ts:2-4"}, nil, 1},
		{"diagnostics needs mode", []string{"--formatDiagnostics"}, nil, 1},
		{"watch rejects ranges", []string{"--formatOnly", "--watch", "file.ts:2-4"}, nil, 1},
		{"watch rejects ranges even with whole file duplicate", []string{"--formatOnly", "-w", "file.ts:2-4", "file.ts"}, nil, 1},
		{"dashed format only is not an alias", []string{"--format-only"}, nil, 1},
		{"dashed diagnostics is not an alias", []string{"--format-diagnostics"}, nil, 1},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			config := tsoptions.ParseCommandLine(test.args, fs, "/project")
			assert.Equal(t, len(config.Errors), test.errors)
			assert.DeepEqual(t, config.FormattingRanges["/project/file.ts"], test.want)
		})
	}
}
