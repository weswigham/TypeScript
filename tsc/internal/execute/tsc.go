package execute

import (
	"context"
	"fmt"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/collections"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/contentmapper"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/execute/build"
	"github.com/microsoft/TypeScript/tsc/internal/execute/incremental"
	"github.com/microsoft/TypeScript/tsc/internal/execute/tsc"
	"github.com/microsoft/TypeScript/tsc/internal/json"
	"github.com/microsoft/TypeScript/tsc/internal/locale"
	"github.com/microsoft/TypeScript/tsc/internal/pprof"
	"github.com/microsoft/TypeScript/tsc/internal/tracing"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
)

func startTracingIfNeeded(sys tsc.System, config *tsoptions.ParsedCommandLine, testing tsc.CommandLineTesting) *tracing.Tracing {
	traceDir := config.CompilerOptions().GenerateTrace
	if traceDir == "" {
		return nil
	}
	configFilePath := ""
	if config.ConfigFile != nil && config.ConfigFile.SourceFile != nil {
		configFilePath = config.ConfigFile.SourceFile.FileName().AsString()
	}
	tr, err := tracing.StartTracing(sys.FS(), traceDir, configFilePath, testing != nil)
	if err != nil {
		fmt.Fprintf(sys.Writer(), "Warning: Failed to start tracing: %v\n", err)
	}
	return tr
}

func stopTracing(sys tsc.System, tr *tracing.Tracing) {
	if tr == nil {
		return
	}
	if err := tr.StopTracing(); err != nil {
		fmt.Fprintf(sys.Writer(), "Warning: Failed to stop tracing: %v\n", err)
	}
}

func CommandLine(ctx context.Context, sys tsc.System, commandLineArgs []string, testing tsc.CommandLineTesting) tsc.CommandLineResult {
	for i := 0; i < len(commandLineArgs); i++ {
		switch strings.ToLower(commandLineArgs[i]) {
		case "-b", "--b", "-build", "--build":
			return tscBuildCompilation(ctx, sys, tsoptions.ParseBuildCommandLine(commandLineArgs, sys.FS(), sys.GetCurrentDirectory()), testing)
		case "--generate", "-generate", "--generateonly", "-generateonly", "--format", "-format", "--formatonly", "-formatonly", "--formatdiagnostics", "-formatdiagnostics", "--lint", "-lint", "--lintonly", "-lintonly", "--fix", "-fix":
			if i+1 < len(commandLineArgs) && (commandLineArgs[i+1] == "true" || commandLineArgs[i+1] == "false") {
				i++
			}
		default:
			return tscCompilation(ctx, sys, tsoptions.ParseCommandLine(commandLineArgs, sys.FS(), sys.GetCurrentDirectory()), testing)
		}
	}

	return tscCompilation(ctx, sys, tsoptions.ParseCommandLine(commandLineArgs, sys.FS(), sys.GetCurrentDirectory()), testing)
}

func tscBuildCompilation(ctx context.Context, sys tsc.System, buildCommand *tsoptions.ParsedBuildCommandLine, testing tsc.CommandLineTesting) tsc.CommandLineResult {
	locale := buildCommand.Locale()
	reportDiagnostic := tsc.CreateDiagnosticReporter(sys, sys.Writer(), locale, buildCommand.CompilerOptions)

	if len(buildCommand.Errors) > 0 {
		for _, err := range buildCommand.Errors {
			reportDiagnostic(err)
		}
		return tsc.CommandLineResult{Status: tsc.ExitStatusDiagnosticsPresent_OutputsSkipped}
	}

	if pprofDir := buildCommand.CompilerOptions.PprofDir; pprofDir != "" {
		// !!! stderr?
		profileSession := pprof.BeginProfiling(pprofDir.AsString(), sys.Writer())
		defer profileSession.Stop()
	}

	if buildCommand.CompilerOptions.Help.IsTrue() {
		tsc.PrintVersion(sys, locale)
		tsc.PrintBuildHelp(sys, locale, tsoptions.BuildOpts)
		return tsc.CommandLineResult{Status: tsc.ExitStatusSuccess}
	}

	orchestrator := build.NewOrchestrator(build.Options{
		Sys:     sys,
		Command: buildCommand,
		Testing: testing,
	})
	return orchestrator.Start(ctx)
}

func tscCompilation(ctx context.Context, sys tsc.System, commandLine *tsoptions.ParsedCommandLine, testing tsc.CommandLineTesting) tsc.CommandLineResult {
	var configFileName tspath.RootedFilePath
	locale := commandLine.Locale()
	reportDiagnostic := tsc.CreateDiagnosticReporter(sys, sys.Writer(), locale, commandLine.CompilerOptions())

	if len(commandLine.Errors) > 0 {
		for _, e := range commandLine.Errors {
			reportDiagnostic(e)
		}
		return tsc.CommandLineResult{Status: tsc.ExitStatusDiagnosticsPresent_OutputsSkipped}
	}

	if pprofDir := commandLine.CompilerOptions().PprofDir; pprofDir != "" {
		// !!! stderr?
		profileSession := pprof.BeginProfiling(pprofDir.AsString(), sys.Writer())
		defer profileSession.Stop()
	}

	if commandLine.CompilerOptions().Init.IsTrue() {
		tsc.WriteConfigFile(sys, locale, reportDiagnostic, commandLine.Raw.(*collections.OrderedMap[string, any]))
		return tsc.CommandLineResult{Status: tsc.ExitStatusSuccess}
	}

	if commandLine.CompilerOptions().Version.IsTrue() {
		tsc.PrintVersion(sys, locale)
		return tsc.CommandLineResult{Status: tsc.ExitStatusSuccess}
	}

	if commandLine.CompilerOptions().Help.IsTrue() || commandLine.CompilerOptions().All.IsTrue() {
		tsc.PrintHelp(sys, locale, commandLine)
		return tsc.CommandLineResult{Status: tsc.ExitStatusSuccess}
	}

	if commandLine.CompilerOptions().Watch.IsTrue() && commandLine.CompilerOptions().ListFilesOnly.IsTrue() {
		reportDiagnostic(ast.NewCompilerDiagnostic(diagnostics.Options_0_and_1_cannot_be_combined, "watch", "listFilesOnly"))
		return tsc.CommandLineResult{Status: tsc.ExitStatusDiagnosticsPresent_OutputsSkipped}
	}

	if commandLine.CompilerOptions().Project != "" {
		if len(commandLine.FileNames()) != 0 && !commandLine.CompilerOptions().FormatOnly.IsTrue() {
			reportDiagnostic(ast.NewCompilerDiagnostic(diagnostics.Option_project_cannot_be_mixed_with_source_files_on_a_command_line))
			return tsc.CommandLineResult{Status: tsc.ExitStatusDiagnosticsPresent_OutputsSkipped}
		}

		fileOrDirectory := commandLine.CompilerOptions().Project
		directory := tspath.RootedDirectoryPathFromPath(fileOrDirectory)
		if sys.FS().DirectoryExists(directory) {
			configFileName = directory.ResolveFile("tsconfig.json")
			if !sys.FS().FileExists(configFileName) {
				reportDiagnostic(ast.NewCompilerDiagnostic(diagnostics.Cannot_find_a_tsconfig_json_file_at_the_current_directory_Colon_0, configFileName))
				return tsc.CommandLineResult{Status: tsc.ExitStatusDiagnosticsPresent_OutputsSkipped}
			}
		} else {
			configFileName = tspath.RootedFilePathFromPath(fileOrDirectory)
			if !sys.FS().FileExists(configFileName) {
				reportDiagnostic(ast.NewCompilerDiagnostic(diagnostics.The_specified_path_does_not_exist_Colon_0, fileOrDirectory))
				return tsc.CommandLineResult{Status: tsc.ExitStatusDiagnosticsPresent_OutputsSkipped}
			}
		}
	} else if !commandLine.CompilerOptions().IgnoreConfig.IsTrue() || len(commandLine.FileNames()) == 0 {
		foundConfigFileName := findConfigFile(sys.GetCurrentDirectory(), sys.FS().FileExists, "tsconfig.json")
		if foundConfigFileName != "" {
			configFileName = foundConfigFileName
		}
		if len(commandLine.FileNames()) != 0 {
			if configFileName != "" && !commandLine.CompilerOptions().FormatOnly.IsTrue() {
				// Error to not specify config file
				reportDiagnostic(ast.NewCompilerDiagnostic(diagnostics.X_tsconfig_json_is_present_but_will_not_be_loaded_if_files_are_specified_on_commandline_Use_ignoreConfig_to_skip_this_error))
				return tsc.CommandLineResult{Status: tsc.ExitStatusDiagnosticsPresent_OutputsSkipped}
			}
		} else if configFileName == "" {
			if commandLine.CompilerOptions().ShowConfig.IsTrue() {
				reportDiagnostic(ast.NewCompilerDiagnostic(diagnostics.Cannot_find_a_tsconfig_json_file_at_the_current_directory_Colon_0, sys.GetCurrentDirectory().AsString()))
			} else {
				tsc.PrintVersion(sys, locale)
				tsc.PrintHelp(sys, locale, commandLine)
			}
			return tsc.CommandLineResult{Status: tsc.ExitStatusDiagnosticsPresent_OutputsSkipped}
		}
	}

	// !!! convert to options with absolute paths is usually done here, but for ease of implementation, it's done in `tsoptions.ParseCommandLine()`
	compilerOptionsFromCommandLine := commandLine.CompilerOptions()
	formattingSelection := commandLine.FormattingSelection()
	configForCompilation := commandLine
	extendedConfigCache := &tsc.ExtendedConfigCache{}
	var compileTimes tsc.CompileTimes
	var commandLineRaw *collections.OrderedMap[string, any]
	if configFileName != "" {
		configStart := sys.Now()
		if raw, ok := commandLine.Raw.(*collections.OrderedMap[string, any]); ok {
			// Wrap command line options in a "compilerOptions" key to match tsconfig.json structure
			wrapped := &collections.OrderedMap[string, any]{}
			wrapped.Set("compilerOptions", raw)
			commandLineRaw = wrapped
		}
		path := sys.FS().CaseSensitivity().PathKey(tspath.RootedPath(configFileName))
		configParseResult, errors := tsoptions.GetParsedCommandLineOfConfigFilePath(configFileName, path, compilerOptionsFromCommandLine, commandLineRaw, tsoptions.NewDefaultParseConfigHost(sys.FS()), extendedConfigCache)
		compileTimes.ConfigTime = sys.Now().Sub(configStart)
		if len(errors) != 0 {
			// these are unrecoverable errors--exit to report them as diagnostics
			for _, e := range errors {
				reportDiagnostic(e)
			}
			return tsc.CommandLineResult{Status: tsc.ExitStatusDiagnosticsPresent_OutputsGenerated}
		}
		configForCompilation = formattingSelection.Apply(configParseResult)
		// Updater to reflect pretty
		reportDiagnostic = tsc.CreateDiagnosticReporter(sys, sys.Writer(), locale, commandLine.CompilerOptions())
	}

	reportErrorSummary := tsc.CreateReportErrorSummary(sys, locale, configForCompilation.CompilerOptions())
	if compilerOptionsFromCommandLine.ShowConfig.IsTrue() {
		showConfig(sys, configForCompilation, configFileName)
		return tsc.CommandLineResult{Status: tsc.ExitStatusSuccess}
	}
	if configForCompilation.CompilerOptions().Watch.IsTrue() {
		watcher := createWatcher(
			sys,
			configForCompilation,
			compilerOptionsFromCommandLine,
			commandLineRaw,
			reportDiagnostic,
			reportErrorSummary,
			testing,
		)
		watcher.formattingSelection = formattingSelection
		watcher.start(ctx)
		return tsc.CommandLineResult{Status: tsc.ExitStatusSuccess, Watcher: watcher}
	}
	preBuild := tsc.RunPreBuildStages(ctx, tsc.PreBuildInput{
		Sys: sys, Config: configForCompilation, Writer: sys.Writer(), SelectFiles: formattingSelection.Apply,
		Format: func(ctx context.Context, config *tsoptions.ParsedCommandLine) (tsc.FormatResult, *ast.Diagnostic) {
			return formatInputFiles(ctx, sys, config, extendedConfigCache, testing), nil
		},
	})
	configForCompilation = preBuild.Config
	compileTimes.GenerationTimes = preBuild.Generation.Timings
	formatResult := preBuild.Formatting
	if preBuild.Status != tsc.PreBuildContinue {
		if configForCompilation.CompilerOptions().ExtendedDiagnostics.IsTrue() {
			tsc.ReportGenerationStatistics(sys.Writer(), preBuild.Generation.Timings, testing)
		}
		for _, diagnostic := range compiler.SortAndDeduplicateDiagnostics(preBuild.Diagnostics) {
			reportDiagnostic(diagnostic)
		}
		reportErrorSummary(preBuild.Diagnostics)
		status := tsc.ExitStatusSuccess
		if preBuild.Status == tsc.PreBuildFailed {
			status = tsc.ExitStatusDiagnosticsPresent_OutputsSkipped
		}
		return tsc.CommandLineResult{Status: status}
	}
	if configForCompilation.CompilerOptions().IsIncremental() {
		return performIncrementalCompilation(
			ctx,
			sys,
			configForCompilation,
			reportDiagnostic,
			reportErrorSummary,
			extendedConfigCache,
			&compileTimes,
			testing,
			formatResult,
		)
	}
	return performCompilation(
		ctx,
		sys,
		configForCompilation,
		reportDiagnostic,
		reportErrorSummary,
		extendedConfigCache,
		&compileTimes,
		testing,
		formatResult,
	)
}

func formatInputFiles(ctx context.Context, sys tsc.System, config *tsoptions.ParsedCommandLine, extendedConfigCache tsoptions.ExtendedConfigCache, testing tsc.CommandLineTesting) tsc.FormatResult {
	if !tsc.FormattingEnabled(config.CompilerOptions()) {
		return tsc.FormatResult{}
	}
	contentMapperHost := tsc.NewContentMapperHost(ctx, sys, config.CompilerOptions())
	contentMapperProject := getContentMapperProject(contentMapperHost, config)
	if contentMapperProject != nil {
		defer contentMapperProject.Close()
	}
	host := compiler.NewCompilerHost(sys.FS(), sys.DefaultLibraryPath(), extendedConfigCache, getTraceFromSys(sys, config.Locale(), testing), contentMapperProject)
	return tsc.FormatInputFiles(ctx, host, config)
}

func findConfigFile(searchPath tspath.RootedDirectoryPath, fileExists func(tspath.RootedFilePath) bool, configName string) tspath.RootedFilePath {
	result, ok := searchPath.ForEachAncestorDirectory(func(ancestor tspath.RootedDirectoryPath) (tspath.RootedFilePath, bool) {
		fullConfigName := ancestor.ResolveFile(configName)
		if fileExists(fullConfigName) {
			return fullConfigName, true
		}
		return fullConfigName, false
	})
	if !ok {
		return ""
	}
	return result
}

func getTraceFromSys(sys tsc.System, locale locale.Locale, testing tsc.CommandLineTesting) func(msg *diagnostics.Message, args ...any) {
	return tsc.GetTraceWithWriterFromSys(sys.Writer(), locale, testing)
}

func performIncrementalCompilation(
	ctx context.Context,
	sys tsc.System,
	config *tsoptions.ParsedCommandLine,
	reportDiagnostic tsc.DiagnosticReporter,
	reportErrorSummary tsc.DiagnosticsReporter,
	extendedConfigCache tsoptions.ExtendedConfigCache,
	compileTimes *tsc.CompileTimes,
	testing tsc.CommandLineTesting,
	formatting tsc.FormatResult,
) tsc.CommandLineResult {
	contentMapperHost := tsc.NewContentMapperHost(ctx, sys, config.CompilerOptions())
	contentMapperProject := getContentMapperProject(contentMapperHost, config)
	if contentMapperProject != nil {
		defer contentMapperProject.Close()
	}
	host := compiler.NewCachedFSCompilerHost(
		sys.FS(),
		sys.DefaultLibraryPath(),
		extendedConfigCache,
		getTraceFromSys(sys, config.Locale(), testing),
		contentMapperProject,
	)
	host = tsc.WithFormattingSourceFiles(host, formatting.SourceFiles)
	buildInfoReadStart := sys.Now()
	oldProgram := incremental.ReadBuildInfoProgram(config, incremental.NewBuildInfoReader(host), host)
	compileTimes.BuildInfoReadTime = sys.Now().Sub(buildInfoReadStart)

	tr := startTracingIfNeeded(sys, config, testing)

	parseStart := sys.Now()
	program := compiler.NewProgram(compiler.ProgramOptions{
		Config:  config,
		Host:    host,
		Tracing: tr,
	})
	compileTimes.ParseTime = sys.Now().Sub(parseStart)
	changesComputeStart := sys.Now()
	incrementalProgram := incremental.NewProgram(program, oldProgram, incremental.CreateHost(host), sys.Now, testing != nil)
	compileTimes.ChangesComputeTime = sys.Now().Sub(changesComputeStart)
	if contentMapperHost != nil {
		compileTimes.ContentMapperTimes = contentMapperHost.Timings()
	}
	result, _ := tsc.EmitAndReportStatistics(tsc.EmitInput{
		Sys:                   sys,
		ProgramLike:           incrementalProgram,
		Program:               incrementalProgram.GetProgram(),
		Config:                config,
		ReportDiagnostic:      reportDiagnostic,
		ReportErrorSummary:    reportErrorSummary,
		Writer:                sys.Writer(),
		CompileTimes:          compileTimes,
		Testing:               testing,
		Tracing:               tr,
		FormattingDiagnostics: formatting.Diagnostics,
	})

	stopTracing(sys, tr)

	if testing != nil {
		updated, _ := result.Program.(*incremental.Program)
		testing.OnProgram(updated)
	}
	return tsc.CommandLineResult{
		Status: result.Status,
	}
}

func performCompilation(
	ctx context.Context,
	sys tsc.System,
	config *tsoptions.ParsedCommandLine,
	reportDiagnostic tsc.DiagnosticReporter,
	reportErrorSummary tsc.DiagnosticsReporter,
	extendedConfigCache tsoptions.ExtendedConfigCache,
	compileTimes *tsc.CompileTimes,
	testing tsc.CommandLineTesting,
	formatting tsc.FormatResult,
) tsc.CommandLineResult {
	contentMapperHost := tsc.NewContentMapperHost(ctx, sys, config.CompilerOptions())
	contentMapperProject := getContentMapperProject(contentMapperHost, config)
	if contentMapperProject != nil {
		defer contentMapperProject.Close()
	}
	host := compiler.NewCachedFSCompilerHost(
		sys.FS(),
		sys.DefaultLibraryPath(),
		extendedConfigCache,
		getTraceFromSys(sys, config.Locale(), testing),
		contentMapperProject,
	)
	host = tsc.WithFormattingSourceFiles(host, formatting.SourceFiles)

	tr := startTracingIfNeeded(sys, config, testing)

	parseStart := sys.Now()
	program := compiler.NewProgram(compiler.ProgramOptions{
		Config:  config,
		Host:    host,
		Tracing: tr,
	})
	compileTimes.ParseTime = sys.Now().Sub(parseStart)
	if contentMapperHost != nil {
		compileTimes.ContentMapperTimes = contentMapperHost.Timings()
	}
	result, _ := tsc.EmitAndReportStatistics(tsc.EmitInput{
		Sys:                   sys,
		ProgramLike:           program,
		Program:               program,
		Config:                config,
		ReportDiagnostic:      reportDiagnostic,
		ReportErrorSummary:    reportErrorSummary,
		Writer:                sys.Writer(),
		CompileTimes:          compileTimes,
		Testing:               testing,
		Tracing:               tr,
		FormattingDiagnostics: formatting.Diagnostics,
	})

	stopTracing(sys, tr)

	return tsc.CommandLineResult{
		Status: result.Status,
	}
}

func getContentMapperProject(host contentmapper.Host, config *tsoptions.ParsedCommandLine) contentmapper.Project {
	if host == nil || len(config.ContentMappers()) == 0 {
		return nil
	}
	return host.Project(contentmapper.ProjectSpec{
		ConfigFileName:  config.ConfigName(),
		Mappers:         config.ContentMappers(),
		CompilerOptions: config.CompilerOptions(),
	})
}

func showConfig(sys tsc.System, config *tsoptions.ParsedCommandLine, configFileName tspath.RootedFilePath) {
	tsConfig := tsoptions.ConvertToTSConfig(config, configFileName)
	_ = json.MarshalIndentWrite(sys.Writer(), tsConfig, "", "    ")
}
