package tsc

import (
	"context"
	"fmt"
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/collections"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/execute/incremental"
	"github.com/microsoft/TypeScript/tsc/internal/format"
	"github.com/microsoft/TypeScript/tsc/internal/json"
	"github.com/microsoft/TypeScript/tsc/internal/ls/lsutil"
	"github.com/microsoft/TypeScript/tsc/internal/module"
	"github.com/microsoft/TypeScript/tsc/internal/parser"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs"
)

type FormatResult struct {
	Diagnostics  []*ast.Diagnostic
	ChangedFiles []tspath.RootedFilePath
	Changes      []FormattingChange
	InputFiles   []tspath.RootedFilePath
	// SourceFiles contains parsed files whose on-disk text is unchanged and can be reused by compilation.
	SourceFiles []*ast.SourceFile
}

type FormattingChange struct {
	FileName   tspath.RootedFilePath
	BeforeHash string
	AfterHash  string
}

type formattingInput struct {
	name tspath.RootedFilePath
	file *ast.SourceFile
}

type formattingResolutionHost struct {
	compiler.CompilerHost
	directory tspath.RootedDirectoryPath
}

func (host *formattingResolutionHost) GetCurrentDirectory() tspath.RootedDirectoryPath {
	return host.directory
}

type formattingOutcome uint8

const (
	formattingFailed formattingOutcome = iota
	formattingCached
	formattingNeedsChanges
	formattingWholeFile
	formattingRange
)

type formattedInput struct {
	file        *ast.SourceFile
	key         string
	text        string
	formatted   string
	version     string
	diagnostics []*ast.Diagnostic
	outcome     formattingOutcome
}

func (input formattedInput) canWrite() bool {
	return input.outcome == formattingWholeFile || input.outcome == formattingRange
}

func FormattingEnabled(options *core.CompilerOptions) bool {
	return options.Format.IsTrue() || options.FormatOnly.IsTrue()
}

// FormatInputFiles runs before compilation so emit and source maps observe the written text.
func FormatInputFiles(ctx context.Context, host compiler.CompilerHost, config *tsoptions.ParsedCommandLine) FormatResult {
	var result FormatResult
	if !FormattingEnabled(config.CompilerOptions()) {
		return result
	}
	result.InputFiles = config.FileNames()
	if errors := config.GetConfigFileParsingDiagnostics(); len(errors) > 0 {
		result.Diagnostics = errors
		return result
	}
	if len(config.FileNames()) == 0 {
		return result
	}
	fs := host.FS()
	inputs, parsed := formattingInputs(host, config)
	result.InputFiles = core.Map(inputs, func(input formattingInput) tspath.RootedFilePath { return input.name })
	if len(inputs) == 0 {
		return result
	}
	if diagnostic := validateBuildInfoWriteTarget(host, config, parsed); diagnostic != nil {
		result.Diagnostics = []*ast.Diagnostic{diagnostic}
		return result
	}
	options := lsutil.GetDefaultFormatCodeSettings().WithOptions(config.FormattingOptions())
	ctx = format.WithFormatCodeSettings(ctx, options, options.NewLineCharacter)
	optionText, err := json.Marshal(options)
	if err != nil {
		panic(fmt.Sprintf("Failed to marshal formatting options: %v", err))
	}
	optionHash := incremental.ComputeHash(string(optionText), false)
	buildInfoName := config.GetBuildInfoFileName()
	state := incremental.ReadFormattingState(fs, buildInfoName, optionHash)
	versions := state.FileVersions()
	formatted := planFormattingInputs(ctx, host, config, inputs, versions)
	result = applyFormattingInputs(fs, inputs, parsed, formatted, versions)
	if err := state.Save(); err != nil {
		result.Diagnostics = append(result.Diagnostics, ast.NewCompilerDiagnostic(diagnostics.Could_not_write_file_0_Colon_1, buildInfoName, err.Error()))
	}
	return result
}

func validateBuildInfoWriteTarget(host compiler.CompilerHost, config *tsoptions.ParsedCommandLine, parsed []*ast.SourceFile) *ast.Diagnostic {
	name := config.GetBuildInfoFileName()
	if name == "" {
		return nil
	}
	path := host.FS().CaseSensitivity().PathKey(name.AsPath())
	matches := func(file tspath.RootedFilePath) bool {
		return file != "" && host.FS().CaseSensitivity().PathKey(file.AsPath()) == path
	}
	isInput := matches(config.ConfigFileName()) || slices.ContainsFunc(config.FileNames(), matches) ||
		slices.ContainsFunc(config.ExtendedSourceFiles(), matches) ||
		slices.ContainsFunc(parsed, func(file *ast.SourceFile) bool { return file.PathKey() == path })
	if !isInput && parsed == nil && core.GetScriptKindFromFileName(name) != core.ScriptKindUnknown {
		program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: host})
		isInput = program.GetSourceFile(name) != nil
	}
	if isInput {
		return ast.NewCompilerDiagnostic(diagnostics.Cannot_write_file_0_because_it_would_overwrite_input_file, name)
	}
	return nil
}

func planFormattingInputs(ctx context.Context, host compiler.CompilerHost, config *tsoptions.ParsedCommandLine, inputs []formattingInput, versions *collections.OrderedMap[string, string]) []formattedInput {
	formatted := make([]formattedInput, len(inputs))
	resolutionHost := &formattingResolutionHost{CompilerHost: host, directory: config.BaseDirectory()}
	resolutionData := module.NewResolver(module.ResolverOptions{
		Host:            resolutionHost,
		CompilerOptions: config.CompilerOptions(),
	}).GetResolutionData()
	group := core.NewWorkGroup(config.CompilerOptions().SingleThreaded.IsTrue())
	for i, input := range inputs {
		group.Queue(func() {
			formatted[i] = formatInput(ctx, host.FS(), config, input, versions, config.GetBuildInfoFileName(), resolutionData.NewResolver(resolutionHost))
		})
	}
	group.RunAndWait()
	return formatted
}

func applyFormattingInputs(fs vfs.FS, inputs []formattingInput, parsed []*ast.SourceFile, formatted []formattedInput, versions *collections.OrderedMap[string, string]) FormatResult {
	result := FormatResult{InputFiles: core.Map(inputs, func(input formattingInput) tspath.RootedFilePath { return input.name })}
	for i, output := range formatted {
		if output.file != nil && (!output.canWrite() || output.formatted == output.text) {
			result.SourceFiles = append(result.SourceFiles, output.file)
		}
		result.Diagnostics = append(result.Diagnostics, output.diagnostics...)
		if output.outcome == formattingNeedsChanges || output.outcome == formattingRange {
			versions.Delete(output.key)
		}
		if !output.canWrite() {
			continue
		}
		if output.formatted != output.text {
			if err := fs.WriteFile(inputs[i].name, output.formatted); err != nil {
				result.Diagnostics = append(result.Diagnostics, ast.NewCompilerDiagnostic(diagnostics.Could_not_write_file_0_Colon_1, inputs[i].name, err.Error()))
				continue
			}
			result.ChangedFiles = append(result.ChangedFiles, inputs[i].name)
			result.Changes = append(result.Changes, FormattingChange{
				FileName:   inputs[i].name,
				BeforeHash: incremental.ComputeHash(output.text, false),
				AfterHash:  incremental.ComputeHash(output.formatted, false),
			})
		}
		if output.version != "" {
			versions.Set(output.key, output.version)
		}
	}
	var retained, changed collections.Set[tspath.PathKey]
	for _, file := range result.SourceFiles {
		retained.Add(file.PathKey())
	}
	for _, name := range result.ChangedFiles {
		changed.Add(fs.CaseSensitivity().PathKey(name.AsPath()))
	}
	for _, output := range formatted {
		if output.file != nil && output.canWrite() && output.formatted != output.text {
			changed.Add(output.file.PathKey())
		}
	}
	for _, file := range parsed {
		if !retained.Has(file.PathKey()) && !changed.Has(file.PathKey()) && file.ContentMapper() == "" {
			result.SourceFiles = append(result.SourceFiles, file)
			retained.Add(file.PathKey())
		}
	}
	return result
}

func formattingInputs(host compiler.CompilerHost, config *tsoptions.ParsedCommandLine) ([]formattingInput, []*ast.SourceFile) {
	var program *compiler.Program
	if !config.CompilerOptions().Composite.IsTrue() {
		program = compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: host})
	}
	var inputs []formattingInput
	var seen collections.Set[tspath.PathKey]
	add := func(name tspath.RootedFilePath, file *ast.SourceFile) {
		path := host.FS().CaseSensitivity().PathKey(name.AsPath())
		if file != nil {
			path = file.PathKey()
		}
		if seen.Has(path) {
			return
		}
		seen.Add(path)
		if program != nil && (file != nil && !program.IsFormattingInput(file) ||
			file == nil && name.ContainsLowercaseDirectorySequence("/node_modules/")) {
			return
		}
		if file != nil && file.ContentMapper() != "" {
			file = nil
		}
		inputs = append(inputs, formattingInput{name: name, file: file})
	}
	for _, name := range config.FileNames() {
		var file *ast.SourceFile
		if program != nil {
			file = program.GetSourceFile(name)
		}
		add(name, file)
	}
	if program != nil {
		for _, file := range program.GetSourceFiles() {
			add(file.FileName(), file)
		}
	}
	if program != nil {
		return inputs, program.GetSourceFiles()
	}
	return inputs, nil
}

func formatInput(ctx context.Context, fs vfs.FS, config *tsoptions.ParsedCommandLine, input formattingInput, versions *collections.OrderedMap[string, string], buildInfoName tspath.RootedFilePath, resolver *module.DefaultResolver) formattedInput {
	result := formattedInput{key: input.name.AsString()}
	if buildInfoName != "" {
		result.key = tspath.ConvertToRelativePath(input.name.AsString(), buildInfoName.Directory(), fs.CaseSensitivity())
	}
	file := input.file
	result.file = file
	if file != nil {
		result.text = file.Text()
	} else {
		var ok bool
		result.text, ok = fs.ReadFile(input.name)
		if !ok {
			result.diagnostics = []*ast.Diagnostic{ast.NewCompilerDiagnostic(diagnostics.File_0_not_found, input.name)}
			return result
		}
	}
	path := fs.CaseSensitivity().PathKey(input.name.AsPath())
	ranges := config.FormattingRanges[path]
	kind := core.GetScriptKindFromFileName(input.name)
	if kind == core.ScriptKindUnknown {
		result.diagnostics = []*ast.Diagnostic{ast.NewCompilerDiagnostic(diagnostics.File_0_has_an_unsupported_extension_The_only_supported_extensions_are_1, input.name, ".ts, .tsx, .mts, .cts, .js, .jsx, .mjs, .cjs, .json")}
		return result
	}
	var parseOptions ast.SourceFileParseOptions
	if file == nil {
		metadata := compiler.GetSourceFileMetaDataFromPackageScope(input.name, config.CompilerOptions(), resolver.GetPackageScopeForPath(input.name.Directory()))
		parseOptions = ast.SourceFileParseOptions{
			FileName:                       input.name,
			PathKey:                        path,
			ExternalModuleIndicatorOptions: ast.GetExternalModuleIndicatorOptions(input.name, config.CompilerOptions(), metadata),
		}
	} else {
		parseOptions = file.ParseOptions()
	}
	version := formattingVersion(result.text, parseOptions, kind)
	if len(ranges) == 0 && buildInfoName != "" && versions.GetOrZero(result.key) == version {
		result.outcome = formattingCached
		return result
	}
	if file == nil {
		file = parser.ParseSourceFile(parseOptions, result.text, kind)
		result.file = file
	}
	edits, formatDiagnostics, errors := formattingEdits(ctx, file, ranges, config.CompilerOptions().FormatDiagnostics.IsTrue())
	if len(errors) != 0 {
		result.diagnostics = errors
		return result
	}
	if config.CompilerOptions().FormatDiagnostics.IsTrue() && len(edits) > 0 {
		result.outcome = formattingNeedsChanges
		result.diagnostics = formatDiagnostics
		return result
	}
	result.formatted = core.ApplyBulkEdits(result.text, edits)
	if len(ranges) == 0 {
		result.outcome = formattingWholeFile
		result.version = formattingVersion(result.formatted, parseOptions, kind)
	} else {
		result.outcome = formattingRange
	}
	return result
}

func formattingVersion(text string, options ast.SourceFileParseOptions, kind core.ScriptKind) string {
	data, err := json.Marshal(struct {
		ContentHash string
		Options     ast.SourceFileParseOptions
		ScriptKind  core.ScriptKind
	}{incremental.ComputeHash(text, false), options, kind})
	if err != nil {
		panic(fmt.Sprintf("Failed to marshal formatting input version: %v", err))
	}
	return incremental.ComputeHash(string(data), false)
}

func formattingEdits(ctx context.Context, file *ast.SourceFile, ranges []tsoptions.FormattingLineRange, reportDiagnostics bool) ([]core.TextChange, []*ast.Diagnostic, []*ast.Diagnostic) {
	lines := file.ECMALineMap()
	var spans []core.TextRange
	var errors []*ast.Diagnostic
	for _, r := range ranges {
		if r.End > len(lines) {
			errors = append(errors, ast.NewCompilerDiagnostic(diagnostics.Formatting_line_range_0_is_outside_file_1, fmt.Sprintf("%d-%d", r.Start, r.End), file.FileName()))
			continue
		}
		start := int(lines[r.Start-1])
		end := len(file.Text())
		if r.End < len(lines) {
			end = int(lines[r.End])
		}
		spans = append(spans, core.NewTextRange(start, end))
	}
	if len(errors) > 0 {
		return nil, nil, errors
	}
	var edits []core.TextChange
	var formatDiagnostics []*ast.Diagnostic
	var err error
	if reportDiagnostics {
		edits, formatDiagnostics, err = format.FormatRangesWithDiagnostics(ctx, file, spans)
	} else {
		edits, err = format.FormatRanges(ctx, file, spans)
	}
	if err != nil {
		panic(fmt.Sprintf("Invalid formatting line spans: %v", err))
	}
	return edits, formatDiagnostics, nil
}
