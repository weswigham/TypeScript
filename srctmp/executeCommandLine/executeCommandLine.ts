import * as ts from "./ts";
interface Statistic {
    name: string;
    value: string;
}
function countLines(program: ts.Program): number {
    let count = 0;
    ts.forEach(program.getSourceFiles(), file => {
        count += ts.getLineStarts(file).length;
    });
    return count;
}
function updateReportDiagnostic(sys: ts.System, existing: ts.DiagnosticReporter, options: ts.CompilerOptions | ts.BuildOptions): ts.DiagnosticReporter {
    return shouldBePretty(sys, options) ?
        ts.createDiagnosticReporter(sys, /*pretty*/ true) :
        existing;
}
function defaultIsPretty(sys: ts.System) {
    return !!sys.writeOutputIsTTY && sys.writeOutputIsTTY();
}
function shouldBePretty(sys: ts.System, options: ts.CompilerOptions | ts.BuildOptions) {
    if (!options || typeof options.pretty === "undefined") {
        return defaultIsPretty(sys);
    }
    return options.pretty;
}
function padLeft(s: string, length: number) {
    while (s.length < length) {
        s = " " + s;
    }
    return s;
}
function padRight(s: string, length: number) {
    while (s.length < length) {
        s = s + " ";
    }
    return s;
}
function getOptionsForHelp(commandLine: ts.ParsedCommandLine) {
    // Sort our options by their names, (e.g. "--noImplicitAny" comes before "--watch")
    return !!commandLine.options.all ?
        ts.sort(ts.optionDeclarations, (a, b) => ts.compareStringsCaseInsensitive(a.name, b.name)) :
        ts.filter(ts.optionDeclarations.slice(), v => !!v.showInSimplifiedHelpView);
}
function printVersion(sys: ts.System) {
    sys.write(ts.getDiagnosticText(ts.Diagnostics.Version_0, ts.version) + sys.newLine);
}
function printHelp(sys: ts.System, optionsList: readonly ts.CommandLineOption[], syntaxPrefix = "") {
    const output: string[] = [];
    // We want to align our "syntax" and "examples" commands to a certain margin.
    const syntaxLength = ts.getDiagnosticText(ts.Diagnostics.Syntax_Colon_0, "").length;
    const examplesLength = ts.getDiagnosticText(ts.Diagnostics.Examples_Colon_0, "").length;
    let marginLength = Math.max(syntaxLength, examplesLength);
    // Build up the syntactic skeleton.
    let syntax = makePadding(marginLength - syntaxLength);
    syntax += `tsc ${syntaxPrefix}[${ts.getDiagnosticText(ts.Diagnostics.options)}] [${ts.getDiagnosticText(ts.Diagnostics.file)}...]`;
    output.push(ts.getDiagnosticText(ts.Diagnostics.Syntax_Colon_0, syntax));
    output.push(sys.newLine + sys.newLine);
    // Build up the list of examples.
    const padding = makePadding(marginLength);
    output.push(ts.getDiagnosticText(ts.Diagnostics.Examples_Colon_0, makePadding(marginLength - examplesLength) + "tsc hello.ts") + sys.newLine);
    output.push(padding + "tsc --outFile file.js file.ts" + sys.newLine);
    output.push(padding + "tsc @args.txt" + sys.newLine);
    output.push(padding + "tsc --build tsconfig.json" + sys.newLine);
    output.push(sys.newLine);
    output.push(ts.getDiagnosticText(ts.Diagnostics.Options_Colon) + sys.newLine);
    // We want our descriptions to align at the same column in our output,
    // so we keep track of the longest option usage string.
    marginLength = 0;
    const usageColumn: string[] = []; // Things like "-d, --declaration" go in here.
    const descriptionColumn: string[] = [];
    const optionsDescriptionMap = ts.createMap<string[]>(); // Map between option.description and list of option.type if it is a kind
    for (const option of optionsList) {
        // If an option lacks a description,
        // it is not officially supported.
        if (!option.description) {
            continue;
        }
        let usageText = " ";
        if (option.shortName) {
            usageText += "-" + option.shortName;
            usageText += getParamType(option);
            usageText += ", ";
        }
        usageText += "--" + option.name;
        usageText += getParamType(option);
        usageColumn.push(usageText);
        let description: string;
        if (option.name === "lib") {
            description = ts.getDiagnosticText(option.description);
            const element = (<ts.CommandLineOptionOfListType>option).element;
            const typeMap = (<ts.Map<number | string>>element.type);
            optionsDescriptionMap.set(description, ts.arrayFrom(typeMap.keys()).map(key => `'${key}'`));
        }
        else {
            description = ts.getDiagnosticText(option.description);
        }
        descriptionColumn.push(description);
        // Set the new margin for the description column if necessary.
        marginLength = Math.max(usageText.length, marginLength);
    }
    // Special case that can't fit in the loop.
    const usageText = " @<" + ts.getDiagnosticText(ts.Diagnostics.file) + ">";
    usageColumn.push(usageText);
    descriptionColumn.push(ts.getDiagnosticText(ts.Diagnostics.Insert_command_line_options_and_files_from_a_file));
    marginLength = Math.max(usageText.length, marginLength);
    // Print out each row, aligning all the descriptions on the same column.
    for (let i = 0; i < usageColumn.length; i++) {
        const usage = usageColumn[i];
        const description = descriptionColumn[i];
        const kindsList = optionsDescriptionMap.get(description);
        output.push(usage + makePadding(marginLength - usage.length + 2) + description + sys.newLine);
        if (kindsList) {
            output.push(makePadding(marginLength + 4));
            for (const kind of kindsList) {
                output.push(kind + " ");
            }
            output.push(sys.newLine);
        }
    }
    for (const line of output) {
        sys.write(line);
    }
    return;
    function getParamType(option: ts.CommandLineOption) {
        if (option.paramType !== undefined) {
            return " " + ts.getDiagnosticText(option.paramType);
        }
        return "";
    }
    function makePadding(paddingLength: number): string {
        return Array(paddingLength + 1).join(" ");
    }
}
function executeCommandLineWorker(sys: ts.System, cb: ExecuteCommandLineCallbacks | undefined, commandLine: ts.ParsedCommandLine) {
    let reportDiagnostic = ts.createDiagnosticReporter(sys);
    if (commandLine.options.build) {
        reportDiagnostic(ts.createCompilerDiagnostic(ts.Diagnostics.Option_build_must_be_the_first_command_line_argument));
        return sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
    }
    // Configuration file name (if any)
    let configFileName: string | undefined;
    if (commandLine.options.locale) {
        ts.validateLocaleAndSetLanguage(commandLine.options.locale, sys, commandLine.errors);
    }
    // If there are any errors due to command line parsing and/or
    // setting up localization, report them and quit.
    if (commandLine.errors.length > 0) {
        commandLine.errors.forEach(reportDiagnostic);
        return sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
    }
    if (commandLine.options.init) {
        writeConfigFile(sys, reportDiagnostic, commandLine.options, commandLine.fileNames);
        return sys.exit(ts.ExitStatus.Success);
    }
    if (commandLine.options.version) {
        printVersion(sys);
        return sys.exit(ts.ExitStatus.Success);
    }
    if (commandLine.options.help || commandLine.options.all) {
        printVersion(sys);
        printHelp(sys, getOptionsForHelp(commandLine));
        return sys.exit(ts.ExitStatus.Success);
    }
    if (commandLine.options.watch && commandLine.options.listFilesOnly) {
        reportDiagnostic(ts.createCompilerDiagnostic(ts.Diagnostics.Options_0_and_1_cannot_be_combined, "watch", "listFilesOnly"));
        return sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
    }
    if (commandLine.options.project) {
        if (commandLine.fileNames.length !== 0) {
            reportDiagnostic(ts.createCompilerDiagnostic(ts.Diagnostics.Option_project_cannot_be_mixed_with_source_files_on_a_command_line));
            return sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
        }
        const fileOrDirectory = ts.normalizePath(commandLine.options.project);
        if (!fileOrDirectory /* current directory "." */ || sys.directoryExists(fileOrDirectory)) {
            configFileName = ts.combinePaths(fileOrDirectory, "tsconfig.json");
            if (!sys.fileExists(configFileName)) {
                reportDiagnostic(ts.createCompilerDiagnostic(ts.Diagnostics.Cannot_find_a_tsconfig_json_file_at_the_specified_directory_Colon_0, commandLine.options.project));
                return sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
            }
        }
        else {
            configFileName = fileOrDirectory;
            if (!sys.fileExists(configFileName)) {
                reportDiagnostic(ts.createCompilerDiagnostic(ts.Diagnostics.The_specified_path_does_not_exist_Colon_0, commandLine.options.project));
                return sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
            }
        }
    }
    else if (commandLine.fileNames.length === 0) {
        const searchPath = ts.normalizePath(sys.getCurrentDirectory());
        configFileName = ts.findConfigFile(searchPath, sys.fileExists);
    }
    if (commandLine.fileNames.length === 0 && !configFileName) {
        printVersion(sys);
        printHelp(sys, getOptionsForHelp(commandLine));
        return sys.exit(ts.ExitStatus.Success);
    }
    const currentDirectory = sys.getCurrentDirectory();
    const commandLineOptions = ts.convertToOptionsWithAbsolutePaths(commandLine.options, fileName => ts.getNormalizedAbsolutePath(fileName, currentDirectory));
    if (configFileName) {
        const configParseResult = (ts.parseConfigFileWithSystem(configFileName, commandLineOptions, commandLine.watchOptions, sys, reportDiagnostic)!); // TODO: GH#18217
        if (commandLineOptions.showConfig) {
            if (configParseResult.errors.length !== 0) {
                reportDiagnostic = updateReportDiagnostic(sys, reportDiagnostic, configParseResult.options);
                configParseResult.errors.forEach(reportDiagnostic);
                return sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
            }
            // eslint-disable-next-line no-null/no-null
            sys.write(JSON.stringify(ts.convertToTSConfig(configParseResult, configFileName, sys), null, 4) + sys.newLine);
            return sys.exit(ts.ExitStatus.Success);
        }
        reportDiagnostic = updateReportDiagnostic(sys, reportDiagnostic, configParseResult.options);
        if (ts.isWatchSet(configParseResult.options)) {
            if (reportWatchModeWithoutSysSupport(sys, reportDiagnostic))
                return;
            createWatchOfConfigFile(sys, reportDiagnostic, configParseResult, commandLineOptions, commandLine.watchOptions);
        }
        else if (ts.isIncrementalCompilation(configParseResult.options)) {
            performIncrementalCompilation(sys, reportDiagnostic, cb, configParseResult);
        }
        else {
            performCompilation(sys, reportDiagnostic, cb, configParseResult);
        }
    }
    else {
        if (commandLineOptions.showConfig) {
            // eslint-disable-next-line no-null/no-null
            sys.write(JSON.stringify(ts.convertToTSConfig(commandLine, ts.combinePaths(currentDirectory, "tsconfig.json"), sys), null, 4) + sys.newLine);
            return sys.exit(ts.ExitStatus.Success);
        }
        reportDiagnostic = updateReportDiagnostic(sys, reportDiagnostic, commandLineOptions);
        if (ts.isWatchSet(commandLineOptions)) {
            if (reportWatchModeWithoutSysSupport(sys, reportDiagnostic))
                return;
            createWatchOfFilesAndCompilerOptions(sys, reportDiagnostic, commandLine.fileNames, commandLineOptions, commandLine.watchOptions);
        }
        else if (ts.isIncrementalCompilation(commandLineOptions)) {
            performIncrementalCompilation(sys, reportDiagnostic, cb, { ...commandLine, options: commandLineOptions });
        }
        else {
            performCompilation(sys, reportDiagnostic, cb, { ...commandLine, options: commandLineOptions });
        }
    }
}
export function isBuild(commandLineArgs: readonly string[]) {
    if (commandLineArgs.length > 0 && commandLineArgs[0].charCodeAt(0) === ts.CharacterCodes.minus) {
        const firstOption = commandLineArgs[0].slice(commandLineArgs[0].charCodeAt(1) === ts.CharacterCodes.minus ? 2 : 1).toLowerCase();
        return firstOption === "build" || firstOption === "b";
    }
    return false;
}
export interface ExecuteCommandLineCallbacks {
    onCompilerHostCreate: (host: ts.CompilerHost) => void;
    onCompilationComplete: (config: ts.ParsedCommandLine) => void;
    onSolutionBuilderHostCreate: (host: ts.SolutionBuilderHost<ts.BuilderProgram> | ts.SolutionBuilderWithWatchHost<ts.BuilderProgram>) => void;
    onSolutionBuildComplete: (configs: readonly ts.ParsedCommandLine[]) => void;
}
export function executeCommandLine(system: ts.System, cb: ExecuteCommandLineCallbacks, commandLineArgs: readonly string[]): void {
    if (isBuild(commandLineArgs)) {
        return performBuild(system, cb, commandLineArgs.slice(1));
    }
    const commandLine = ts.parseCommandLine(commandLineArgs, path => system.readFile(path));
    if (commandLine.options.generateCpuProfile && system.enableCPUProfiler) {
        system.enableCPUProfiler(commandLine.options.generateCpuProfile, () => executeCommandLineWorker(system, cb, commandLine));
    }
    else {
        executeCommandLineWorker(system, cb, commandLine);
    }
}
function reportWatchModeWithoutSysSupport(sys: ts.System, reportDiagnostic: ts.DiagnosticReporter) {
    if (!sys.watchFile || !sys.watchDirectory) {
        reportDiagnostic(ts.createCompilerDiagnostic(ts.Diagnostics.The_current_host_does_not_support_the_0_option, "--watch"));
        sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
        return true;
    }
    return false;
}
function performBuildWorker(sys: ts.System, cb: ExecuteCommandLineCallbacks | undefined, buildOptions: ts.BuildOptions, watchOptions: ts.WatchOptions | undefined, projects: string[], errors: ts.Diagnostic[]) {
    // Update to pretty if host supports it
    const reportDiagnostic = updateReportDiagnostic(sys, ts.createDiagnosticReporter(sys), buildOptions);
    if (buildOptions.locale) {
        ts.validateLocaleAndSetLanguage(buildOptions.locale, sys, errors);
    }
    if (errors.length > 0) {
        errors.forEach(reportDiagnostic);
        return sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
    }
    if (buildOptions.help) {
        printVersion(sys);
        printHelp(sys, ts.buildOpts, "--build ");
        return sys.exit(ts.ExitStatus.Success);
    }
    if (projects.length === 0) {
        printVersion(sys);
        printHelp(sys, ts.buildOpts, "--build ");
        return sys.exit(ts.ExitStatus.Success);
    }
    if (!sys.getModifiedTime || !sys.setModifiedTime || (buildOptions.clean && !sys.deleteFile)) {
        reportDiagnostic(ts.createCompilerDiagnostic(ts.Diagnostics.The_current_host_does_not_support_the_0_option, "--build"));
        return sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
    }
    if (buildOptions.watch) {
        if (reportWatchModeWithoutSysSupport(sys, reportDiagnostic))
            return;
        const buildHost = ts.createSolutionBuilderWithWatchHost(sys, 
        /*createProgram*/ undefined, reportDiagnostic, ts.createBuilderStatusReporter(sys, shouldBePretty(sys, buildOptions)), createWatchStatusReporter(sys, buildOptions));
        if (cb && cb.onSolutionBuilderHostCreate)
            cb.onSolutionBuilderHostCreate(buildHost);
        updateCreateProgram(sys, buildHost);
        buildHost.afterProgramEmitAndDiagnostics = program => reportStatistics(sys, program.getProgram());
        const builder = ts.createSolutionBuilderWithWatch(buildHost, projects, buildOptions, watchOptions);
        builder.build();
        return;
    }
    const buildHost = ts.createSolutionBuilderHost(sys, 
    /*createProgram*/ undefined, reportDiagnostic, ts.createBuilderStatusReporter(sys, shouldBePretty(sys, buildOptions)), createReportErrorSummary(sys, buildOptions));
    if (cb && cb.onSolutionBuilderHostCreate)
        cb.onSolutionBuilderHostCreate(buildHost);
    updateCreateProgram(sys, buildHost);
    buildHost.afterProgramEmitAndDiagnostics = program => reportStatistics(sys, program.getProgram());
    const builder = ts.createSolutionBuilder(buildHost, projects, buildOptions);
    const exitStatus = buildOptions.clean ? builder.clean() : builder.build();
    if (cb && cb.onSolutionBuildComplete)
        cb.onSolutionBuildComplete(builder.getAllParsedConfigs());
    return sys.exit(exitStatus);
}
function performBuild(sys: ts.System, cb: ExecuteCommandLineCallbacks | undefined, args: readonly string[]) {
    const { buildOptions, watchOptions, projects, errors } = ts.parseBuildCommand(args);
    if (buildOptions.generateCpuProfile && sys.enableCPUProfiler) {
        sys.enableCPUProfiler(buildOptions.generateCpuProfile, () => performBuildWorker(sys, cb, buildOptions, watchOptions, projects, errors));
    }
    else {
        performBuildWorker(sys, cb, buildOptions, watchOptions, projects, errors);
    }
}
function createReportErrorSummary(sys: ts.System, options: ts.CompilerOptions | ts.BuildOptions): ts.ReportEmitErrorSummary | undefined {
    return shouldBePretty(sys, options) ?
        errorCount => sys.write(ts.getErrorSummaryText(errorCount, sys.newLine)) :
        undefined;
}
function performCompilation(sys: ts.System, reportDiagnostic: ts.DiagnosticReporter, cb: ExecuteCommandLineCallbacks | undefined, config: ts.ParsedCommandLine) {
    const { fileNames, options, projectReferences } = config;
    const host = ts.createCompilerHostWorker(options, /*setParentPos*/ undefined, sys);
    if (cb && cb.onCompilerHostCreate)
        cb.onCompilerHostCreate(host);
    const currentDirectory = host.getCurrentDirectory();
    const getCanonicalFileName = ts.createGetCanonicalFileName(host.useCaseSensitiveFileNames());
    ts.changeCompilerHostLikeToUseCache(host, fileName => ts.toPath(fileName, currentDirectory, getCanonicalFileName));
    enableStatistics(sys, options);
    const programOptions: ts.CreateProgramOptions = {
        rootNames: fileNames,
        options,
        projectReferences,
        host,
        configFileParsingDiagnostics: ts.getConfigFileParsingDiagnostics(config)
    };
    const program = ts.createProgram(programOptions);
    const exitStatus = ts.emitFilesAndReportErrorsAndGetExitStatus(program, reportDiagnostic, s => sys.write(s + sys.newLine), createReportErrorSummary(sys, options));
    reportStatistics(sys, program);
    if (cb && cb.onCompilationComplete)
        cb.onCompilationComplete(config);
    return sys.exit(exitStatus);
}
function performIncrementalCompilation(sys: ts.System, reportDiagnostic: ts.DiagnosticReporter, cb: ExecuteCommandLineCallbacks | undefined, config: ts.ParsedCommandLine) {
    const { options, fileNames, projectReferences } = config;
    enableStatistics(sys, options);
    const host = ts.createIncrementalCompilerHost(options, sys);
    if (cb && cb.onCompilerHostCreate)
        cb.onCompilerHostCreate(host);
    const exitStatus = ts.performIncrementalCompilation({
        host,
        system: sys,
        rootNames: fileNames,
        options,
        configFileParsingDiagnostics: ts.getConfigFileParsingDiagnostics(config),
        projectReferences,
        reportDiagnostic,
        reportErrorSummary: createReportErrorSummary(sys, options),
        afterProgramEmitAndDiagnostics: builderProgram => reportStatistics(sys, builderProgram.getProgram())
    });
    if (cb && cb.onCompilationComplete)
        cb.onCompilationComplete(config);
    return sys.exit(exitStatus);
}
function updateCreateProgram<T extends ts.BuilderProgram>(sys: ts.System, host: {
    createProgram: ts.CreateProgram<T>;
}) {
    const compileUsingBuilder = host.createProgram;
    host.createProgram = (rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences) => {
        ts.Debug.assert(rootNames !== undefined || (options === undefined && !!oldProgram));
        if (options !== undefined) {
            enableStatistics(sys, options);
        }
        return compileUsingBuilder(rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences);
    };
}
function updateWatchCompilationHost(sys: ts.System, watchCompilerHost: ts.WatchCompilerHost<ts.EmitAndSemanticDiagnosticsBuilderProgram>) {
    updateCreateProgram(sys, watchCompilerHost);
    const emitFilesUsingBuilder = watchCompilerHost.afterProgramCreate!; // TODO: GH#18217
    watchCompilerHost.afterProgramCreate = builderProgram => {
        emitFilesUsingBuilder(builderProgram);
        reportStatistics(sys, builderProgram.getProgram());
    };
}
function createWatchStatusReporter(sys: ts.System, options: ts.CompilerOptions | ts.BuildOptions) {
    return ts.createWatchStatusReporter(sys, shouldBePretty(sys, options));
}
function createWatchOfConfigFile(sys: ts.System, reportDiagnostic: ts.DiagnosticReporter, configParseResult: ts.ParsedCommandLine, optionsToExtend: ts.CompilerOptions, watchOptionsToExtend: ts.WatchOptions | undefined) {
    const watchCompilerHost = ts.createWatchCompilerHostOfConfigFile((configParseResult.options.configFilePath!), optionsToExtend, watchOptionsToExtend, sys, 
    /*createProgram*/ undefined, reportDiagnostic, createWatchStatusReporter(sys, configParseResult.options)); // TODO: GH#18217
    updateWatchCompilationHost(sys, watchCompilerHost);
    watchCompilerHost.configFileParsingResult = configParseResult;
    ts.createWatchProgram(watchCompilerHost);
}
function createWatchOfFilesAndCompilerOptions(sys: ts.System, reportDiagnostic: ts.DiagnosticReporter, rootFiles: string[], options: ts.CompilerOptions, watchOptions: ts.WatchOptions | undefined) {
    const watchCompilerHost = ts.createWatchCompilerHostOfFilesAndCompilerOptions(rootFiles, options, watchOptions, sys, 
    /*createProgram*/ undefined, reportDiagnostic, createWatchStatusReporter(sys, options));
    updateWatchCompilationHost(sys, watchCompilerHost);
    ts.createWatchProgram(watchCompilerHost);
}
function canReportDiagnostics(system: ts.System, compilerOptions: ts.CompilerOptions) {
    return system === ts.sys && (compilerOptions.diagnostics || compilerOptions.extendedDiagnostics);
}
function enableStatistics(sys: ts.System, compilerOptions: ts.CompilerOptions) {
    if (canReportDiagnostics(sys, compilerOptions)) {
        ts.performance.enable();
    }
}
function reportStatistics(sys: ts.System, program: ts.Program) {
    let statistics: Statistic[];
    const compilerOptions = program.getCompilerOptions();
    if (canReportDiagnostics(sys, compilerOptions)) {
        statistics = [];
        const memoryUsed = sys.getMemoryUsage ? sys.getMemoryUsage() : -1;
        reportCountStatistic("Files", program.getSourceFiles().length);
        reportCountStatistic("Lines", countLines(program));
        reportCountStatistic("Nodes", program.getNodeCount());
        reportCountStatistic("Identifiers", program.getIdentifierCount());
        reportCountStatistic("Symbols", program.getSymbolCount());
        reportCountStatistic("Types", program.getTypeCount());
        if (memoryUsed >= 0) {
            reportStatisticalValue("Memory used", Math.round(memoryUsed / 1000) + "K");
        }
        const programTime = ts.performance.getDuration("Program");
        const bindTime = ts.performance.getDuration("Bind");
        const checkTime = ts.performance.getDuration("Check");
        const emitTime = ts.performance.getDuration("Emit");
        if (compilerOptions.extendedDiagnostics) {
            const caches = program.getRelationCacheSizes();
            reportCountStatistic("Assignability cache size", caches.assignable);
            reportCountStatistic("Identity cache size", caches.identity);
            reportCountStatistic("Subtype cache size", caches.subtype);
            ts.performance.forEachMeasure((name, duration) => reportTimeStatistic(`${name} time`, duration));
        }
        else {
            // Individual component times.
            // Note: To match the behavior of previous versions of the compiler, the reported parse time includes
            // I/O read time and processing time for triple-slash references and module imports, and the reported
            // emit time includes I/O write time. We preserve this behavior so we can accurately compare times.
            reportTimeStatistic("I/O read", ts.performance.getDuration("I/O Read"));
            reportTimeStatistic("I/O write", ts.performance.getDuration("I/O Write"));
            reportTimeStatistic("Parse time", programTime);
            reportTimeStatistic("Bind time", bindTime);
            reportTimeStatistic("Check time", checkTime);
            reportTimeStatistic("Emit time", emitTime);
        }
        reportTimeStatistic("Total time", programTime + bindTime + checkTime + emitTime);
        reportStatistics();
        ts.performance.disable();
    }
    function reportStatistics() {
        let nameSize = 0;
        let valueSize = 0;
        for (const { name, value } of statistics) {
            if (name.length > nameSize) {
                nameSize = name.length;
            }
            if (value.length > valueSize) {
                valueSize = value.length;
            }
        }
        for (const { name, value } of statistics) {
            sys.write(padRight(name + ":", nameSize + 2) + padLeft(value.toString(), valueSize) + sys.newLine);
        }
    }
    function reportStatisticalValue(name: string, value: string) {
        statistics.push({ name, value });
    }
    function reportCountStatistic(name: string, count: number) {
        reportStatisticalValue(name, "" + count);
    }
    function reportTimeStatistic(name: string, time: number) {
        reportStatisticalValue(name, (time / 1000).toFixed(2) + "s");
    }
}
function writeConfigFile(sys: ts.System, reportDiagnostic: ts.DiagnosticReporter, options: ts.CompilerOptions, fileNames: string[]) {
    const currentDirectory = sys.getCurrentDirectory();
    const file = ts.normalizePath(ts.combinePaths(currentDirectory, "tsconfig.json"));
    if (sys.fileExists(file)) {
        reportDiagnostic(ts.createCompilerDiagnostic(ts.Diagnostics.A_tsconfig_json_file_is_already_defined_at_Colon_0, file));
    }
    else {
        sys.writeFile(file, ts.generateTSConfig(options, fileNames, sys.newLine));
        reportDiagnostic(ts.createCompilerDiagnostic(ts.Diagnostics.Successfully_created_a_tsconfig_json_file));
    }
    return;
}
if (ts.Debug.isDebugging) {
    ts.Debug.enableDebugInfo();
}
if (ts.sys.tryEnableSourceMapsForHost && /^development$/i.test(ts.sys.getEnvironmentVariable("NODE_ENV"))) {
    ts.sys.tryEnableSourceMapsForHost();
}
if (ts.sys.setBlocking) {
    ts.sys.setBlocking();
}
