package tsc

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"slices"
	"strings"
	"time"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/collections"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/execute/incremental"
	"github.com/microsoft/TypeScript/tsc/internal/json"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs"
)

type GenerationResult struct {
	Diagnostics []*ast.Diagnostic
	Executed    int
	Timings     GenerationTimings
	cache       *GenerationCache
	snapshots   []generationSnapshot
	plan        *tsoptions.GenerationPlan
}

type generationSnapshot struct {
	inputs         *collections.OrderedMap[string, string]
	outputs        *collections.OrderedMap[string, string]
	complete       bool
	inputsComplete bool
}

func (snapshot generationSnapshot) version() string {
	if !snapshot.complete {
		return ""
	}
	return incremental.ComputeHash(string(core.Must(json.Marshal(struct {
		Inputs  *collections.OrderedMap[string, string]
		Outputs *collections.OrderedMap[string, string]
	}{snapshot.inputs, snapshot.outputs}))), false)
}

type GenerationCache struct {
	versions *collections.OrderedMap[string, string]
}

func GenerationEnabled(options *core.CompilerOptions) bool {
	return options.Generate.IsTrue() || options.GenerateOnly.IsTrue()
}

func GenerationOutputFiles(fs vfs.FS, config *tsoptions.ParsedCommandLine) []tspath.RootedFilePath {
	return config.GenerationPlan().OutputFiles(fs)
}

func GenerationWatchDirectories(fs vfs.FS, config *tsoptions.ParsedCommandLine) []tspath.RootedDirectoryPath {
	if !GenerationEnabled(config.CompilerOptions()) {
		return nil
	}
	return config.GenerationPlan().WatchDirectories(fs)
}

func GenerationMatchesPath(fs vfs.FS, config *tsoptions.ParsedCommandLine, path tspath.RootedPath) bool {
	if !GenerationEnabled(config.CompilerOptions()) {
		return false
	}
	return config.GenerationPlan().MatchesChange(fs, path)
}

func generationKey(command tsoptions.GenerateCommand) string {
	data := core.Must(json.Marshal(struct {
		Command   tsoptions.GenerateCommand
		Directory tspath.RootedDirectoryPath
	}{command, command.Directory}))
	return incremental.ComputeHash(string(data), false)
}

func generationFileVersions(fs vfs.FS, patterns []tsoptions.GenerationPattern, requireMatches bool) (*collections.OrderedMap[string, string], bool) {
	versions := &collections.OrderedMap[string, string]{}
	complete := true
	for _, pattern := range patterns {
		files := pattern.Files(fs)
		if requireMatches && len(files) == 0 {
			complete = false
		}
		for _, file := range files {
			text, ok := fs.ReadFile(file)
			if !ok {
				complete = false
				continue
			}
			versions.Set(file.AsString(), incremental.ComputeHash(text, false))
		}
	}
	return versions, complete
}

func snapshotGeneration(fs vfs.FS, command tsoptions.GenerationCommandPlan) generationSnapshot {
	inputs, complete := generationFileVersions(fs, command.Inputs, false)
	for name := range inputs.Keys() {
		for _, pattern := range command.Outputs {
			if pattern.Matches(tspath.RootedPathFromAbsolute(name)) {
				inputs.Delete(name)
				break
			}
		}
	}
	outputs, outputsComplete := generationFileVersions(fs, command.Outputs, true)
	return generationSnapshot{inputs: inputs, outputs: outputs, inputsComplete: complete, complete: complete && outputsComplete}
}

func ValidateGenerationOutputs(fs vfs.FS, commands []tsoptions.GenerateCommand) []*ast.Diagnostic {
	return tsoptions.NewGenerationPlan(commands, fs.CaseSensitivity()).OutputDiagnostics(fs)
}

func Generate(ctx context.Context, sys System, config *tsoptions.ParsedCommandLine, writer io.Writer, cache *GenerationCache) GenerationResult {
	result := GenerationResult{cache: cache}
	if !GenerationEnabled(config.CompilerOptions()) {
		return result
	}
	if errors := config.GetConfigFileParsingDiagnostics(); len(errors) > 0 {
		result.Diagnostics = errors
		return result
	}
	if len(config.ParsedConfig.Generate) == 0 {
		return result
	}
	if !config.CompilerOptions().RunExternalCode.IsTrue() {
		result.Diagnostics = []*ast.Diagnostic{ast.NewCompilerDiagnostic(diagnostics.Code_generation_requires_the_runExternalCode_command_line_flag_to_be_enabled)}
		return result
	}
	fs := sys.FS()
	plan := config.GenerationPlan()
	result.Diagnostics = plan.OutputDiagnostics(fs)
	result.Diagnostics = append(result.Diagnostics, plan.DependencyDiagnostics(fs)...)
	if len(result.Diagnostics) > 0 {
		return result
	}
	versions := incremental.ReadGenerationVersions(fs, config.GetBuildInfoFileName())
	if cache != nil && cache.versions != nil {
		versions = cache.versions
	}
	type outcome struct {
		stdout   bytes.Buffer
		stderr   bytes.Buffer
		err      error
		duration time.Duration
		executed bool
	}
	outcomes := make([]outcome, len(config.ParsedConfig.Generate))
	stale := make([]bool, len(config.ParsedConfig.Generate))
	caching := config.GetBuildInfoFileName() != "" || cache != nil
	if caching {
		result.snapshots = make([]generationSnapshot, len(config.ParsedConfig.Generate))
	}
	for index, command := range plan.Commands {
		if !caching {
			stale[index] = true
			continue
		}
		result.snapshots[index] = snapshotGeneration(fs, command)
		version := result.snapshots[index].version()
		stale[index] = version == "" || versions.GetOrZero(generationKey(command.Spec)) != version
	}
	group := core.NewWorkGroup(config.CompilerOptions().SingleThreaded.IsTrue())
	for index, command := range config.ParsedConfig.Generate {
		if !stale[index] {
			continue
		}
		group.Queue(func() {
			output := &outcomes[index]
			output.executed = true
			start := sys.Now()
			defer func() { output.duration = sys.Now().Sub(start) }()
			if output.err = ctx.Err(); output.err != nil {
				return
			}
			output.err = sys.Run(ctx, generationArguments(command), command.Directory.AsString(), &output.stdout, &output.stderr)
		})
	}
	group.RunAndWait()
	if caching {
		for index, command := range plan.Commands {
			outputs, complete := generationFileVersions(fs, command.Outputs, true)
			result.snapshots[index].outputs = outputs
			result.snapshots[index].complete = result.snapshots[index].inputsComplete && complete
		}
	}
	for index := range outcomes {
		output := &outcomes[index]
		if !output.executed {
			continue
		}
		result.Executed++
		fmt.Fprint(writer, output.stdout.String())
		command := strings.Join(generationArguments(config.ParsedConfig.Generate[index]), " ")
		if output.err != nil || output.stderr.Len() > 0 {
			message := strings.TrimSpace(output.stderr.String())
			if output.err != nil {
				message = strings.TrimSpace(message + " " + output.err.Error())
			}
			result.Diagnostics = append(result.Diagnostics, ast.NewCompilerDiagnostic(diagnostics.Code_generation_command_0_failed_Colon_1, command, message))
		}
		result.Timings.Add(GenerationTimings{Commands: 1, ByCommand: map[string]time.Duration{command: output.duration}})
	}
	if len(result.Diagnostics) == 0 {
		result.plan = plan
	}
	return result
}

func (result *GenerationResult) Save(sys System, config *tsoptions.ParsedCommandLine, formattedChanges ...FormattingChange) {
	if result.plan == nil || len(result.plan.Commands) == 0 || config.GetBuildInfoFileName() == "" && result.cache == nil {
		return
	}
	if config.GetBuildInfoFileName() != "" {
		host := compiler.NewCompilerHost(sys.FS(), sys.DefaultLibraryPath(), nil, nil, nil)
		if diagnostic := validateBuildInfoWriteTarget(host, config, nil); diagnostic != nil {
			result.Diagnostics = append(result.Diagnostics, diagnostic)
			return
		}
		name := config.GetBuildInfoFileName()
		for _, command := range result.plan.Commands {
			for _, pattern := range slices.Concat(command.Inputs, command.Outputs) {
				if pattern.Matches(name.AsPath()) {
					result.Diagnostics = append(result.Diagnostics, ast.NewCompilerDiagnostic(diagnostics.Cannot_write_file_0_because_it_would_overwrite_input_file, name))
					return
				}
			}
		}
	}
	versions := &collections.OrderedMap[string, string]{}
	for index, command := range result.plan.Commands {
		snapshot := result.snapshots[index]
		for _, change := range formattedChanges {
			name := change.FileName.AsString()
			if snapshot.inputs.GetOrZero(name) == change.BeforeHash {
				snapshot.inputs.Set(name, change.AfterHash)
			}
			if snapshot.outputs.GetOrZero(name) == change.BeforeHash {
				snapshot.outputs.Set(name, change.AfterHash)
			}
		}
		versions.Set(generationKey(command.Spec), snapshot.version())
	}
	if result.cache != nil {
		result.cache.versions = versions
	}
	if err := incremental.SaveGenerationVersions(sys.FS(), config.GetBuildInfoFileName(), versions); err != nil {
		result.Diagnostics = append(result.Diagnostics, ast.NewCompilerDiagnostic(diagnostics.Could_not_write_file_0_Colon_1, config.GetBuildInfoFileName(), err.Error()))
	}
}

func generationArguments(step tsoptions.GenerateCommand) []string {
	var arguments []string
	for _, argument := range step.Command {
		if argument == "${inputs}" {
			arguments = append(arguments, step.Inputs...)
		} else {
			arguments = append(arguments, argument)
		}
	}
	return arguments
}
