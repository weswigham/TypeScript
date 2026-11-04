package tsoptions_test

import (
	"strings"
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/collections"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/json"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions/tsoptionstest"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs"
	"github.com/microsoft/TypeScript/tsc/internal/vfs/vfstest"
	"gotest.tools/v3/assert"
)

func TestGenerateConfig(t *testing.T) {
	t.Parallel()
	fs := tsoptionstest.NewVFSWithSymlinks(map[string]string{
		"/project/base/tsconfig.json": `{"generate":[{"inputs":["*.json"],"outputs":["generated.ts"],"command":["node","generate.js","${inputs}"]}]}`,
		"/project/tsconfig.json":      `{"extends":"./base/tsconfig.json","files":[]}`,
	}, nil, "/project", tspath.CaseSensitive)
	options := &core.CompilerOptions{GenerateOnly: core.TSTrue}
	config, errors := tsoptions.GetParsedCommandLineOfConfigFilePath("/project/tsconfig.json", "/project/tsconfig.json", options, nil, tsoptions.NewDefaultParseConfigHost(fs), nil)
	assert.Equal(t, len(errors), 0)
	assert.Equal(t, len(config.Errors), 0)
	assert.Equal(t, len(config.ParsedConfig.Generate), 1)
	assert.Equal(t, config.ParsedConfig.Generate[0].Directory, tspath.RootedDirectoryPath("/project/base"))
	for _, value := range []any{true, []any{true}, []any{map[string]any{"inputs": []string{"x"}, "outputs": []string{"y"}, "command": []string{"node", "--input=${inputs}"}}}} {
		config := tsoptions.ParseJsonConfigFileContent(map[string]any{"generate": value, "files": []string{}}, tsoptions.NewDefaultParseConfigHost(fs), "/project", options, "/project/tsconfig.json", nil, nil)
		assert.Assert(t, len(config.Errors) > 0)
	}
	for _, flag := range []string{"--generate", "--generateOnly"} {
		command := tsoptions.ParseCommandLine([]string{flag, "--runExternalCode"}, fs, "/project")
		assert.Equal(t, len(command.Errors), 0)
	}
}

func TestGenerateShowConfigRoundTrip(t *testing.T) {
	t.Parallel()
	fs := tsoptionstest.NewVFSWithSymlinks(map[string]string{
		"/project/base/tsconfig.json": `{"generate":[{"inputs":["input.json"],"outputs":["generated.ts"],"command":["node","./scripts/generate.js","${inputs}"]}]}`,
		"/project/tsconfig.json":      `{"extends":"./base/tsconfig.json","files":["main.ts"]}`,
		"/project/main.ts":            "export {};",
	}, nil, "/project", tspath.CaseSensitive)
	config, errors := tsoptions.GetParsedCommandLineOfConfigFilePath("/project/tsconfig.json", "/project/tsconfig.json", nil, nil, tsoptions.NewDefaultParseConfigHost(fs), nil)
	assert.Equal(t, len(errors), 0)
	assert.Equal(t, len(config.Errors), 0)
	for _, target := range []tspath.RootedFilePath{"/project/flat.json", "/project/nested/flat.json"} {
		serialized, err := json.Marshal(tsoptions.ConvertToTSConfig(config, target))
		assert.NilError(t, err)
		var object map[string]any
		assert.NilError(t, json.Unmarshal(serialized, &object))
		flat := tsoptions.ParseJsonConfigFileContent(object, tsoptions.NewDefaultParseConfigHost(fs), target.Directory(), nil, target, nil, nil)
		assert.Equal(t, len(flat.Errors), 0)
		assert.DeepEqual(t, flat.ParsedConfig.Generate, config.ParsedConfig.Generate)
	}
	for _, cwd := range []any{false, "", nil} {
		invalid := tsoptions.ParseJsonConfigFileContent(map[string]any{
			"files":    []string{"main.ts"},
			"generate": []any{map[string]any{"inputs": []string{"input.json"}, "outputs": []string{"generated.ts"}, "command": []string{"copy", "input.json", "generated.ts"}, "cwd": cwd}},
		}, tsoptions.NewDefaultParseConfigHost(fs), "/project", nil, "/project/tsconfig.json", nil, nil)
		assert.Assert(t, len(invalid.Errors) > 0)
	}
}

func TestGenerateConfigInheritance(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		name      string
		config    string
		input     string
		directory tspath.RootedDirectoryPath
	}{
		{"parent", `{"extends":"./base/first.json","files":["main.ts"]}`, "first.ts", "/project/base"},
		{"transitive", `{"extends":"./base/middle.json","files":["main.ts"]}`, "first.ts", "/project/base"},
		{"last parent wins", `{"extends":["./base/first.json","./base/second.json"],"files":["main.ts"]}`, "second.ts", "/project/base"},
		{"omitted later parent", `{"extends":["./base/first.json","./base/none.json"],"files":["main.ts"]}`, "first.ts", "/project/base"},
		{"child replaces block", `{"extends":"./base/first.json","files":["main.ts"],"generate":[{"inputs":["own.ts"],"outputs":["own.out.ts"],"command":["copy","${inputs}","own.out.ts"]}]}`, "own.ts", "/project"},
		{"empty child overrides", `{"extends":"./base/first.json","files":["main.ts"],"generate":[]}`, "", ""},
		{"empty parent overrides", `{"extends":["./base/first.json","./base/empty.json"],"files":["main.ts"]}`, "", ""},
		{"null child overrides", `{"extends":"./base/first.json","files":["main.ts"],"generate":null}`, "", ""},
		{"null parent overrides", `{"extends":["./base/first.json","./base/reset.json"],"files":["main.ts"]}`, "", ""},
		{"transitive null overrides", `{"extends":["./base/first.json","./base/middleReset.json"],"files":["main.ts"]}`, "", ""},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			fs := tsoptionstest.NewVFSWithSymlinks(map[string]string{
				"/project/base/first.json":       `{"generate":[{"inputs":["first.ts"],"outputs":["first.out.ts"],"command":["copy","${inputs}","first.out.ts"]}]}`,
				"/project/base/second.json":      `{"generate":[{"inputs":["second.ts"],"outputs":["second.out.ts"],"command":["copy","${inputs}","second.out.ts"]}]}`,
				"/project/base/middle.json":      `{"extends":"./first.json"}`,
				"/project/base/none.json":        `{}`,
				"/project/base/empty.json":       `{"generate":[]}`,
				"/project/base/reset.json":       `{"generate":null}`,
				"/project/base/middleReset.json": `{"extends":"./reset.json"}`,
				"/project/tsconfig.json":         test.config,
				"/project/main.ts":               "export {};",
			}, nil, "/project", tspath.CaseSensitive)
			config, errors := tsoptions.GetParsedCommandLineOfConfigFilePath("/project/tsconfig.json", "/project/tsconfig.json", nil, nil, tsoptions.NewDefaultParseConfigHost(fs), nil)
			assert.Equal(t, len(errors), 0)
			assert.Equal(t, len(config.Errors), 0)
			raw := config.Raw.(*collections.OrderedMap[string, any])
			assert.Assert(t, raw.Has("generate"))
			var object map[string]any
			assert.NilError(t, json.Unmarshal([]byte(test.config), &object))
			fromObject := tsoptions.ParseJsonConfigFileContent(object, tsoptions.NewDefaultParseConfigHost(fs), "/project", nil, "/project/tsconfig.json", nil, nil)
			assert.Equal(t, len(fromObject.Errors), 0)
			assert.DeepEqual(t, fromObject.ParsedConfig.Generate, config.ParsedConfig.Generate)
			assert.Assert(t, fromObject.Raw.(*collections.OrderedMap[string, any]).Has("generate"))
			if test.input == "" {
				assert.Equal(t, len(config.ParsedConfig.Generate), 0)
			} else {
				assert.Equal(t, len(config.ParsedConfig.Generate), 1)
				command := config.ParsedConfig.Generate[0]
				assert.DeepEqual(t, command.Inputs, []string{test.input})
				output := strings.TrimSuffix(test.input, ".ts") + ".out.ts"
				assert.DeepEqual(t, command.Outputs, []string{output})
				assert.DeepEqual(t, command.Command, []string{"copy", "${inputs}", output})
				assert.Equal(t, command.Directory, test.directory)
			}
		})
	}
}

type generationPlanFS struct {
	vfs.FS
	visited []tspath.RootedDirectoryPath
}

func (fs *generationPlanFS) GetAccessibleEntries(path tspath.RootedDirectoryPath) vfs.Entries {
	fs.visited = append(fs.visited, path)
	return fs.FS.GetAccessibleEntries(path)
}

func TestGenerationPlan(t *testing.T) {
	t.Parallel()
	fs := &generationPlanFS{FS: vfstest.FromMap(map[string]any{
		"/project/generated/value.ts":          "export {};",
		"/project/generated/nested/ignored.ts": "export {};",
	}, tspath.CaseSensitive)}
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{}, nil, nil, "/project", tspath.CaseSensitive)
	config.ParsedConfig.Generate = []tsoptions.GenerateCommand{{Directory: "/project", Inputs: []string{"input.json"}, Outputs: []string{"generated/*.ts"}}}
	plan := config.GenerationPlan()
	assert.Assert(t, plan == config.GenerationPlan())
	assert.Assert(t, plan == config.WithFileNames([]tspath.RootedFilePath{"/project/generated/value.ts"}).GenerationPlan())
	assert.DeepEqual(t, plan.OutputFiles(fs), []tspath.RootedFilePath{"/project/generated/value.ts"})
	assert.DeepEqual(t, fs.visited, []tspath.RootedDirectoryPath{"/project/generated"})
}
