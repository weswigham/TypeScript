import * as ts from "./ts";
const minimumDate = new Date(-8640000000000000);
const maximumDate = new Date(8640000000000000);
export interface BuildOptions {
    dry?: boolean;
    force?: boolean;
    verbose?: boolean;
    /*@internal*/ clean?: boolean;
    /*@internal*/ watch?: boolean;
    /*@internal*/ help?: boolean;
    /*@internal*/ preserveWatchOutput?: boolean;
    /*@internal*/ listEmittedFiles?: boolean;
    /*@internal*/ listFiles?: boolean;
    /*@internal*/ pretty?: boolean;
    incremental?: boolean;
    traceResolution?: boolean;
    /* @internal */ diagnostics?: boolean;
    /* @internal */ extendedDiagnostics?: boolean;
    /* @internal */ locale?: string;
    /* @internal */ generateCpuProfile?: string;
    [option: string]: ts.CompilerOptionsValue | undefined;
}
enum BuildResultFlags {
    None = 0,
    /**
     * No errors of any kind occurred during build
     */
    Success = 1 << 0,
    /**
     * None of the .d.ts files emitted by this build were
     * different from the existing files on disk
     */
    DeclarationOutputUnchanged = 1 << 1,
    ConfigFileErrors = 1 << 2,
    SyntaxErrors = 1 << 3,
    TypeErrors = 1 << 4,
    DeclarationEmitErrors = 1 << 5,
    EmitErrors = 1 << 6,
    AnyErrors = ConfigFileErrors | SyntaxErrors | TypeErrors | DeclarationEmitErrors | EmitErrors
}
/*@internal*/
export type ResolvedConfigFilePath = ts.ResolvedConfigFileName & ts.Path;
interface FileMap<T, U extends ts.Path = ts.Path> extends ts.Map<T> {
    get(key: U): T | undefined;
    has(key: U): boolean;
    forEach(action: (value: T, key: U) => void): void;
    readonly size: number;
    keys(): ts.Iterator<U>;
    values(): ts.Iterator<T>;
    entries(): ts.Iterator<[U, T]>;
    set(key: U, value: T): this;
    delete(key: U): boolean;
    clear(): void;
}
type ConfigFileMap<T> = FileMap<T, ResolvedConfigFilePath>;
function createConfigFileMap<T>(): ConfigFileMap<T> {
    return ts.createMap() as ConfigFileMap<T>;
}
function getOrCreateValueFromConfigFileMap<T>(configFileMap: ConfigFileMap<T>, resolved: ResolvedConfigFilePath, createT: () => T): T {
    const existingValue = configFileMap.get(resolved);
    let newValue: T | undefined;
    if (!existingValue) {
        newValue = createT();
        configFileMap.set(resolved, newValue);
    }
    return existingValue || newValue!;
}
function getOrCreateValueMapFromConfigFileMap<T>(configFileMap: ConfigFileMap<ts.Map<T>>, resolved: ResolvedConfigFilePath): ts.Map<T> {
    return getOrCreateValueFromConfigFileMap<ts.Map<T>>(configFileMap, resolved, ts.createMap);
}
function newer(date1: Date, date2: Date): Date {
    return date2 > date1 ? date2 : date1;
}
function isDeclarationFile(fileName: string) {
    return ts.fileExtensionIs(fileName, ts.Extension.Dts);
}
export type ReportEmitErrorSummary = (errorCount: number) => void;
export interface SolutionBuilderHostBase<T extends ts.BuilderProgram> extends ts.ProgramHost<T> {
    createDirectory?(path: string): void;
    /**
     * Should provide create directory and writeFile if done of invalidatedProjects is not invoked with
     * writeFileCallback
     */
    writeFile?(path: string, data: string, writeByteOrderMark?: boolean): void;
    getModifiedTime(fileName: string): Date | undefined;
    setModifiedTime(fileName: string, date: Date): void;
    deleteFile(fileName: string): void;
    getParsedCommandLine?(fileName: string): ts.ParsedCommandLine | undefined;
    reportDiagnostic: ts.DiagnosticReporter; // Technically we want to move it out and allow steps of actions on Solution, but for now just merge stuff in build host here
    reportSolutionBuilderStatus: ts.DiagnosticReporter;
    // TODO: To do better with watch mode and normal build mode api that creates program and emits files
    // This currently helps enable --diagnostics and --extendedDiagnostics
    afterProgramEmitAndDiagnostics?(program: T): void;
    // For testing
    /*@internal*/ now?(): Date;
}
export interface SolutionBuilderHost<T extends ts.BuilderProgram> extends SolutionBuilderHostBase<T> {
    reportErrorSummary?: ReportEmitErrorSummary;
}
export interface SolutionBuilderWithWatchHost<T extends ts.BuilderProgram> extends SolutionBuilderHostBase<T>, ts.WatchHost {
}
/*@internal*/
export type BuildOrder = readonly ts.ResolvedConfigFileName[];
/*@internal*/
export interface CircularBuildOrder {
    buildOrder: BuildOrder;
    circularDiagnostics: readonly ts.Diagnostic[];
}
/*@internal*/
export type AnyBuildOrder = BuildOrder | CircularBuildOrder;
/*@internal*/
export function isCircularBuildOrder(buildOrder: AnyBuildOrder): buildOrder is CircularBuildOrder {
    return !!buildOrder && !!(buildOrder as CircularBuildOrder).buildOrder;
}
/*@internal*/
export function getBuildOrderFromAnyBuildOrder(anyBuildOrder: AnyBuildOrder): BuildOrder {
    return isCircularBuildOrder(anyBuildOrder) ? anyBuildOrder.buildOrder : anyBuildOrder;
}
export interface SolutionBuilder<T extends ts.BuilderProgram> {
    build(project?: string, cancellationToken?: ts.CancellationToken): ts.ExitStatus;
    clean(project?: string): ts.ExitStatus;
    buildReferences(project: string, cancellationToken?: ts.CancellationToken): ts.ExitStatus;
    cleanReferences(project?: string): ts.ExitStatus;
    getNextInvalidatedProject(cancellationToken?: ts.CancellationToken): InvalidatedProject<T> | undefined;
    // Currently used for testing but can be made public if needed:
    /*@internal*/ getBuildOrder(): AnyBuildOrder;
    // Testing only
    /*@internal*/ getUpToDateStatusOfProject(project: string): ts.UpToDateStatus;
    /*@internal*/ invalidateProject(configFilePath: ResolvedConfigFilePath, reloadLevel?: ts.ConfigFileProgramReloadLevel): void;
    /*@internal*/ buildNextInvalidatedProject(): void;
    /*@internal*/ getAllParsedConfigs(): readonly ts.ParsedCommandLine[];
}
/**
 * Create a function that reports watch status by writing to the system and handles the formating of the diagnostic
 */
export function createBuilderStatusReporter(system: ts.System, pretty?: boolean): ts.DiagnosticReporter {
    return diagnostic => {
        let output = pretty ? `[${ts.formatColorAndReset(ts.getLocaleTimeString(system), ts.ForegroundColorEscapeSequences.Grey)}] ` : `${ts.getLocaleTimeString(system)} - `;
        output += `${ts.flattenDiagnosticMessageText(diagnostic.messageText, system.newLine)}${system.newLine + system.newLine}`;
        system.write(output);
    };
}
function createSolutionBuilderHostBase<T extends ts.BuilderProgram>(system: ts.System, createProgram: ts.CreateProgram<T> | undefined, reportDiagnostic?: ts.DiagnosticReporter, reportSolutionBuilderStatus?: ts.DiagnosticReporter) {
    const host = (ts.createProgramHost(system, createProgram) as SolutionBuilderHostBase<T>);
    host.getModifiedTime = system.getModifiedTime ? path => system.getModifiedTime!(path) : ts.returnUndefined;
    host.setModifiedTime = system.setModifiedTime ? (path, date) => system.setModifiedTime!(path, date) : ts.noop;
    host.deleteFile = system.deleteFile ? path => system.deleteFile!(path) : ts.noop;
    host.reportDiagnostic = reportDiagnostic || ts.createDiagnosticReporter(system);
    host.reportSolutionBuilderStatus = reportSolutionBuilderStatus || createBuilderStatusReporter(system);
    return host;
}
export function createSolutionBuilderHost<T extends ts.BuilderProgram = ts.EmitAndSemanticDiagnosticsBuilderProgram>(system = ts.sys, createProgram?: ts.CreateProgram<T>, reportDiagnostic?: ts.DiagnosticReporter, reportSolutionBuilderStatus?: ts.DiagnosticReporter, reportErrorSummary?: ReportEmitErrorSummary) {
    const host = createSolutionBuilderHostBase(system, createProgram, reportDiagnostic, reportSolutionBuilderStatus) as SolutionBuilderHost<T>;
    host.reportErrorSummary = reportErrorSummary;
    return host;
}
export function createSolutionBuilderWithWatchHost<T extends ts.BuilderProgram = ts.EmitAndSemanticDiagnosticsBuilderProgram>(system = ts.sys, createProgram?: ts.CreateProgram<T>, reportDiagnostic?: ts.DiagnosticReporter, reportSolutionBuilderStatus?: ts.DiagnosticReporter, reportWatchStatus?: ts.WatchStatusReporter) {
    const host = createSolutionBuilderHostBase(system, createProgram, reportDiagnostic, reportSolutionBuilderStatus) as SolutionBuilderWithWatchHost<T>;
    const watchHost = ts.createWatchHost(system, reportWatchStatus);
    ts.copyProperties(host, watchHost);
    return host;
}
function getCompilerOptionsOfBuildOptions(buildOptions: BuildOptions): ts.CompilerOptions {
    const result = ({} as ts.CompilerOptions);
    ts.commonOptionsWithBuild.forEach(option => {
        if (ts.hasProperty(buildOptions, option.name))
            result[option.name] = buildOptions[option.name];
    });
    return result;
}
export function createSolutionBuilder<T extends ts.BuilderProgram>(host: SolutionBuilderHost<T>, rootNames: readonly string[], defaultOptions: BuildOptions): SolutionBuilder<T> {
    return createSolutionBuilderWorker(/*watch*/ false, host, rootNames, defaultOptions);
}
export function createSolutionBuilderWithWatch<T extends ts.BuilderProgram>(host: SolutionBuilderWithWatchHost<T>, rootNames: readonly string[], defaultOptions: BuildOptions, baseWatchOptions?: ts.WatchOptions): SolutionBuilder<T> {
    return createSolutionBuilderWorker(/*watch*/ true, host, rootNames, defaultOptions, baseWatchOptions);
}
type ConfigFileCacheEntry = ts.ParsedCommandLine | ts.Diagnostic;
interface SolutionBuilderStateCache {
    originalReadFile: ts.CompilerHost["readFile"];
    originalFileExists: ts.CompilerHost["fileExists"];
    originalDirectoryExists: ts.CompilerHost["directoryExists"];
    originalCreateDirectory: ts.CompilerHost["createDirectory"];
    originalWriteFile: ts.CompilerHost["writeFile"] | undefined;
    originalReadFileWithCache: ts.CompilerHost["readFile"];
    originalGetSourceFile: ts.CompilerHost["getSourceFile"];
}
interface SolutionBuilderState<T extends ts.BuilderProgram = ts.BuilderProgram> {
    readonly host: SolutionBuilderHost<T>;
    readonly hostWithWatch: SolutionBuilderWithWatchHost<T>;
    readonly currentDirectory: string;
    readonly getCanonicalFileName: ts.GetCanonicalFileName;
    readonly parseConfigFileHost: ts.ParseConfigFileHost;
    readonly writeFileName: ((s: string) => void) | undefined;
    // State of solution
    readonly options: BuildOptions;
    readonly baseCompilerOptions: ts.CompilerOptions;
    readonly rootNames: readonly string[];
    readonly baseWatchOptions: ts.WatchOptions | undefined;
    readonly resolvedConfigFilePaths: ts.Map<ResolvedConfigFilePath>;
    readonly configFileCache: ConfigFileMap<ConfigFileCacheEntry>;
    /** Map from config file name to up-to-date status */
    readonly projectStatus: ConfigFileMap<ts.UpToDateStatus>;
    readonly buildInfoChecked: ConfigFileMap<true>;
    readonly extendedConfigCache: ts.Map<ts.ExtendedConfigCacheEntry>;
    readonly builderPrograms: ConfigFileMap<T>;
    readonly diagnostics: ConfigFileMap<readonly ts.Diagnostic[]>;
    readonly projectPendingBuild: ConfigFileMap<ts.ConfigFileProgramReloadLevel>;
    readonly projectErrorsReported: ConfigFileMap<true>;
    readonly compilerHost: ts.CompilerHost;
    readonly moduleResolutionCache: ts.ModuleResolutionCache | undefined;
    // Mutable state
    buildOrder: AnyBuildOrder | undefined;
    readFileWithCache: (f: string) => string | undefined;
    projectCompilerOptions: ts.CompilerOptions;
    cache: SolutionBuilderStateCache | undefined;
    allProjectBuildPending: boolean;
    needsSummary: boolean;
    watchAllProjectsPending: boolean;
    currentInvalidatedProject: InvalidatedProject<T> | undefined;
    // Watch state
    readonly watch: boolean;
    readonly allWatchedWildcardDirectories: ConfigFileMap<ts.Map<ts.WildcardDirectoryWatcher>>;
    readonly allWatchedInputFiles: ConfigFileMap<ts.Map<ts.FileWatcher>>;
    readonly allWatchedConfigFiles: ConfigFileMap<ts.FileWatcher>;
    timerToBuildInvalidatedProject: any;
    reportFileChangeDetected: boolean;
    watchFile: ts.WatchFile<ts.WatchType, ts.ResolvedConfigFileName>;
    watchFilePath: ts.WatchFilePath<ts.WatchType, ts.ResolvedConfigFileName>;
    watchDirectory: ts.WatchDirectory<ts.WatchType, ts.ResolvedConfigFileName>;
    writeLog: (s: string) => void;
}
function createSolutionBuilderState<T extends ts.BuilderProgram>(watch: boolean, hostOrHostWithWatch: SolutionBuilderHost<T> | SolutionBuilderWithWatchHost<T>, rootNames: readonly string[], options: BuildOptions, baseWatchOptions: ts.WatchOptions | undefined): SolutionBuilderState<T> {
    const host = hostOrHostWithWatch as SolutionBuilderHost<T>;
    const hostWithWatch = hostOrHostWithWatch as SolutionBuilderWithWatchHost<T>;
    const currentDirectory = host.getCurrentDirectory();
    const getCanonicalFileName = ts.createGetCanonicalFileName(host.useCaseSensitiveFileNames());
    // State of the solution
    const baseCompilerOptions = getCompilerOptionsOfBuildOptions(options);
    const compilerHost = ts.createCompilerHostFromProgramHost(host, () => state.projectCompilerOptions);
    ts.setGetSourceFileAsHashVersioned(compilerHost, host);
    compilerHost.getParsedCommandLine = fileName => parseConfigFile(state, (fileName as ts.ResolvedConfigFileName), toResolvedConfigFilePath(state, (fileName as ts.ResolvedConfigFileName)));
    compilerHost.resolveModuleNames = ts.maybeBind(host, host.resolveModuleNames);
    compilerHost.resolveTypeReferenceDirectives = ts.maybeBind(host, host.resolveTypeReferenceDirectives);
    const moduleResolutionCache = !compilerHost.resolveModuleNames ? ts.createModuleResolutionCache(currentDirectory, getCanonicalFileName) : undefined;
    if (!compilerHost.resolveModuleNames) {
        const loader = (moduleName: string, containingFile: string, redirectedReference: ts.ResolvedProjectReference | undefined) => ts.resolveModuleName(moduleName, containingFile, state.projectCompilerOptions, compilerHost, moduleResolutionCache, redirectedReference).resolvedModule!;
        compilerHost.resolveModuleNames = (moduleNames, containingFile, _reusedNames, redirectedReference) => ts.loadWithLocalCache<ts.ResolvedModuleFull>(ts.Debug.assertEachDefined(moduleNames), containingFile, redirectedReference, loader);
    }
    const { watchFile, watchFilePath, watchDirectory, writeLog } = ts.createWatchFactory<ts.ResolvedConfigFileName>(hostWithWatch, options);
    const state: SolutionBuilderState<T> = {
        host,
        hostWithWatch,
        currentDirectory,
        getCanonicalFileName,
        parseConfigFileHost: ts.parseConfigHostFromCompilerHostLike(host),
        writeFileName: host.trace ? (s: string) => host.trace!(s) : undefined,
        // State of solution
        options,
        baseCompilerOptions,
        rootNames,
        baseWatchOptions,
        resolvedConfigFilePaths: ts.createMap(),
        configFileCache: createConfigFileMap(),
        projectStatus: createConfigFileMap(),
        buildInfoChecked: createConfigFileMap(),
        extendedConfigCache: ts.createMap(),
        builderPrograms: createConfigFileMap(),
        diagnostics: createConfigFileMap(),
        projectPendingBuild: createConfigFileMap(),
        projectErrorsReported: createConfigFileMap(),
        compilerHost,
        moduleResolutionCache,
        // Mutable state
        buildOrder: undefined,
        readFileWithCache: f => host.readFile(f),
        projectCompilerOptions: baseCompilerOptions,
        cache: undefined,
        allProjectBuildPending: true,
        needsSummary: true,
        watchAllProjectsPending: watch,
        currentInvalidatedProject: undefined,
        // Watch state
        watch,
        allWatchedWildcardDirectories: createConfigFileMap(),
        allWatchedInputFiles: createConfigFileMap(),
        allWatchedConfigFiles: createConfigFileMap(),
        timerToBuildInvalidatedProject: undefined,
        reportFileChangeDetected: false,
        watchFile,
        watchFilePath,
        watchDirectory,
        writeLog,
    };
    return state;
}
function toPath(state: SolutionBuilderState, fileName: string) {
    return ts.toPath(fileName, state.currentDirectory, state.getCanonicalFileName);
}
function toResolvedConfigFilePath(state: SolutionBuilderState, fileName: ts.ResolvedConfigFileName): ResolvedConfigFilePath {
    const { resolvedConfigFilePaths } = state;
    const path = resolvedConfigFilePaths.get(fileName);
    if (path !== undefined)
        return path;
    const resolvedPath = toPath(state, fileName) as ResolvedConfigFilePath;
    resolvedConfigFilePaths.set(fileName, resolvedPath);
    return resolvedPath;
}
function isParsedCommandLine(entry: ConfigFileCacheEntry): entry is ts.ParsedCommandLine {
    return !!(entry as ts.ParsedCommandLine).options;
}
function parseConfigFile(state: SolutionBuilderState, configFileName: ts.ResolvedConfigFileName, configFilePath: ResolvedConfigFilePath): ts.ParsedCommandLine | undefined {
    const { configFileCache } = state;
    const value = configFileCache.get(configFilePath);
    if (value) {
        return isParsedCommandLine(value) ? value : undefined;
    }
    let diagnostic: ts.Diagnostic | undefined;
    const { parseConfigFileHost, baseCompilerOptions, baseWatchOptions, extendedConfigCache, host } = state;
    let parsed: ts.ParsedCommandLine | undefined;
    if (host.getParsedCommandLine) {
        parsed = host.getParsedCommandLine(configFileName);
        if (!parsed)
            diagnostic = ts.createCompilerDiagnostic(ts.Diagnostics.File_0_not_found, configFileName);
    }
    else {
        parseConfigFileHost.onUnRecoverableConfigFileDiagnostic = d => diagnostic = d;
        parsed = ts.getParsedCommandLineOfConfigFile(configFileName, baseCompilerOptions, parseConfigFileHost, extendedConfigCache, baseWatchOptions);
        parseConfigFileHost.onUnRecoverableConfigFileDiagnostic = ts.noop;
    }
    configFileCache.set(configFilePath, parsed || diagnostic!);
    return parsed;
}
function resolveProjectName(state: SolutionBuilderState, name: string): ts.ResolvedConfigFileName {
    return ts.resolveConfigFileProjectName(ts.resolvePath(state.currentDirectory, name));
}
function createBuildOrder(state: SolutionBuilderState, roots: readonly ts.ResolvedConfigFileName[]): AnyBuildOrder {
    const temporaryMarks = (ts.createMap() as ConfigFileMap<true>);
    const permanentMarks = (ts.createMap() as ConfigFileMap<true>);
    const circularityReportStack: string[] = [];
    let buildOrder: ts.ResolvedConfigFileName[] | undefined;
    let circularDiagnostics: ts.Diagnostic[] | undefined;
    for (const root of roots) {
        visit(root);
    }
    return circularDiagnostics ?
        { buildOrder: buildOrder || ts.emptyArray, circularDiagnostics } :
        buildOrder || ts.emptyArray;
    function visit(configFileName: ts.ResolvedConfigFileName, inCircularContext?: boolean) {
        const projPath = toResolvedConfigFilePath(state, configFileName);
        // Already visited
        if (permanentMarks.has(projPath))
            return;
        // Circular
        if (temporaryMarks.has(projPath)) {
            if (!inCircularContext) {
                (circularDiagnostics || (circularDiagnostics = [])).push(ts.createCompilerDiagnostic(ts.Diagnostics.Project_references_may_not_form_a_circular_graph_Cycle_detected_Colon_0, circularityReportStack.join("\r\n")));
            }
            return;
        }
        temporaryMarks.set(projPath, true);
        circularityReportStack.push(configFileName);
        const parsed = parseConfigFile(state, configFileName, projPath);
        if (parsed && parsed.projectReferences) {
            for (const ref of parsed.projectReferences) {
                const resolvedRefPath = resolveProjectName(state, ref.path);
                visit(resolvedRefPath, inCircularContext || ref.circular);
            }
        }
        circularityReportStack.pop();
        permanentMarks.set(projPath, true);
        (buildOrder || (buildOrder = [])).push(configFileName);
    }
}
function getBuildOrder(state: SolutionBuilderState) {
    return state.buildOrder || createStateBuildOrder(state);
}
function createStateBuildOrder(state: SolutionBuilderState) {
    const buildOrder = createBuildOrder(state, state.rootNames.map(f => resolveProjectName(state, f)));
    // Clear all to ResolvedConfigFilePaths cache to start fresh
    state.resolvedConfigFilePaths.clear();
    const currentProjects = (ts.arrayToSet(getBuildOrderFromAnyBuildOrder(buildOrder), resolved => toResolvedConfigFilePath(state, resolved)) as ConfigFileMap<true>);
    const noopOnDelete = { onDeleteValue: ts.noop };
    // Config file cache
    ts.mutateMapSkippingNewValues(state.configFileCache, currentProjects, noopOnDelete);
    ts.mutateMapSkippingNewValues(state.projectStatus, currentProjects, noopOnDelete);
    ts.mutateMapSkippingNewValues(state.buildInfoChecked, currentProjects, noopOnDelete);
    ts.mutateMapSkippingNewValues(state.builderPrograms, currentProjects, noopOnDelete);
    ts.mutateMapSkippingNewValues(state.diagnostics, currentProjects, noopOnDelete);
    ts.mutateMapSkippingNewValues(state.projectPendingBuild, currentProjects, noopOnDelete);
    ts.mutateMapSkippingNewValues(state.projectErrorsReported, currentProjects, noopOnDelete);
    // Remove watches for the program no longer in the solution
    if (state.watch) {
        ts.mutateMapSkippingNewValues(state.allWatchedConfigFiles, currentProjects, { onDeleteValue: ts.closeFileWatcher });
        ts.mutateMapSkippingNewValues(state.allWatchedWildcardDirectories, currentProjects, { onDeleteValue: existingMap => existingMap.forEach(ts.closeFileWatcherOf) });
        ts.mutateMapSkippingNewValues(state.allWatchedInputFiles, currentProjects, { onDeleteValue: existingMap => existingMap.forEach(ts.closeFileWatcher) });
    }
    return state.buildOrder = buildOrder;
}
function getBuildOrderFor(state: SolutionBuilderState, project: string | undefined, onlyReferences: boolean | undefined): AnyBuildOrder | undefined {
    const resolvedProject = project && resolveProjectName(state, project);
    const buildOrderFromState = getBuildOrder(state);
    if (isCircularBuildOrder(buildOrderFromState))
        return buildOrderFromState;
    if (resolvedProject) {
        const projectPath = toResolvedConfigFilePath(state, resolvedProject);
        const projectIndex = ts.findIndex(buildOrderFromState, configFileName => toResolvedConfigFilePath(state, configFileName) === projectPath);
        if (projectIndex === -1)
            return undefined;
    }
    const buildOrder = resolvedProject ? createBuildOrder(state, [resolvedProject]) as BuildOrder : buildOrderFromState;
    ts.Debug.assert(!isCircularBuildOrder(buildOrder));
    ts.Debug.assert(!onlyReferences || resolvedProject !== undefined);
    ts.Debug.assert(!onlyReferences || buildOrder[buildOrder.length - 1] === resolvedProject);
    return onlyReferences ? buildOrder.slice(0, buildOrder.length - 1) : buildOrder;
}
function enableCache(state: SolutionBuilderState) {
    if (state.cache) {
        disableCache(state);
    }
    const { compilerHost, host } = state;
    const originalReadFileWithCache = state.readFileWithCache;
    const originalGetSourceFile = compilerHost.getSourceFile;
    const { originalReadFile, originalFileExists, originalDirectoryExists, originalCreateDirectory, originalWriteFile, getSourceFileWithCache, readFileWithCache } = ts.changeCompilerHostLikeToUseCache(host, fileName => toPath(state, fileName), (...args) => originalGetSourceFile.call(compilerHost, ...args));
    state.readFileWithCache = readFileWithCache;
    compilerHost.getSourceFile = getSourceFileWithCache!;
    state.cache = {
        originalReadFile,
        originalFileExists,
        originalDirectoryExists,
        originalCreateDirectory,
        originalWriteFile,
        originalReadFileWithCache,
        originalGetSourceFile,
    };
}
function disableCache(state: SolutionBuilderState) {
    if (!state.cache)
        return;
    const { cache, host, compilerHost, extendedConfigCache, moduleResolutionCache } = state;
    host.readFile = cache.originalReadFile;
    host.fileExists = cache.originalFileExists;
    host.directoryExists = cache.originalDirectoryExists;
    host.createDirectory = cache.originalCreateDirectory;
    host.writeFile = cache.originalWriteFile;
    compilerHost.getSourceFile = cache.originalGetSourceFile;
    state.readFileWithCache = cache.originalReadFileWithCache;
    extendedConfigCache.clear();
    if (moduleResolutionCache) {
        moduleResolutionCache.directoryToModuleNameMap.clear();
        moduleResolutionCache.moduleNameToDirectoryMap.clear();
    }
    state.cache = undefined;
}
function clearProjectStatus(state: SolutionBuilderState, resolved: ResolvedConfigFilePath) {
    state.projectStatus.delete(resolved);
    state.diagnostics.delete(resolved);
}
function addProjToQueue({ projectPendingBuild }: SolutionBuilderState, proj: ResolvedConfigFilePath, reloadLevel: ts.ConfigFileProgramReloadLevel) {
    const value = projectPendingBuild.get(proj);
    if (value === undefined) {
        projectPendingBuild.set(proj, reloadLevel);
    }
    else if (value < reloadLevel) {
        projectPendingBuild.set(proj, reloadLevel);
    }
}
function setupInitialBuild(state: SolutionBuilderState, cancellationToken: ts.CancellationToken | undefined) {
    // Set initial build if not already built
    if (!state.allProjectBuildPending)
        return;
    state.allProjectBuildPending = false;
    if (state.options.watch) {
        reportWatchStatus(state, ts.Diagnostics.Starting_compilation_in_watch_mode);
    }
    enableCache(state);
    const buildOrder = getBuildOrderFromAnyBuildOrder(getBuildOrder(state));
    buildOrder.forEach(configFileName => state.projectPendingBuild.set(toResolvedConfigFilePath(state, configFileName), ts.ConfigFileProgramReloadLevel.None));
    if (cancellationToken) {
        cancellationToken.throwIfCancellationRequested();
    }
}
export enum InvalidatedProjectKind {
    Build,
    UpdateBundle,
    UpdateOutputFileStamps
}
export interface InvalidatedProjectBase {
    readonly kind: InvalidatedProjectKind;
    readonly project: ts.ResolvedConfigFileName;
    /*@internal*/ readonly projectPath: ResolvedConfigFilePath;
    /*@internal*/ readonly buildOrder: readonly ts.ResolvedConfigFileName[];
    /**
     *  To dispose this project and ensure that all the necessary actions are taken and state is updated accordingly
     */
    done(cancellationToken?: ts.CancellationToken, writeFile?: ts.WriteFileCallback, customTransformers?: ts.CustomTransformers): ts.ExitStatus;
    getCompilerOptions(): ts.CompilerOptions;
    getCurrentDirectory(): string;
}
export interface UpdateOutputFileStampsProject extends InvalidatedProjectBase {
    readonly kind: InvalidatedProjectKind.UpdateOutputFileStamps;
    updateOutputFileStatmps(): void;
}
export interface BuildInvalidedProject<T extends ts.BuilderProgram> extends InvalidatedProjectBase {
    readonly kind: InvalidatedProjectKind.Build;
    /*
     * Emitting with this builder program without the api provided for this project
     * can result in build system going into invalid state as files written reflect the state of the project
     */
    getBuilderProgram(): T | undefined;
    getProgram(): ts.Program | undefined;
    getSourceFile(fileName: string): ts.SourceFile | undefined;
    getSourceFiles(): readonly ts.SourceFile[];
    getOptionsDiagnostics(cancellationToken?: ts.CancellationToken): readonly ts.Diagnostic[];
    getGlobalDiagnostics(cancellationToken?: ts.CancellationToken): readonly ts.Diagnostic[];
    getConfigFileParsingDiagnostics(): readonly ts.Diagnostic[];
    getSyntacticDiagnostics(sourceFile?: ts.SourceFile, cancellationToken?: ts.CancellationToken): readonly ts.Diagnostic[];
    getAllDependencies(sourceFile: ts.SourceFile): readonly string[];
    getSemanticDiagnostics(sourceFile?: ts.SourceFile, cancellationToken?: ts.CancellationToken): readonly ts.Diagnostic[];
    getSemanticDiagnosticsOfNextAffectedFile(cancellationToken?: ts.CancellationToken, ignoreSourceFile?: (sourceFile: ts.SourceFile) => boolean): ts.AffectedFileResult<readonly ts.Diagnostic[]>;
    /*
     * Calling emit directly with targetSourceFile and emitOnlyDtsFiles set to true is not advised since
     * emit in build system is responsible in updating status of the project
     * If called with targetSourceFile and emitOnlyDtsFiles set to true, the emit just passes to underlying builder and
     * wont reflect the status of file as being emitted in the builder
     * (if that emit of that source file is required it would be emitted again when making sure invalidated project is completed)
     * This emit is not considered actual emit (and hence uptodate status is not reflected if
     */
    emit(targetSourceFile?: ts.SourceFile, writeFile?: ts.WriteFileCallback, cancellationToken?: ts.CancellationToken, emitOnlyDtsFiles?: boolean, customTransformers?: ts.CustomTransformers): ts.EmitResult | undefined;
}
export interface UpdateBundleProject<T extends ts.BuilderProgram> extends InvalidatedProjectBase {
    readonly kind: InvalidatedProjectKind.UpdateBundle;
    emit(writeFile?: ts.WriteFileCallback, customTransformers?: ts.CustomTransformers): ts.EmitResult | BuildInvalidedProject<T> | undefined;
}
export type InvalidatedProject<T extends ts.BuilderProgram> = UpdateOutputFileStampsProject | BuildInvalidedProject<T> | UpdateBundleProject<T>;
function doneInvalidatedProject(state: SolutionBuilderState, projectPath: ResolvedConfigFilePath) {
    state.projectPendingBuild.delete(projectPath);
    state.currentInvalidatedProject = undefined;
    return state.diagnostics.has(projectPath) ?
        ts.ExitStatus.DiagnosticsPresent_OutputsSkipped :
        ts.ExitStatus.Success;
}
function createUpdateOutputFileStampsProject(state: SolutionBuilderState, project: ts.ResolvedConfigFileName, projectPath: ResolvedConfigFilePath, config: ts.ParsedCommandLine, buildOrder: readonly ts.ResolvedConfigFileName[]): UpdateOutputFileStampsProject {
    let updateOutputFileStampsPending = true;
    return {
        kind: InvalidatedProjectKind.UpdateOutputFileStamps,
        project,
        projectPath,
        buildOrder,
        getCompilerOptions: () => config.options,
        getCurrentDirectory: () => state.currentDirectory,
        updateOutputFileStatmps: () => {
            updateOutputTimestamps(state, config, projectPath);
            updateOutputFileStampsPending = false;
        },
        done: () => {
            if (updateOutputFileStampsPending) {
                updateOutputTimestamps(state, config, projectPath);
            }
            return doneInvalidatedProject(state, projectPath);
        }
    };
}
function createBuildOrUpdateInvalidedProject<T extends ts.BuilderProgram>(kind: InvalidatedProjectKind.Build | InvalidatedProjectKind.UpdateBundle, state: SolutionBuilderState<T>, project: ts.ResolvedConfigFileName, projectPath: ResolvedConfigFilePath, projectIndex: number, config: ts.ParsedCommandLine, buildOrder: readonly ts.ResolvedConfigFileName[]): BuildInvalidedProject<T> | UpdateBundleProject<T> {
    enum Step {
        CreateProgram,
        SyntaxDiagnostics,
        SemanticDiagnostics,
        Emit,
        EmitBundle,
        BuildInvalidatedProjectOfBundle,
        QueueReferencingProjects,
        Done
    }
    let step = kind === InvalidatedProjectKind.Build ? Step.CreateProgram : Step.EmitBundle;
    let program: T | undefined;
    let buildResult: BuildResultFlags | undefined;
    let invalidatedProjectOfBundle: BuildInvalidedProject<T> | undefined;
    return kind === InvalidatedProjectKind.Build ?
        {
            kind,
            project,
            projectPath,
            buildOrder,
            getCompilerOptions: () => config.options,
            getCurrentDirectory: () => state.currentDirectory,
            getBuilderProgram: () => withProgramOrUndefined(ts.identity),
            getProgram: () => withProgramOrUndefined(program => program.getProgramOrUndefined()),
            getSourceFile: fileName => withProgramOrUndefined(program => program.getSourceFile(fileName)),
            getSourceFiles: () => withProgramOrEmptyArray(program => program.getSourceFiles()),
            getOptionsDiagnostics: cancellationToken => withProgramOrEmptyArray(program => program.getOptionsDiagnostics(cancellationToken)),
            getGlobalDiagnostics: cancellationToken => withProgramOrEmptyArray(program => program.getGlobalDiagnostics(cancellationToken)),
            getConfigFileParsingDiagnostics: () => withProgramOrEmptyArray(program => program.getConfigFileParsingDiagnostics()),
            getSyntacticDiagnostics: (sourceFile, cancellationToken) => withProgramOrEmptyArray(program => program.getSyntacticDiagnostics(sourceFile, cancellationToken)),
            getAllDependencies: sourceFile => withProgramOrEmptyArray(program => program.getAllDependencies(sourceFile)),
            getSemanticDiagnostics: (sourceFile, cancellationToken) => withProgramOrEmptyArray(program => program.getSemanticDiagnostics(sourceFile, cancellationToken)),
            getSemanticDiagnosticsOfNextAffectedFile: (cancellationToken, ignoreSourceFile) => withProgramOrUndefined(program => ((program as any as ts.SemanticDiagnosticsBuilderProgram).getSemanticDiagnosticsOfNextAffectedFile) &&
                (program as any as ts.SemanticDiagnosticsBuilderProgram).getSemanticDiagnosticsOfNextAffectedFile(cancellationToken, ignoreSourceFile)),
            emit: (targetSourceFile, writeFile, cancellationToken, emitOnlyDtsFiles, customTransformers) => {
                if (targetSourceFile || emitOnlyDtsFiles) {
                    return withProgramOrUndefined(program => program.emit(targetSourceFile, writeFile, cancellationToken, emitOnlyDtsFiles, customTransformers));
                }
                executeSteps(Step.SemanticDiagnostics, cancellationToken);
                if (step !== Step.Emit)
                    return undefined;
                return emit(writeFile, cancellationToken, customTransformers);
            },
            done
        } :
        {
            kind,
            project,
            projectPath,
            buildOrder,
            getCompilerOptions: () => config.options,
            getCurrentDirectory: () => state.currentDirectory,
            emit: (writeFile: ts.WriteFileCallback | undefined, customTransformers: ts.CustomTransformers | undefined) => {
                if (step !== Step.EmitBundle)
                    return invalidatedProjectOfBundle;
                return emitBundle(writeFile, customTransformers);
            },
            done,
        };
    function done(cancellationToken?: ts.CancellationToken, writeFile?: ts.WriteFileCallback, customTransformers?: ts.CustomTransformers) {
        executeSteps(Step.Done, cancellationToken, writeFile, customTransformers);
        return doneInvalidatedProject(state, projectPath);
    }
    function withProgramOrUndefined<U>(action: (program: T) => U | undefined): U | undefined {
        executeSteps(Step.CreateProgram);
        return program && action(program);
    }
    function withProgramOrEmptyArray<U>(action: (program: T) => readonly U[]): readonly U[] {
        return withProgramOrUndefined(action) || ts.emptyArray;
    }
    function createProgram() {
        ts.Debug.assert(program === undefined);
        if (state.options.dry) {
            reportStatus(state, ts.Diagnostics.A_non_dry_build_would_build_project_0, project);
            buildResult = BuildResultFlags.Success;
            step = Step.QueueReferencingProjects;
            return;
        }
        if (state.options.verbose)
            reportStatus(state, ts.Diagnostics.Building_project_0, project);
        if (config.fileNames.length === 0) {
            reportAndStoreErrors(state, projectPath, config.errors);
            // Nothing to build - must be a solution file, basically
            buildResult = BuildResultFlags.None;
            step = Step.QueueReferencingProjects;
            return;
        }
        const { host, compilerHost } = state;
        state.projectCompilerOptions = config.options;
        // Update module resolution cache if needed
        updateModuleResolutionCache(state, project, config);
        // Create program
        program = host.createProgram(config.fileNames, config.options, compilerHost, getOldProgram(state, projectPath, config), config.errors, config.projectReferences);
        step++;
    }
    function handleDiagnostics(diagnostics: readonly ts.Diagnostic[], errorFlags: BuildResultFlags, errorType: string) {
        if (diagnostics.length) {
            buildResult = buildErrors(state, projectPath, program, diagnostics, errorFlags, errorType);
            step = Step.QueueReferencingProjects;
        }
        else {
            step++;
        }
    }
    function getSyntaxDiagnostics(cancellationToken?: ts.CancellationToken) {
        ts.Debug.assertDefined(program);
        handleDiagnostics([
            ...program!.getConfigFileParsingDiagnostics(),
            ...program!.getOptionsDiagnostics(cancellationToken),
            ...program!.getGlobalDiagnostics(cancellationToken),
            ...program!.getSyntacticDiagnostics(/*sourceFile*/ undefined, cancellationToken)
        ], BuildResultFlags.SyntaxErrors, "Syntactic");
    }
    function getSemanticDiagnostics(cancellationToken?: ts.CancellationToken) {
        handleDiagnostics(ts.Debug.assertDefined(program).getSemanticDiagnostics(/*sourceFile*/ undefined, cancellationToken), BuildResultFlags.TypeErrors, "Semantic");
    }
    function emit(writeFileCallback?: ts.WriteFileCallback, cancellationToken?: ts.CancellationToken, customTransformers?: ts.CustomTransformers): ts.EmitResult {
        ts.Debug.assertDefined(program);
        ts.Debug.assert(step === Step.Emit);
        // Before emitting lets backup state, so we can revert it back if there are declaration errors to handle emit and declaration errors correctly
        program!.backupState();
        let declDiagnostics: ts.Diagnostic[] | undefined;
        const reportDeclarationDiagnostics = (d: ts.Diagnostic) => (declDiagnostics || (declDiagnostics = [])).push(d);
        const outputFiles: ts.OutputFile[] = [];
        const { emitResult } = ts.emitFilesAndReportErrors((program!), reportDeclarationDiagnostics, 
        /*writeFileName*/ undefined, 
        /*reportSummary*/ undefined, (name, text, writeByteOrderMark) => outputFiles.push({ name, text, writeByteOrderMark }), cancellationToken, 
        /*emitOnlyDts*/ false, customTransformers);
        // Don't emit .d.ts if there are decl file errors
        if (declDiagnostics) {
            program!.restoreState();
            buildResult = buildErrors(state, projectPath, program, declDiagnostics, BuildResultFlags.DeclarationEmitErrors, "Declaration file");
            step = Step.QueueReferencingProjects;
            return {
                emitSkipped: true,
                diagnostics: emitResult.diagnostics
            };
        }
        // Actual Emit
        const { host, compilerHost } = state;
        let resultFlags = BuildResultFlags.DeclarationOutputUnchanged;
        let newestDeclarationFileContentChangedTime = minimumDate;
        let anyDtsChanged = false;
        const emitterDiagnostics = ts.createDiagnosticCollection();
        const emittedOutputs = (ts.createMap() as FileMap<string>);
        outputFiles.forEach(({ name, text, writeByteOrderMark }) => {
            let priorChangeTime: Date | undefined;
            if (!anyDtsChanged && isDeclarationFile(name)) {
                // Check for unchanged .d.ts files
                if (host.fileExists(name) && state.readFileWithCache(name) === text) {
                    priorChangeTime = host.getModifiedTime(name);
                }
                else {
                    resultFlags &= ~BuildResultFlags.DeclarationOutputUnchanged;
                    anyDtsChanged = true;
                }
            }
            emittedOutputs.set(toPath(state, name), name);
            ts.writeFile(writeFileCallback ? { writeFile: writeFileCallback } : compilerHost, emitterDiagnostics, name, text, writeByteOrderMark);
            if (priorChangeTime !== undefined) {
                newestDeclarationFileContentChangedTime = newer(priorChangeTime, newestDeclarationFileContentChangedTime);
            }
        });
        finishEmit(emitterDiagnostics, emittedOutputs, newestDeclarationFileContentChangedTime, 
        /*newestDeclarationFileContentChangedTimeIsMaximumDate*/ anyDtsChanged, outputFiles.length ? outputFiles[0].name : ts.getFirstProjectOutput(config, !host.useCaseSensitiveFileNames()), resultFlags);
        return emitResult;
    }
    function finishEmit(emitterDiagnostics: ts.DiagnosticCollection, emittedOutputs: FileMap<string>, priorNewestUpdateTime: Date, newestDeclarationFileContentChangedTimeIsMaximumDate: boolean, oldestOutputFileName: string, resultFlags: BuildResultFlags) {
        const emitDiagnostics = emitterDiagnostics.getDiagnostics();
        if (emitDiagnostics.length) {
            buildResult = buildErrors(state, projectPath, program, emitDiagnostics, BuildResultFlags.EmitErrors, "Emit");
            step = Step.QueueReferencingProjects;
            return emitDiagnostics;
        }
        if (state.writeFileName) {
            emittedOutputs.forEach(name => listEmittedFile(state, config, name));
            if (program)
                ts.listFiles(program, state.writeFileName);
        }
        // Update time stamps for rest of the outputs
        const newestDeclarationFileContentChangedTime = updateOutputTimestampsWorker(state, config, priorNewestUpdateTime, ts.Diagnostics.Updating_unchanged_output_timestamps_of_project_0, emittedOutputs);
        state.diagnostics.delete(projectPath);
        state.projectStatus.set(projectPath, {
            type: ts.UpToDateStatusType.UpToDate,
            newestDeclarationFileContentChangedTime: newestDeclarationFileContentChangedTimeIsMaximumDate ?
                maximumDate :
                newestDeclarationFileContentChangedTime,
            oldestOutputFileName
        });
        if (program)
            afterProgramCreate(state, projectPath, program);
        state.projectCompilerOptions = state.baseCompilerOptions;
        step = Step.QueueReferencingProjects;
        buildResult = resultFlags;
        return emitDiagnostics;
    }
    function emitBundle(writeFileCallback?: ts.WriteFileCallback, customTransformers?: ts.CustomTransformers): ts.EmitResult | BuildInvalidedProject<T> | undefined {
        ts.Debug.assert(kind === InvalidatedProjectKind.UpdateBundle);
        if (state.options.dry) {
            reportStatus(state, ts.Diagnostics.A_non_dry_build_would_update_output_of_project_0, project);
            buildResult = BuildResultFlags.Success;
            step = Step.QueueReferencingProjects;
            return undefined;
        }
        if (state.options.verbose)
            reportStatus(state, ts.Diagnostics.Updating_output_of_project_0, project);
        // Update js, and source map
        const { compilerHost } = state;
        state.projectCompilerOptions = config.options;
        const outputFiles = ts.emitUsingBuildInfo(config, compilerHost, ref => {
            const refName = resolveProjectName(state, ref.path);
            return parseConfigFile(state, refName, toResolvedConfigFilePath(state, refName));
        }, customTransformers);
        if (ts.isString(outputFiles)) {
            reportStatus(state, ts.Diagnostics.Cannot_update_output_of_project_0_because_there_was_error_reading_file_1, project, relName(state, outputFiles));
            step = Step.BuildInvalidatedProjectOfBundle;
            return invalidatedProjectOfBundle = createBuildOrUpdateInvalidedProject(InvalidatedProjectKind.Build, state, project, projectPath, projectIndex, config, buildOrder) as BuildInvalidedProject<T>;
        }
        // Actual Emit
        ts.Debug.assert(!!outputFiles.length);
        const emitterDiagnostics = ts.createDiagnosticCollection();
        const emittedOutputs = (ts.createMap() as FileMap<string>);
        outputFiles.forEach(({ name, text, writeByteOrderMark }) => {
            emittedOutputs.set(toPath(state, name), name);
            ts.writeFile(writeFileCallback ? { writeFile: writeFileCallback } : compilerHost, emitterDiagnostics, name, text, writeByteOrderMark);
        });
        const emitDiagnostics = finishEmit(emitterDiagnostics, emittedOutputs, minimumDate, 
        /*newestDeclarationFileContentChangedTimeIsMaximumDate*/ false, outputFiles[0].name, BuildResultFlags.DeclarationOutputUnchanged);
        return { emitSkipped: false, diagnostics: emitDiagnostics };
    }
    function executeSteps(till: Step, cancellationToken?: ts.CancellationToken, writeFile?: ts.WriteFileCallback, customTransformers?: ts.CustomTransformers) {
        while (step <= till && step < Step.Done) {
            const currentStep = step;
            switch (step) {
                case Step.CreateProgram:
                    createProgram();
                    break;
                case Step.SyntaxDiagnostics:
                    getSyntaxDiagnostics(cancellationToken);
                    break;
                case Step.SemanticDiagnostics:
                    getSemanticDiagnostics(cancellationToken);
                    break;
                case Step.Emit:
                    emit(writeFile, cancellationToken, customTransformers);
                    break;
                case Step.EmitBundle:
                    emitBundle(writeFile, customTransformers);
                    break;
                case Step.BuildInvalidatedProjectOfBundle:
                    ts.Debug.assertDefined(invalidatedProjectOfBundle).done(cancellationToken);
                    step = Step.Done;
                    break;
                case Step.QueueReferencingProjects:
                    queueReferencingProjects(state, project, projectPath, projectIndex, config, buildOrder, ts.Debug.assertDefined(buildResult));
                    step++;
                    break;
                // Should never be done
                case Step.Done:
                default:
                    ts.assertType<Step.Done>(step);
            }
            ts.Debug.assert(step > currentStep);
        }
    }
}
function needsBuild({ options }: SolutionBuilderState, status: ts.UpToDateStatus, config: ts.ParsedCommandLine) {
    if (status.type !== ts.UpToDateStatusType.OutOfDateWithPrepend || options.force)
        return true;
    return config.fileNames.length === 0 ||
        !!config.errors.length ||
        !ts.isIncrementalCompilation(config.options);
}
function getNextInvalidatedProject<T extends ts.BuilderProgram>(state: SolutionBuilderState<T>, buildOrder: AnyBuildOrder, reportQueue: boolean): InvalidatedProject<T> | undefined {
    if (!state.projectPendingBuild.size)
        return undefined;
    if (isCircularBuildOrder(buildOrder))
        return undefined;
    if (state.currentInvalidatedProject) {
        // Only if same buildOrder the currentInvalidated project can be sent again
        return ts.arrayIsEqualTo(state.currentInvalidatedProject.buildOrder, buildOrder) ?
            state.currentInvalidatedProject :
            undefined;
    }
    const { options, projectPendingBuild } = state;
    for (let projectIndex = 0; projectIndex < buildOrder.length; projectIndex++) {
        const project = buildOrder[projectIndex];
        const projectPath = toResolvedConfigFilePath(state, project);
        const reloadLevel = state.projectPendingBuild.get(projectPath);
        if (reloadLevel === undefined)
            continue;
        if (reportQueue) {
            reportQueue = false;
            reportBuildQueue(state, buildOrder);
        }
        const config = parseConfigFile(state, project, projectPath);
        if (!config) {
            reportParseConfigFileDiagnostic(state, projectPath);
            projectPendingBuild.delete(projectPath);
            continue;
        }
        if (reloadLevel === ts.ConfigFileProgramReloadLevel.Full) {
            watchConfigFile(state, project, projectPath, config);
            watchWildCardDirectories(state, project, projectPath, config);
            watchInputFiles(state, project, projectPath, config);
        }
        else if (reloadLevel === ts.ConfigFileProgramReloadLevel.Partial) {
            // Update file names
            const result = ts.getFileNamesFromConfigSpecs((config.configFileSpecs!), ts.getDirectoryPath(project), config.options, state.parseConfigFileHost);
            ts.updateErrorForNoInputFiles(result, project, (config.configFileSpecs!), config.errors, ts.canJsonReportNoInutFiles(config.raw));
            config.fileNames = result.fileNames;
            watchInputFiles(state, project, projectPath, config);
        }
        const status = getUpToDateStatus(state, config, projectPath);
        verboseReportProjectStatus(state, project, status);
        if (!options.force) {
            if (status.type === ts.UpToDateStatusType.UpToDate) {
                reportAndStoreErrors(state, projectPath, config.errors);
                projectPendingBuild.delete(projectPath);
                // Up to date, skip
                if (options.dry) {
                    // In a dry build, inform the user of this fact
                    reportStatus(state, ts.Diagnostics.Project_0_is_up_to_date, project);
                }
                continue;
            }
            if (status.type === ts.UpToDateStatusType.UpToDateWithUpstreamTypes) {
                reportAndStoreErrors(state, projectPath, config.errors);
                return createUpdateOutputFileStampsProject(state, project, projectPath, config, buildOrder);
            }
        }
        if (status.type === ts.UpToDateStatusType.UpstreamBlocked) {
            reportAndStoreErrors(state, projectPath, config.errors);
            projectPendingBuild.delete(projectPath);
            if (options.verbose) {
                reportStatus(state, status.upstreamProjectBlocked ?
                    ts.Diagnostics.Skipping_build_of_project_0_because_its_dependency_1_was_not_built :
                    ts.Diagnostics.Skipping_build_of_project_0_because_its_dependency_1_has_errors, project, status.upstreamProjectName);
            }
            continue;
        }
        if (status.type === ts.UpToDateStatusType.ContainerOnly) {
            reportAndStoreErrors(state, projectPath, config.errors);
            projectPendingBuild.delete(projectPath);
            // Do nothing
            continue;
        }
        return createBuildOrUpdateInvalidedProject(needsBuild(state, status, config) ?
            InvalidatedProjectKind.Build :
            InvalidatedProjectKind.UpdateBundle, state, project, projectPath, projectIndex, config, buildOrder);
    }
    return undefined;
}
function listEmittedFile({ writeFileName }: SolutionBuilderState, proj: ts.ParsedCommandLine, file: string) {
    if (writeFileName && proj.options.listEmittedFiles) {
        writeFileName(`TSFILE: ${file}`);
    }
}
function getOldProgram<T extends ts.BuilderProgram>({ options, builderPrograms, compilerHost }: SolutionBuilderState<T>, proj: ResolvedConfigFilePath, parsed: ts.ParsedCommandLine) {
    if (options.force)
        return undefined;
    const value = builderPrograms.get(proj);
    if (value)
        return value;
    return ts.readBuilderProgram(parsed.options, compilerHost) as any as T;
}
function afterProgramCreate<T extends ts.BuilderProgram>({ host, watch, builderPrograms }: SolutionBuilderState<T>, proj: ResolvedConfigFilePath, program: T) {
    if (host.afterProgramEmitAndDiagnostics) {
        host.afterProgramEmitAndDiagnostics(program);
    }
    if (watch) {
        program.releaseProgram();
        builderPrograms.set(proj, program);
    }
}
function buildErrors<T extends ts.BuilderProgram>(state: SolutionBuilderState<T>, resolvedPath: ResolvedConfigFilePath, program: T | undefined, diagnostics: readonly ts.Diagnostic[], errorFlags: BuildResultFlags, errorType: string) {
    reportAndStoreErrors(state, resolvedPath, diagnostics);
    // List files if any other build error using program (emit errors already report files)
    if (program && state.writeFileName)
        ts.listFiles(program, state.writeFileName);
    state.projectStatus.set(resolvedPath, { type: ts.UpToDateStatusType.Unbuildable, reason: `${errorType} errors` });
    if (program)
        afterProgramCreate(state, resolvedPath, program);
    state.projectCompilerOptions = state.baseCompilerOptions;
    return errorFlags;
}
function updateModuleResolutionCache(state: SolutionBuilderState, proj: ts.ResolvedConfigFileName, config: ts.ParsedCommandLine) {
    if (!state.moduleResolutionCache)
        return;
    // Update module resolution cache if needed
    const { moduleResolutionCache } = state;
    const projPath = toPath(state, proj);
    if (moduleResolutionCache.directoryToModuleNameMap.redirectsMap.size === 0) {
        // The own map will be for projectCompilerOptions
        ts.Debug.assert(moduleResolutionCache.moduleNameToDirectoryMap.redirectsMap.size === 0);
        moduleResolutionCache.directoryToModuleNameMap.redirectsMap.set(projPath, moduleResolutionCache.directoryToModuleNameMap.ownMap);
        moduleResolutionCache.moduleNameToDirectoryMap.redirectsMap.set(projPath, moduleResolutionCache.moduleNameToDirectoryMap.ownMap);
    }
    else {
        // Set correct own map
        ts.Debug.assert(moduleResolutionCache.moduleNameToDirectoryMap.redirectsMap.size > 0);
        const ref: ts.ResolvedProjectReference = {
            sourceFile: config.options.configFile!,
            commandLine: config
        };
        moduleResolutionCache.directoryToModuleNameMap.setOwnMap(moduleResolutionCache.directoryToModuleNameMap.getOrCreateMapOfCacheRedirects(ref));
        moduleResolutionCache.moduleNameToDirectoryMap.setOwnMap(moduleResolutionCache.moduleNameToDirectoryMap.getOrCreateMapOfCacheRedirects(ref));
    }
    moduleResolutionCache.directoryToModuleNameMap.setOwnOptions(config.options);
    moduleResolutionCache.moduleNameToDirectoryMap.setOwnOptions(config.options);
}
function checkConfigFileUpToDateStatus(state: SolutionBuilderState, configFile: string, oldestOutputFileTime: Date, oldestOutputFileName: string): ts.Status.OutOfDateWithSelf | undefined {
    // Check tsconfig time
    const tsconfigTime = state.host.getModifiedTime(configFile) || ts.missingFileModifiedTime;
    if (oldestOutputFileTime < tsconfigTime) {
        return {
            type: ts.UpToDateStatusType.OutOfDateWithSelf,
            outOfDateOutputFileName: oldestOutputFileName,
            newerInputFileName: configFile
        };
    }
}
function getUpToDateStatusWorker(state: SolutionBuilderState, project: ts.ParsedCommandLine, resolvedPath: ResolvedConfigFilePath): ts.UpToDateStatus {
    let newestInputFileName: string = undefined!;
    let newestInputFileTime = minimumDate;
    const { host } = state;
    // Get timestamps of input files
    for (const inputFile of project.fileNames) {
        if (!host.fileExists(inputFile)) {
            return {
                type: ts.UpToDateStatusType.Unbuildable,
                reason: `${inputFile} does not exist`
            };
        }
        const inputTime = host.getModifiedTime(inputFile) || ts.missingFileModifiedTime;
        if (inputTime > newestInputFileTime) {
            newestInputFileName = inputFile;
            newestInputFileTime = inputTime;
        }
    }
    // Container if no files are specified in the project
    if (!project.fileNames.length && !ts.canJsonReportNoInutFiles(project.raw)) {
        return {
            type: ts.UpToDateStatusType.ContainerOnly
        };
    }
    // Collect the expected outputs of this project
    const outputs = ts.getAllProjectOutputs(project, !host.useCaseSensitiveFileNames());
    // Now see if all outputs are newer than the newest input
    let oldestOutputFileName = "(none)";
    let oldestOutputFileTime = maximumDate;
    let newestOutputFileName = "(none)";
    let newestOutputFileTime = minimumDate;
    let missingOutputFileName: string | undefined;
    let newestDeclarationFileContentChangedTime = minimumDate;
    let isOutOfDateWithInputs = false;
    for (const output of outputs) {
        // Output is missing; can stop checking
        // Don't immediately return because we can still be upstream-blocked, which is a higher-priority status
        if (!host.fileExists(output)) {
            missingOutputFileName = output;
            break;
        }
        const outputTime = host.getModifiedTime(output) || ts.missingFileModifiedTime;
        if (outputTime < oldestOutputFileTime) {
            oldestOutputFileTime = outputTime;
            oldestOutputFileName = output;
        }
        // If an output is older than the newest input, we can stop checking
        // Don't immediately return because we can still be upstream-blocked, which is a higher-priority status
        if (outputTime < newestInputFileTime) {
            isOutOfDateWithInputs = true;
            break;
        }
        if (outputTime > newestOutputFileTime) {
            newestOutputFileTime = outputTime;
            newestOutputFileName = output;
        }
        // Keep track of when the most recent time a .d.ts file was changed.
        // In addition to file timestamps, we also keep track of when a .d.ts file
        // had its file touched but not had its contents changed - this allows us
        // to skip a downstream typecheck
        if (isDeclarationFile(output)) {
            const outputModifiedTime = host.getModifiedTime(output) || ts.missingFileModifiedTime;
            newestDeclarationFileContentChangedTime = newer(newestDeclarationFileContentChangedTime, outputModifiedTime);
        }
    }
    let pseudoUpToDate = false;
    let usesPrepend = false;
    let upstreamChangedProject: string | undefined;
    if (project.projectReferences) {
        state.projectStatus.set(resolvedPath, { type: ts.UpToDateStatusType.ComputingUpstream });
        for (const ref of project.projectReferences) {
            usesPrepend = usesPrepend || !!(ref.prepend);
            const resolvedRef = ts.resolveProjectReferencePath(ref);
            const resolvedRefPath = toResolvedConfigFilePath(state, resolvedRef);
            const refStatus = getUpToDateStatus(state, parseConfigFile(state, resolvedRef, resolvedRefPath), resolvedRefPath);
            // Its a circular reference ignore the status of this project
            if (refStatus.type === ts.UpToDateStatusType.ComputingUpstream ||
                refStatus.type === ts.UpToDateStatusType.ContainerOnly) { // Container only ignore this project
                continue;
            }
            // An upstream project is blocked
            if (refStatus.type === ts.UpToDateStatusType.Unbuildable ||
                refStatus.type === ts.UpToDateStatusType.UpstreamBlocked) {
                return {
                    type: ts.UpToDateStatusType.UpstreamBlocked,
                    upstreamProjectName: ref.path,
                    upstreamProjectBlocked: refStatus.type === ts.UpToDateStatusType.UpstreamBlocked
                };
            }
            // If the upstream project is out of date, then so are we (someone shouldn't have asked, though?)
            if (refStatus.type !== ts.UpToDateStatusType.UpToDate) {
                return {
                    type: ts.UpToDateStatusType.UpstreamOutOfDate,
                    upstreamProjectName: ref.path
                };
            }
            // Check oldest output file name only if there is no missing output file name
            if (!missingOutputFileName) {
                // If the upstream project's newest file is older than our oldest output, we
                // can't be out of date because of it
                if (refStatus.newestInputFileTime && refStatus.newestInputFileTime <= oldestOutputFileTime) {
                    continue;
                }
                // If the upstream project has only change .d.ts files, and we've built
                // *after* those files, then we're "psuedo up to date" and eligible for a fast rebuild
                if (refStatus.newestDeclarationFileContentChangedTime && refStatus.newestDeclarationFileContentChangedTime <= oldestOutputFileTime) {
                    pseudoUpToDate = true;
                    upstreamChangedProject = ref.path;
                    continue;
                }
                // We have an output older than an upstream output - we are out of date
                ts.Debug.assert(oldestOutputFileName !== undefined, "Should have an oldest output filename here");
                return {
                    type: ts.UpToDateStatusType.OutOfDateWithUpstream,
                    outOfDateOutputFileName: oldestOutputFileName,
                    newerProjectName: ref.path
                };
            }
        }
    }
    if (missingOutputFileName !== undefined) {
        return {
            type: ts.UpToDateStatusType.OutputMissing,
            missingOutputFileName
        };
    }
    if (isOutOfDateWithInputs) {
        return {
            type: ts.UpToDateStatusType.OutOfDateWithSelf,
            outOfDateOutputFileName: oldestOutputFileName,
            newerInputFileName: newestInputFileName
        };
    }
    else {
        // Check tsconfig time
        const configStatus = checkConfigFileUpToDateStatus(state, project.options.configFilePath!, oldestOutputFileTime, oldestOutputFileName);
        if (configStatus)
            return configStatus;
        // Check extended config time
        const extendedConfigStatus = ts.forEach(project.options.configFile!.extendedSourceFiles || ts.emptyArray, configFile => checkConfigFileUpToDateStatus(state, configFile, oldestOutputFileTime, oldestOutputFileName));
        if (extendedConfigStatus)
            return extendedConfigStatus;
    }
    if (!state.buildInfoChecked.has(resolvedPath)) {
        state.buildInfoChecked.set(resolvedPath, true);
        const buildInfoPath = ts.getTsBuildInfoEmitOutputFilePath(project.options);
        if (buildInfoPath) {
            const value = state.readFileWithCache(buildInfoPath);
            const buildInfo = value && ts.getBuildInfo(value);
            if (buildInfo && (buildInfo.bundle || buildInfo.program) && buildInfo.version !== ts.version) {
                return {
                    type: ts.UpToDateStatusType.TsVersionOutputOfDate,
                    version: buildInfo.version
                };
            }
        }
    }
    if (usesPrepend && pseudoUpToDate) {
        return {
            type: ts.UpToDateStatusType.OutOfDateWithPrepend,
            outOfDateOutputFileName: oldestOutputFileName,
            newerProjectName: upstreamChangedProject!
        };
    }
    // Up to date
    return {
        type: pseudoUpToDate ? ts.UpToDateStatusType.UpToDateWithUpstreamTypes : ts.UpToDateStatusType.UpToDate,
        newestDeclarationFileContentChangedTime,
        newestInputFileTime,
        newestOutputFileTime,
        newestInputFileName,
        newestOutputFileName,
        oldestOutputFileName
    };
}
function getUpToDateStatus(state: SolutionBuilderState, project: ts.ParsedCommandLine | undefined, resolvedPath: ResolvedConfigFilePath): ts.UpToDateStatus {
    if (project === undefined) {
        return { type: ts.UpToDateStatusType.Unbuildable, reason: "File deleted mid-build" };
    }
    const prior = state.projectStatus.get(resolvedPath);
    if (prior !== undefined) {
        return prior;
    }
    const actual = getUpToDateStatusWorker(state, project, resolvedPath);
    state.projectStatus.set(resolvedPath, actual);
    return actual;
}
function updateOutputTimestampsWorker(state: SolutionBuilderState, proj: ts.ParsedCommandLine, priorNewestUpdateTime: Date, verboseMessage: ts.DiagnosticMessage, skipOutputs?: FileMap<string>) {
    const { host } = state;
    const outputs = ts.getAllProjectOutputs(proj, !host.useCaseSensitiveFileNames());
    if (!skipOutputs || outputs.length !== skipOutputs.size) {
        let reportVerbose = !!state.options.verbose;
        const now = host.now ? host.now() : new Date();
        for (const file of outputs) {
            if (skipOutputs && skipOutputs.has(toPath(state, file))) {
                continue;
            }
            if (reportVerbose) {
                reportVerbose = false;
                reportStatus(state, verboseMessage, proj.options.configFilePath!);
            }
            if (isDeclarationFile(file)) {
                priorNewestUpdateTime = newer(priorNewestUpdateTime, host.getModifiedTime(file) || ts.missingFileModifiedTime);
            }
            host.setModifiedTime(file, now);
            listEmittedFile(state, proj, file);
        }
    }
    return priorNewestUpdateTime;
}
function updateOutputTimestamps(state: SolutionBuilderState, proj: ts.ParsedCommandLine, resolvedPath: ResolvedConfigFilePath) {
    if (state.options.dry) {
        return reportStatus(state, ts.Diagnostics.A_non_dry_build_would_update_timestamps_for_output_of_project_0, (proj.options.configFilePath!));
    }
    const priorNewestUpdateTime = updateOutputTimestampsWorker(state, proj, minimumDate, ts.Diagnostics.Updating_output_timestamps_of_project_0);
    state.projectStatus.set(resolvedPath, {
        type: ts.UpToDateStatusType.UpToDate,
        newestDeclarationFileContentChangedTime: priorNewestUpdateTime,
        oldestOutputFileName: ts.getFirstProjectOutput(proj, !state.host.useCaseSensitiveFileNames())
    });
}
function queueReferencingProjects(state: SolutionBuilderState, project: ts.ResolvedConfigFileName, projectPath: ResolvedConfigFilePath, projectIndex: number, config: ts.ParsedCommandLine, buildOrder: readonly ts.ResolvedConfigFileName[], buildResult: BuildResultFlags) {
    // Queue only if there are no errors
    if (buildResult & BuildResultFlags.AnyErrors)
        return;
    // Only composite projects can be referenced by other projects
    if (!config.options.composite)
        return;
    // Always use build order to queue projects
    for (let index = projectIndex + 1; index < buildOrder.length; index++) {
        const nextProject = buildOrder[index];
        const nextProjectPath = toResolvedConfigFilePath(state, nextProject);
        if (state.projectPendingBuild.has(nextProjectPath))
            continue;
        const nextProjectConfig = parseConfigFile(state, nextProject, nextProjectPath);
        if (!nextProjectConfig || !nextProjectConfig.projectReferences)
            continue;
        for (const ref of nextProjectConfig.projectReferences) {
            const resolvedRefPath = resolveProjectName(state, ref.path);
            if (toResolvedConfigFilePath(state, resolvedRefPath) !== projectPath)
                continue;
            // If the project is referenced with prepend, always build downstream projects,
            // If declaration output is changed, build the project
            // otherwise mark the project UpToDateWithUpstreamTypes so it updates output time stamps
            const status = state.projectStatus.get(nextProjectPath);
            if (status) {
                switch (status.type) {
                    case ts.UpToDateStatusType.UpToDate:
                        if (buildResult & BuildResultFlags.DeclarationOutputUnchanged) {
                            if (ref.prepend) {
                                state.projectStatus.set(nextProjectPath, {
                                    type: ts.UpToDateStatusType.OutOfDateWithPrepend,
                                    outOfDateOutputFileName: status.oldestOutputFileName,
                                    newerProjectName: project
                                });
                            }
                            else {
                                status.type = ts.UpToDateStatusType.UpToDateWithUpstreamTypes;
                            }
                            break;
                        }
                    // falls through
                    case ts.UpToDateStatusType.UpToDateWithUpstreamTypes:
                    case ts.UpToDateStatusType.OutOfDateWithPrepend:
                        if (!(buildResult & BuildResultFlags.DeclarationOutputUnchanged)) {
                            state.projectStatus.set(nextProjectPath, {
                                type: ts.UpToDateStatusType.OutOfDateWithUpstream,
                                outOfDateOutputFileName: status.type === ts.UpToDateStatusType.OutOfDateWithPrepend ? status.outOfDateOutputFileName : status.oldestOutputFileName,
                                newerProjectName: project
                            });
                        }
                        break;
                    case ts.UpToDateStatusType.UpstreamBlocked:
                        if (toResolvedConfigFilePath(state, resolveProjectName(state, status.upstreamProjectName)) === projectPath) {
                            clearProjectStatus(state, nextProjectPath);
                        }
                        break;
                }
            }
            addProjToQueue(state, nextProjectPath, ts.ConfigFileProgramReloadLevel.None);
            break;
        }
    }
}
function build(state: SolutionBuilderState, project?: string, cancellationToken?: ts.CancellationToken, onlyReferences?: boolean): ts.ExitStatus {
    const buildOrder = getBuildOrderFor(state, project, onlyReferences);
    if (!buildOrder)
        return ts.ExitStatus.InvalidProject_OutputsSkipped;
    setupInitialBuild(state, cancellationToken);
    let reportQueue = true;
    let successfulProjects = 0;
    while (true) {
        const invalidatedProject = getNextInvalidatedProject(state, buildOrder, reportQueue);
        if (!invalidatedProject)
            break;
        reportQueue = false;
        invalidatedProject.done(cancellationToken);
        if (!state.diagnostics.has(invalidatedProject.projectPath))
            successfulProjects++;
    }
    disableCache(state);
    reportErrorSummary(state, buildOrder);
    startWatching(state, buildOrder);
    return isCircularBuildOrder(buildOrder)
        ? ts.ExitStatus.ProjectReferenceCycle_OutputsSkipped
        : !buildOrder.some(p => state.diagnostics.has(toResolvedConfigFilePath(state, p)))
            ? ts.ExitStatus.Success
            : successfulProjects
                ? ts.ExitStatus.DiagnosticsPresent_OutputsGenerated
                : ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
}
function clean(state: SolutionBuilderState, project?: string, onlyReferences?: boolean) {
    const buildOrder = getBuildOrderFor(state, project, onlyReferences);
    if (!buildOrder)
        return ts.ExitStatus.InvalidProject_OutputsSkipped;
    if (isCircularBuildOrder(buildOrder)) {
        reportErrors(state, buildOrder.circularDiagnostics);
        return ts.ExitStatus.ProjectReferenceCycle_OutputsSkipped;
    }
    const { options, host } = state;
    const filesToDelete = options.dry ? [] as string[] : undefined;
    for (const proj of buildOrder) {
        const resolvedPath = toResolvedConfigFilePath(state, proj);
        const parsed = parseConfigFile(state, proj, resolvedPath);
        if (parsed === undefined) {
            // File has gone missing; fine to ignore here
            reportParseConfigFileDiagnostic(state, resolvedPath);
            continue;
        }
        const outputs = ts.getAllProjectOutputs(parsed, !host.useCaseSensitiveFileNames());
        for (const output of outputs) {
            if (host.fileExists(output)) {
                if (filesToDelete) {
                    filesToDelete.push(output);
                }
                else {
                    host.deleteFile(output);
                    invalidateProject(state, resolvedPath, ts.ConfigFileProgramReloadLevel.None);
                }
            }
        }
    }
    if (filesToDelete) {
        reportStatus(state, ts.Diagnostics.A_non_dry_build_would_delete_the_following_files_Colon_0, filesToDelete.map(f => `\r\n * ${f}`).join(""));
    }
    return ts.ExitStatus.Success;
}
function invalidateProject(state: SolutionBuilderState, resolved: ResolvedConfigFilePath, reloadLevel: ts.ConfigFileProgramReloadLevel) {
    // If host implements getParsedCommandLine, we cant get list of files from parseConfigFileHost
    if (state.host.getParsedCommandLine && reloadLevel === ts.ConfigFileProgramReloadLevel.Partial) {
        reloadLevel = ts.ConfigFileProgramReloadLevel.Full;
    }
    if (reloadLevel === ts.ConfigFileProgramReloadLevel.Full) {
        state.configFileCache.delete(resolved);
        state.buildOrder = undefined;
    }
    state.needsSummary = true;
    clearProjectStatus(state, resolved);
    addProjToQueue(state, resolved, reloadLevel);
    enableCache(state);
}
function invalidateProjectAndScheduleBuilds(state: SolutionBuilderState, resolvedPath: ResolvedConfigFilePath, reloadLevel: ts.ConfigFileProgramReloadLevel) {
    state.reportFileChangeDetected = true;
    invalidateProject(state, resolvedPath, reloadLevel);
    scheduleBuildInvalidatedProject(state);
}
function scheduleBuildInvalidatedProject(state: SolutionBuilderState) {
    const { hostWithWatch } = state;
    if (!hostWithWatch.setTimeout || !hostWithWatch.clearTimeout) {
        return;
    }
    if (state.timerToBuildInvalidatedProject) {
        hostWithWatch.clearTimeout(state.timerToBuildInvalidatedProject);
    }
    state.timerToBuildInvalidatedProject = hostWithWatch.setTimeout(buildNextInvalidatedProject, 250, state);
}
function buildNextInvalidatedProject(state: SolutionBuilderState) {
    state.timerToBuildInvalidatedProject = undefined;
    if (state.reportFileChangeDetected) {
        state.reportFileChangeDetected = false;
        state.projectErrorsReported.clear();
        reportWatchStatus(state, ts.Diagnostics.File_change_detected_Starting_incremental_compilation);
    }
    const buildOrder = getBuildOrder(state);
    const invalidatedProject = getNextInvalidatedProject(state, buildOrder, /*reportQueue*/ false);
    if (invalidatedProject) {
        invalidatedProject.done();
        if (state.projectPendingBuild.size) {
            // Schedule next project for build
            if (state.watch && !state.timerToBuildInvalidatedProject) {
                scheduleBuildInvalidatedProject(state);
            }
            return;
        }
    }
    disableCache(state);
    reportErrorSummary(state, buildOrder);
}
function watchConfigFile(state: SolutionBuilderState, resolved: ts.ResolvedConfigFileName, resolvedPath: ResolvedConfigFilePath, parsed: ts.ParsedCommandLine | undefined) {
    if (!state.watch || state.allWatchedConfigFiles.has(resolvedPath))
        return;
    state.allWatchedConfigFiles.set(resolvedPath, state.watchFile(state.hostWithWatch, resolved, () => {
        invalidateProjectAndScheduleBuilds(state, resolvedPath, ts.ConfigFileProgramReloadLevel.Full);
    }, ts.PollingInterval.High, parsed?.watchOptions, ts.WatchType.ConfigFile, resolved));
}
function isSameFile(state: SolutionBuilderState, file1: string, file2: string) {
    return ts.comparePaths(file1, file2, state.currentDirectory, !state.host.useCaseSensitiveFileNames()) === ts.Comparison.EqualTo;
}
function isOutputFile(state: SolutionBuilderState, fileName: string, configFile: ts.ParsedCommandLine) {
    if (configFile.options.noEmit)
        return false;
    // ts or tsx files are not output
    if (!ts.fileExtensionIs(fileName, ts.Extension.Dts) &&
        (ts.fileExtensionIs(fileName, ts.Extension.Ts) || ts.fileExtensionIs(fileName, ts.Extension.Tsx))) {
        return false;
    }
    // If options have --outFile or --out, check if its that
    const out = configFile.options.outFile || configFile.options.out;
    if (out && (isSameFile(state, fileName, out) || isSameFile(state, fileName, ts.removeFileExtension(out) + ts.Extension.Dts))) {
        return true;
    }
    // If declarationDir is specified, return if its a file in that directory
    if (configFile.options.declarationDir && ts.containsPath(configFile.options.declarationDir, fileName, state.currentDirectory, !state.host.useCaseSensitiveFileNames())) {
        return true;
    }
    // If --outDir, check if file is in that directory
    if (configFile.options.outDir && ts.containsPath(configFile.options.outDir, fileName, state.currentDirectory, !state.host.useCaseSensitiveFileNames())) {
        return true;
    }
    return !ts.forEach(configFile.fileNames, inputFile => isSameFile(state, fileName, inputFile));
}
function watchWildCardDirectories(state: SolutionBuilderState, resolved: ts.ResolvedConfigFileName, resolvedPath: ResolvedConfigFilePath, parsed: ts.ParsedCommandLine) {
    if (!state.watch)
        return;
    ts.updateWatchingWildcardDirectories(getOrCreateValueMapFromConfigFileMap(state.allWatchedWildcardDirectories, resolvedPath), ts.createMapFromTemplate(parsed.configFileSpecs!.wildcardDirectories), (dir, flags) => state.watchDirectory(state.hostWithWatch, dir, fileOrDirectory => {
        const fileOrDirectoryPath = toPath(state, fileOrDirectory);
        if (fileOrDirectoryPath !== toPath(state, dir) && ts.hasExtension(fileOrDirectoryPath) && !ts.isSupportedSourceFileName(fileOrDirectory, parsed.options)) {
            state.writeLog(`Project: ${resolved} Detected file add/remove of non supported extension: ${fileOrDirectory}`);
            return;
        }
        if (isOutputFile(state, fileOrDirectory, parsed)) {
            state.writeLog(`${fileOrDirectory} is output file`);
            return;
        }
        invalidateProjectAndScheduleBuilds(state, resolvedPath, ts.ConfigFileProgramReloadLevel.Partial);
    }, flags, parsed?.watchOptions, ts.WatchType.WildcardDirectory, resolved));
}
function watchInputFiles(state: SolutionBuilderState, resolved: ts.ResolvedConfigFileName, resolvedPath: ResolvedConfigFilePath, parsed: ts.ParsedCommandLine) {
    if (!state.watch)
        return;
    ts.mutateMap(getOrCreateValueMapFromConfigFileMap(state.allWatchedInputFiles, resolvedPath), ts.arrayToMap(parsed.fileNames, fileName => toPath(state, fileName)), {
        createNewValue: (path, input) => state.watchFilePath(state.hostWithWatch, input, () => invalidateProjectAndScheduleBuilds(state, resolvedPath, ts.ConfigFileProgramReloadLevel.None), ts.PollingInterval.Low, parsed?.watchOptions, (path as ts.Path), ts.WatchType.SourceFile, resolved),
        onDeleteValue: ts.closeFileWatcher,
    });
}
function startWatching(state: SolutionBuilderState, buildOrder: AnyBuildOrder) {
    if (!state.watchAllProjectsPending)
        return;
    state.watchAllProjectsPending = false;
    for (const resolved of getBuildOrderFromAnyBuildOrder(buildOrder)) {
        const resolvedPath = toResolvedConfigFilePath(state, resolved);
        const cfg = parseConfigFile(state, resolved, resolvedPath);
        // Watch this file
        watchConfigFile(state, resolved, resolvedPath, cfg);
        if (cfg) {
            // Update watchers for wildcard directories
            watchWildCardDirectories(state, resolved, resolvedPath, cfg);
            // Watch input files
            watchInputFiles(state, resolved, resolvedPath, cfg);
        }
    }
}
/**
 * A SolutionBuilder has an immutable set of rootNames that are the "entry point" projects, but
 * can dynamically add/remove other projects based on changes on the rootNames' references
 */
function createSolutionBuilderWorker<T extends ts.BuilderProgram>(watch: false, host: SolutionBuilderHost<T>, rootNames: readonly string[], defaultOptions: BuildOptions): SolutionBuilder<T>;
function createSolutionBuilderWorker<T extends ts.BuilderProgram>(watch: true, host: SolutionBuilderWithWatchHost<T>, rootNames: readonly string[], defaultOptions: BuildOptions, baseWatchOptions?: ts.WatchOptions): SolutionBuilder<T>;
function createSolutionBuilderWorker<T extends ts.BuilderProgram>(watch: boolean, hostOrHostWithWatch: SolutionBuilderHost<T> | SolutionBuilderWithWatchHost<T>, rootNames: readonly string[], options: BuildOptions, baseWatchOptions?: ts.WatchOptions): SolutionBuilder<T> {
    const state = createSolutionBuilderState(watch, hostOrHostWithWatch, rootNames, options, baseWatchOptions);
    return {
        build: (project, cancellationToken) => build(state, project, cancellationToken),
        clean: project => clean(state, project),
        buildReferences: (project, cancellationToken) => build(state, project, cancellationToken, /*onlyReferences*/ true),
        cleanReferences: project => clean(state, project, /*onlyReferences*/ true),
        getNextInvalidatedProject: cancellationToken => {
            setupInitialBuild(state, cancellationToken);
            return getNextInvalidatedProject(state, getBuildOrder(state), /*reportQueue*/ false);
        },
        getBuildOrder: () => getBuildOrder(state),
        getUpToDateStatusOfProject: project => {
            const configFileName = resolveProjectName(state, project);
            const configFilePath = toResolvedConfigFilePath(state, configFileName);
            return getUpToDateStatus(state, parseConfigFile(state, configFileName, configFilePath), configFilePath);
        },
        invalidateProject: (configFilePath, reloadLevel) => invalidateProject(state, configFilePath, reloadLevel || ts.ConfigFileProgramReloadLevel.None),
        buildNextInvalidatedProject: () => buildNextInvalidatedProject(state),
        getAllParsedConfigs: () => ts.arrayFrom(ts.mapDefinedIterator(state.configFileCache.values(), config => isParsedCommandLine(config) ? config : undefined)),
    };
}
function relName(state: SolutionBuilderState, path: string): string {
    return ts.convertToRelativePath(path, state.currentDirectory, f => state.getCanonicalFileName(f));
}
function reportStatus(state: SolutionBuilderState, message: ts.DiagnosticMessage, ...args: string[]) {
    state.host.reportSolutionBuilderStatus(ts.createCompilerDiagnostic(message, ...args));
}
function reportWatchStatus(state: SolutionBuilderState, message: ts.DiagnosticMessage, ...args: (string | number | undefined)[]) {
    if (state.hostWithWatch.onWatchStatusChange) {
        state.hostWithWatch.onWatchStatusChange(ts.createCompilerDiagnostic(message, ...args), state.host.getNewLine(), state.baseCompilerOptions);
    }
}
function reportErrors({ host }: SolutionBuilderState, errors: readonly ts.Diagnostic[]) {
    errors.forEach(err => host.reportDiagnostic(err));
}
function reportAndStoreErrors(state: SolutionBuilderState, proj: ResolvedConfigFilePath, errors: readonly ts.Diagnostic[]) {
    reportErrors(state, errors);
    state.projectErrorsReported.set(proj, true);
    if (errors.length) {
        state.diagnostics.set(proj, errors);
    }
}
function reportParseConfigFileDiagnostic(state: SolutionBuilderState, proj: ResolvedConfigFilePath) {
    reportAndStoreErrors(state, proj, [(state.configFileCache.get(proj) as ts.Diagnostic)]);
}
function reportErrorSummary(state: SolutionBuilderState, buildOrder: AnyBuildOrder) {
    if (!state.needsSummary)
        return;
    state.needsSummary = false;
    const canReportSummary = state.watch || !!state.host.reportErrorSummary;
    const { diagnostics } = state;
    let totalErrors = 0;
    if (isCircularBuildOrder(buildOrder)) {
        reportBuildQueue(state, buildOrder.buildOrder);
        reportErrors(state, buildOrder.circularDiagnostics);
        if (canReportSummary)
            totalErrors += ts.getErrorCountForSummary(buildOrder.circularDiagnostics);
    }
    else {
        // Report errors from the other projects
        buildOrder.forEach(project => {
            const projectPath = toResolvedConfigFilePath(state, project);
            if (!state.projectErrorsReported.has(projectPath)) {
                reportErrors(state, diagnostics.get(projectPath) || ts.emptyArray);
            }
        });
        if (canReportSummary)
            diagnostics.forEach(singleProjectErrors => totalErrors += ts.getErrorCountForSummary(singleProjectErrors));
    }
    if (state.watch) {
        reportWatchStatus(state, ts.getWatchErrorSummaryDiagnosticMessage(totalErrors), totalErrors);
    }
    else if (state.host.reportErrorSummary) {
        state.host.reportErrorSummary(totalErrors);
    }
}
/**
 * Report the build ordering inferred from the current project graph if we're in verbose mode
 */
function reportBuildQueue(state: SolutionBuilderState, buildQueue: readonly ts.ResolvedConfigFileName[]) {
    if (state.options.verbose) {
        reportStatus(state, ts.Diagnostics.Projects_in_this_build_Colon_0, buildQueue.map(s => "\r\n    * " + relName(state, s)).join(""));
    }
}
function reportUpToDateStatus(state: SolutionBuilderState, configFileName: string, status: ts.UpToDateStatus) {
    switch (status.type) {
        case ts.UpToDateStatusType.OutOfDateWithSelf:
            return reportStatus(state, ts.Diagnostics.Project_0_is_out_of_date_because_oldest_output_1_is_older_than_newest_input_2, relName(state, configFileName), relName(state, status.outOfDateOutputFileName), relName(state, status.newerInputFileName));
        case ts.UpToDateStatusType.OutOfDateWithUpstream:
            return reportStatus(state, ts.Diagnostics.Project_0_is_out_of_date_because_oldest_output_1_is_older_than_newest_input_2, relName(state, configFileName), relName(state, status.outOfDateOutputFileName), relName(state, status.newerProjectName));
        case ts.UpToDateStatusType.OutputMissing:
            return reportStatus(state, ts.Diagnostics.Project_0_is_out_of_date_because_output_file_1_does_not_exist, relName(state, configFileName), relName(state, status.missingOutputFileName));
        case ts.UpToDateStatusType.UpToDate:
            if (status.newestInputFileTime !== undefined) {
                return reportStatus(state, ts.Diagnostics.Project_0_is_up_to_date_because_newest_input_1_is_older_than_oldest_output_2, relName(state, configFileName), relName(state, status.newestInputFileName || ""), relName(state, status.oldestOutputFileName || ""));
            }
            // Don't report anything for "up to date because it was already built" -- too verbose
            break;
        case ts.UpToDateStatusType.OutOfDateWithPrepend:
            return reportStatus(state, ts.Diagnostics.Project_0_is_out_of_date_because_output_of_its_dependency_1_has_changed, relName(state, configFileName), relName(state, status.newerProjectName));
        case ts.UpToDateStatusType.UpToDateWithUpstreamTypes:
            return reportStatus(state, ts.Diagnostics.Project_0_is_up_to_date_with_d_ts_files_from_its_dependencies, relName(state, configFileName));
        case ts.UpToDateStatusType.UpstreamOutOfDate:
            return reportStatus(state, ts.Diagnostics.Project_0_is_out_of_date_because_its_dependency_1_is_out_of_date, relName(state, configFileName), relName(state, status.upstreamProjectName));
        case ts.UpToDateStatusType.UpstreamBlocked:
            return reportStatus(state, status.upstreamProjectBlocked ?
                ts.Diagnostics.Project_0_can_t_be_built_because_its_dependency_1_was_not_built :
                ts.Diagnostics.Project_0_can_t_be_built_because_its_dependency_1_has_errors, relName(state, configFileName), relName(state, status.upstreamProjectName));
        case ts.UpToDateStatusType.Unbuildable:
            return reportStatus(state, ts.Diagnostics.Failed_to_parse_file_0_Colon_1, relName(state, configFileName), status.reason);
        case ts.UpToDateStatusType.TsVersionOutputOfDate:
            return reportStatus(state, ts.Diagnostics.Project_0_is_out_of_date_because_output_for_it_was_generated_with_version_1_that_differs_with_current_version_2, relName(state, configFileName), status.version, ts.version);
        case ts.UpToDateStatusType.ContainerOnly:
        // Don't report status on "solution" projects
        // falls through
        case ts.UpToDateStatusType.ComputingUpstream:
            // Should never leak from getUptoDateStatusWorker
            break;
        default:
            ts.assertType<never>(status);
    }
}
/**
 * Report the up-to-date status of a project if we're in verbose mode
 */
function verboseReportProjectStatus(state: SolutionBuilderState, configFileName: string, status: ts.UpToDateStatus) {
    if (state.options.verbose) {
        reportUpToDateStatus(state, configFileName, status);
    }
}
