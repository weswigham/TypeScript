import * as ts from "./ts";
export interface ReadBuildProgramHost {
    useCaseSensitiveFileNames(): boolean;
    getCurrentDirectory(): string;
    readFile(fileName: string): string | undefined;
}
export function readBuilderProgram(compilerOptions: ts.CompilerOptions, host: ReadBuildProgramHost) {
    if (compilerOptions.out || compilerOptions.outFile)
        return undefined;
    const buildInfoPath = ts.getTsBuildInfoEmitOutputFilePath(compilerOptions);
    if (!buildInfoPath)
        return undefined;
    const content = host.readFile(buildInfoPath);
    if (!content)
        return undefined;
    const buildInfo = ts.getBuildInfo(content);
    if (buildInfo.version !== ts.version)
        return undefined;
    if (!buildInfo.program)
        return undefined;
    return ts.createBuildProgramUsingProgramBuildInfo(buildInfo.program, buildInfoPath, host);
}
export function createIncrementalCompilerHost(options: ts.CompilerOptions, system = ts.sys): ts.CompilerHost {
    const host = ts.createCompilerHostWorker(options, /*setParentNodes*/ undefined, system);
    host.createHash = ts.maybeBind(system, system.createHash);
    ts.setGetSourceFileAsHashVersioned(host, system);
    ts.changeCompilerHostLikeToUseCache(host, fileName => ts.toPath(fileName, host.getCurrentDirectory(), host.getCanonicalFileName));
    return host;
}
export interface IncrementalProgramOptions<T extends ts.BuilderProgram> {
    rootNames: readonly string[];
    options: ts.CompilerOptions;
    configFileParsingDiagnostics?: readonly ts.Diagnostic[];
    projectReferences?: readonly ts.ProjectReference[];
    host?: ts.CompilerHost;
    createProgram?: CreateProgram<T>;
}
export function createIncrementalProgram<T extends ts.BuilderProgram = ts.EmitAndSemanticDiagnosticsBuilderProgram>({ rootNames, options, configFileParsingDiagnostics, projectReferences, host, createProgram }: IncrementalProgramOptions<T>): T {
    host = host || createIncrementalCompilerHost(options);
    createProgram = createProgram || (ts.createEmitAndSemanticDiagnosticsBuilderProgram as any as CreateProgram<T>);
    const oldProgram = readBuilderProgram(options, host) as any as T;
    return createProgram(rootNames, options, host, oldProgram, configFileParsingDiagnostics, projectReferences);
}
export type WatchStatusReporter = (diagnostic: ts.Diagnostic, newLine: string, options: ts.CompilerOptions, errorCount?: number) => void;
/** Create the program with rootNames and options, if they are undefined, oldProgram and new configFile diagnostics create new program */
export type CreateProgram<T extends ts.BuilderProgram> = (rootNames: readonly string[] | undefined, options: ts.CompilerOptions | undefined, host?: ts.CompilerHost, oldProgram?: T, configFileParsingDiagnostics?: readonly ts.Diagnostic[], projectReferences?: readonly ts.ProjectReference[] | undefined) => T;
/** Host that has watch functionality used in --watch mode */
export interface WatchHost {
    /** If provided, called with Diagnostic message that informs about change in watch status */
    onWatchStatusChange?(diagnostic: ts.Diagnostic, newLine: string, options: ts.CompilerOptions, errorCount?: number): void;
    /** Used to watch changes in source files, missing files needed to update the program or config file */
    watchFile(path: string, callback: ts.FileWatcherCallback, pollingInterval?: number, options?: ts.CompilerOptions): ts.FileWatcher;
    /** Used to watch resolved module's failed lookup locations, config file specs, type roots where auto type reference directives are added */
    watchDirectory(path: string, callback: ts.DirectoryWatcherCallback, recursive?: boolean, options?: ts.CompilerOptions): ts.FileWatcher;
    /** If provided, will be used to set delayed compilation, so that multiple changes in short span are compiled together */
    setTimeout?(callback: (...args: any[]) => void, ms: number, ...args: any[]): any;
    /** If provided, will be used to reset existing delayed compilation */
    clearTimeout?(timeoutId: any): void;
}
export interface ProgramHost<T extends ts.BuilderProgram> {
    /**
     * Used to create the program when need for program creation or recreation detected
     */
    createProgram: CreateProgram<T>;
    // Sub set of compiler host methods to read and generate new program
    useCaseSensitiveFileNames(): boolean;
    getNewLine(): string;
    getCurrentDirectory(): string;
    getDefaultLibFileName(options: ts.CompilerOptions): string;
    getDefaultLibLocation?(): string;
    createHash?(data: string): string;
    /**
     * Use to check file presence for source files and
     * if resolveModuleNames is not provided (complier is in charge of module resolution) then module files as well
     */
    fileExists(path: string): boolean;
    /**
     * Use to read file text for source files and
     * if resolveModuleNames is not provided (complier is in charge of module resolution) then module files as well
     */
    readFile(path: string, encoding?: string): string | undefined;
    /** If provided, used for module resolution as well as to handle directory structure */
    directoryExists?(path: string): boolean;
    /** If provided, used in resolutions as well as handling directory structure */
    getDirectories?(path: string): string[];
    /** If provided, used to cache and handle directory structure modifications */
    readDirectory?(path: string, extensions?: readonly string[], exclude?: readonly string[], include?: readonly string[], depth?: number): string[];
    /** Symbol links resolution */
    realpath?(path: string): string;
    /** If provided would be used to write log about compilation */
    trace?(s: string): void;
    /** If provided is used to get the environment variable */
    getEnvironmentVariable?(name: string): string | undefined;
    /** If provided, used to resolve the module names, otherwise typescript's default module resolution */
    resolveModuleNames?(moduleNames: string[], containingFile: string, reusedNames: string[] | undefined, redirectedReference: ts.ResolvedProjectReference | undefined, options: ts.CompilerOptions): (ts.ResolvedModule | undefined)[];
    /** If provided, used to resolve type reference directives, otherwise typescript's default resolution */
    resolveTypeReferenceDirectives?(typeReferenceDirectiveNames: string[], containingFile: string, redirectedReference: ts.ResolvedProjectReference | undefined, options: ts.CompilerOptions): (ts.ResolvedTypeReferenceDirective | undefined)[];
}
/** Internal interface used to wire emit through same host */
/*@internal*/
export interface ProgramHost<T extends ts.BuilderProgram> {
    // TODO: GH#18217 Optional methods are frequently asserted
    createDirectory?(path: string): void;
    writeFile?(path: string, data: string, writeByteOrderMark?: boolean): void;
    onCachedDirectoryStructureHostCreate?(host: ts.CachedDirectoryStructureHost): void;
}
export interface WatchCompilerHost<T extends ts.BuilderProgram> extends ProgramHost<T>, WatchHost {
    /** If provided, callback to invoke after every new program creation */
    afterProgramCreate?(program: T): void;
    // Only for testing
    /*@internal*/
    maxNumberOfFilesToIterateForInvalidation?: number;
}
/**
 * Host to create watch with root files and options
 */
export interface WatchCompilerHostOfFilesAndCompilerOptions<T extends ts.BuilderProgram> extends WatchCompilerHost<T> {
    /** root files to use to generate program */
    rootFiles: string[];
    /** Compiler options */
    options: ts.CompilerOptions;
    watchOptions?: ts.WatchOptions;
    /** Project References */
    projectReferences?: readonly ts.ProjectReference[];
}
/**
 * Host to create watch with config file
 */
export interface WatchCompilerHostOfConfigFile<T extends ts.BuilderProgram> extends WatchCompilerHost<T>, ts.ConfigFileDiagnosticsReporter {
    /** Name of the config file to compile */
    configFileName: string;
    /** Options to extend */
    optionsToExtend?: ts.CompilerOptions;
    watchOptionsToExtend?: ts.WatchOptions;
    /**
     * Used to generate source file names from the config file and its include, exclude, files rules
     * and also to cache the directory stucture
     */
    readDirectory(path: string, extensions?: readonly string[], exclude?: readonly string[], include?: readonly string[], depth?: number): string[];
}
/**
 * Host to create watch with config file that is already parsed (from tsc)
 */
/*@internal*/
export interface WatchCompilerHostOfConfigFile<T extends ts.BuilderProgram> extends WatchCompilerHost<T> {
    configFileParsingResult?: ts.ParsedCommandLine;
}
export interface Watch<T> {
    /** Synchronize with host and get updated program */
    getProgram(): T;
    /** Gets the existing program without synchronizing with changes on host */
    /*@internal*/
    getCurrentProgram(): T;
    /** Closes the watch */
    close(): void;
}
/**
 * Creates the watch what generates program using the config file
 */
export interface WatchOfConfigFile<T> extends Watch<T> {
}
/**
 * Creates the watch that generates program using the root files and compiler options
 */
export interface WatchOfFilesAndCompilerOptions<T> extends Watch<T> {
    /** Updates the root files in the program, only if this is not config file compilation */
    updateRootFileNames(fileNames: string[]): void;
}
/**
 * Create the watch compiler host for either configFile or fileNames and its options
 */
export function createWatchCompilerHost<T extends ts.BuilderProgram>(configFileName: string, optionsToExtend: ts.CompilerOptions | undefined, system: ts.System, createProgram?: CreateProgram<T>, reportDiagnostic?: ts.DiagnosticReporter, reportWatchStatus?: WatchStatusReporter, watchOptionsToExtend?: ts.WatchOptions): WatchCompilerHostOfConfigFile<T>;
export function createWatchCompilerHost<T extends ts.BuilderProgram>(rootFiles: string[], options: ts.CompilerOptions, system: ts.System, createProgram?: CreateProgram<T>, reportDiagnostic?: ts.DiagnosticReporter, reportWatchStatus?: WatchStatusReporter, projectReferences?: readonly ts.ProjectReference[], watchOptions?: ts.WatchOptions): WatchCompilerHostOfFilesAndCompilerOptions<T>;
export function createWatchCompilerHost<T extends ts.BuilderProgram>(rootFilesOrConfigFileName: string | string[], options: ts.CompilerOptions | undefined, system: ts.System, createProgram?: CreateProgram<T>, reportDiagnostic?: ts.DiagnosticReporter, reportWatchStatus?: WatchStatusReporter, projectReferencesOrWatchOptionsToExtend?: readonly ts.ProjectReference[] | ts.WatchOptions, watchOptions?: ts.WatchOptions): WatchCompilerHostOfFilesAndCompilerOptions<T> | WatchCompilerHostOfConfigFile<T> {
    if (ts.isArray(rootFilesOrConfigFileName)) {
        return ts.createWatchCompilerHostOfFilesAndCompilerOptions(rootFilesOrConfigFileName, (options!), watchOptions, system, createProgram, reportDiagnostic, reportWatchStatus, (projectReferencesOrWatchOptionsToExtend as readonly ts.ProjectReference[])); // TODO: GH#18217
    }
    else {
        return ts.createWatchCompilerHostOfConfigFile(rootFilesOrConfigFileName, options, (projectReferencesOrWatchOptionsToExtend as ts.WatchOptions), system, createProgram, reportDiagnostic, reportWatchStatus);
    }
}
/**
 * Creates the watch from the host for root files and compiler options
 */
export function createWatchProgram<T extends ts.BuilderProgram>(host: WatchCompilerHostOfFilesAndCompilerOptions<T>): WatchOfFilesAndCompilerOptions<T>;
/**
 * Creates the watch from the host for config file
 */
export function createWatchProgram<T extends ts.BuilderProgram>(host: WatchCompilerHostOfConfigFile<T>): WatchOfConfigFile<T>;
export function createWatchProgram<T extends ts.BuilderProgram>(host: WatchCompilerHostOfFilesAndCompilerOptions<T> & WatchCompilerHostOfConfigFile<T>): WatchOfFilesAndCompilerOptions<T> | WatchOfConfigFile<T> {
    interface FilePresentOnHost {
        version: string;
        sourceFile: ts.SourceFile;
        fileWatcher: ts.FileWatcher;
    }
    type FileMissingOnHost = false;
    interface FilePresenceUnknownOnHost {
        version: false;
        fileWatcher?: ts.FileWatcher;
    }
    type FileMayBePresentOnHost = FilePresentOnHost | FilePresenceUnknownOnHost;
    type HostFileInfo = FilePresentOnHost | FileMissingOnHost | FilePresenceUnknownOnHost;
    let builderProgram: T;
    let reloadLevel: ts.ConfigFileProgramReloadLevel; // level to indicate if the program needs to be reloaded from config file/just filenames etc
    let missingFilesMap: ts.Map<ts.FileWatcher>; // Map of file watchers for the missing files
    let watchedWildcardDirectories: ts.Map<ts.WildcardDirectoryWatcher>; // map of watchers for the wild card directories in the config file
    let timerToUpdateProgram: any; // timer callback to recompile the program
    const sourceFilesCache = ts.createMap<HostFileInfo>(); // Cache that stores the source file and version info
    let missingFilePathsRequestedForRelease: ts.Path[] | undefined; // These paths are held temparirly so that we can remove the entry from source file cache if the file is not tracked by missing files
    let hasChangedCompilerOptions = false; // True if the compiler options have changed between compilations
    let hasChangedAutomaticTypeDirectiveNames = false; // True if the automatic type directives have changed
    const useCaseSensitiveFileNames = host.useCaseSensitiveFileNames();
    const currentDirectory = host.getCurrentDirectory();
    const { configFileName, optionsToExtend: optionsToExtendForConfigFile = {}, watchOptionsToExtend, createProgram } = host;
    let { rootFiles: rootFileNames, options: compilerOptions, watchOptions, projectReferences } = host;
    let configFileSpecs: ts.ConfigFileSpecs;
    let configFileParsingDiagnostics: ts.Diagnostic[] | undefined;
    let canConfigFileJsonReportNoInputFiles = false;
    let hasChangedConfigFileParsingErrors = false;
    const cachedDirectoryStructureHost = configFileName === undefined ? undefined : ts.createCachedDirectoryStructureHost(host, currentDirectory, useCaseSensitiveFileNames);
    if (cachedDirectoryStructureHost && host.onCachedDirectoryStructureHostCreate) {
        host.onCachedDirectoryStructureHostCreate(cachedDirectoryStructureHost);
    }
    const directoryStructureHost: ts.DirectoryStructureHost = cachedDirectoryStructureHost || host;
    const parseConfigFileHost = ts.parseConfigHostFromCompilerHostLike(host, directoryStructureHost);
    // From tsc we want to get already parsed result and hence check for rootFileNames
    let newLine = updateNewLine();
    if (configFileName && host.configFileParsingResult) {
        setConfigFileParsingResult(host.configFileParsingResult);
        newLine = updateNewLine();
    }
    reportWatchDiagnostic(ts.Diagnostics.Starting_compilation_in_watch_mode);
    if (configFileName && !host.configFileParsingResult) {
        newLine = ts.getNewLineCharacter(optionsToExtendForConfigFile, () => host.getNewLine());
        ts.Debug.assert(!rootFileNames);
        parseConfigFile();
        newLine = updateNewLine();
    }
    const { watchFile, watchFilePath, watchDirectory, writeLog } = ts.createWatchFactory<string>(host, compilerOptions);
    const getCanonicalFileName = ts.createGetCanonicalFileName(useCaseSensitiveFileNames);
    writeLog(`Current directory: ${currentDirectory} CaseSensitiveFileNames: ${useCaseSensitiveFileNames}`);
    let configFileWatcher: ts.FileWatcher | undefined;
    if (configFileName) {
        configFileWatcher = watchFile(host, configFileName, scheduleProgramReload, ts.PollingInterval.High, watchOptions, ts.WatchType.ConfigFile);
    }
    const compilerHost = (ts.createCompilerHostFromProgramHost(host, () => compilerOptions, directoryStructureHost) as ts.CompilerHost & ts.ResolutionCacheHost);
    ts.setGetSourceFileAsHashVersioned(compilerHost, host);
    // Members for CompilerHost
    const getNewSourceFile = compilerHost.getSourceFile;
    compilerHost.getSourceFile = (fileName, ...args) => getVersionedSourceFileByPath(fileName, toPath(fileName), ...args);
    compilerHost.getSourceFileByPath = getVersionedSourceFileByPath;
    compilerHost.getNewLine = () => newLine;
    compilerHost.fileExists = fileExists;
    compilerHost.onReleaseOldSourceFile = onReleaseOldSourceFile;
    // Members for ResolutionCacheHost
    compilerHost.toPath = toPath;
    compilerHost.getCompilationSettings = () => compilerOptions;
    compilerHost.watchDirectoryOfFailedLookupLocation = (dir, cb, flags) => watchDirectory(host, dir, cb, flags, watchOptions, ts.WatchType.FailedLookupLocations);
    compilerHost.watchTypeRootsDirectory = (dir, cb, flags) => watchDirectory(host, dir, cb, flags, watchOptions, ts.WatchType.TypeRoots);
    compilerHost.getCachedDirectoryStructureHost = () => cachedDirectoryStructureHost;
    compilerHost.onInvalidatedResolution = scheduleProgramUpdate;
    compilerHost.onChangedAutomaticTypeDirectiveNames = () => {
        hasChangedAutomaticTypeDirectiveNames = true;
        scheduleProgramUpdate();
    };
    compilerHost.fileIsOpen = ts.returnFalse;
    compilerHost.maxNumberOfFilesToIterateForInvalidation = host.maxNumberOfFilesToIterateForInvalidation;
    compilerHost.getCurrentProgram = getCurrentProgram;
    compilerHost.writeLog = writeLog;
    // Cache for the module resolution
    const resolutionCache = ts.createResolutionCache(compilerHost, configFileName ?
        ts.getDirectoryPath(ts.getNormalizedAbsolutePath(configFileName, currentDirectory)) :
        currentDirectory, 
    /*logChangesWhenResolvingModule*/ false);
    // Resolve module using host module resolution strategy if provided otherwise use resolution cache to resolve module names
    compilerHost.resolveModuleNames = host.resolveModuleNames ?
        ((...args) => host.resolveModuleNames!(...args)) :
        ((moduleNames, containingFile, reusedNames, redirectedReference) => resolutionCache.resolveModuleNames(moduleNames, containingFile, reusedNames, redirectedReference));
    compilerHost.resolveTypeReferenceDirectives = host.resolveTypeReferenceDirectives ?
        ((...args) => host.resolveTypeReferenceDirectives!(...args)) :
        ((typeDirectiveNames, containingFile, redirectedReference) => resolutionCache.resolveTypeReferenceDirectives(typeDirectiveNames, containingFile, redirectedReference));
    const userProvidedResolution = !!host.resolveModuleNames || !!host.resolveTypeReferenceDirectives;
    builderProgram = readBuilderProgram(compilerOptions, compilerHost) as any as T;
    synchronizeProgram();
    // Update the wild card directory watch
    watchConfigFileWildCardDirectories();
    return configFileName ?
        { getCurrentProgram: getCurrentBuilderProgram, getProgram: synchronizeProgram, close } :
        { getCurrentProgram: getCurrentBuilderProgram, getProgram: synchronizeProgram, updateRootFileNames, close };
    function close() {
        resolutionCache.clear();
        ts.clearMap(sourceFilesCache, value => {
            if (value && value.fileWatcher) {
                value.fileWatcher.close();
                value.fileWatcher = undefined;
            }
        });
        if (configFileWatcher) {
            configFileWatcher.close();
            configFileWatcher = undefined;
        }
        if (watchedWildcardDirectories) {
            ts.clearMap(watchedWildcardDirectories, ts.closeFileWatcherOf);
            watchedWildcardDirectories = undefined!;
        }
        if (missingFilesMap) {
            ts.clearMap(missingFilesMap, ts.closeFileWatcher);
            missingFilesMap = undefined!;
        }
    }
    function getCurrentBuilderProgram() {
        return builderProgram;
    }
    function getCurrentProgram() {
        return builderProgram && builderProgram.getProgramOrUndefined();
    }
    function synchronizeProgram() {
        writeLog(`Synchronizing program`);
        const program = getCurrentBuilderProgram();
        if (hasChangedCompilerOptions) {
            newLine = updateNewLine();
            if (program && ts.changesAffectModuleResolution(program.getCompilerOptions(), compilerOptions)) {
                resolutionCache.clear();
            }
        }
        // All resolutions are invalid if user provided resolutions
        const hasInvalidatedResolution = resolutionCache.createHasInvalidatedResolution(userProvidedResolution);
        if (ts.isProgramUptoDate(getCurrentProgram(), rootFileNames, compilerOptions, getSourceVersion, fileExists, hasInvalidatedResolution, hasChangedAutomaticTypeDirectiveNames, projectReferences)) {
            if (hasChangedConfigFileParsingErrors) {
                builderProgram = createProgram(/*rootNames*/ undefined, /*options*/ undefined, compilerHost, builderProgram, configFileParsingDiagnostics, projectReferences);
                hasChangedConfigFileParsingErrors = false;
            }
        }
        else {
            createNewProgram(hasInvalidatedResolution);
        }
        if (host.afterProgramCreate) {
            host.afterProgramCreate(builderProgram);
        }
        return builderProgram;
    }
    function createNewProgram(hasInvalidatedResolution: ts.HasInvalidatedResolution) {
        // Compile the program
        writeLog("CreatingProgramWith::");
        writeLog(`  roots: ${JSON.stringify(rootFileNames)}`);
        writeLog(`  options: ${JSON.stringify(compilerOptions)}`);
        const needsUpdateInTypeRootWatch = hasChangedCompilerOptions || !getCurrentProgram();
        hasChangedCompilerOptions = false;
        hasChangedConfigFileParsingErrors = false;
        resolutionCache.startCachingPerDirectoryResolution();
        compilerHost.hasInvalidatedResolution = hasInvalidatedResolution;
        compilerHost.hasChangedAutomaticTypeDirectiveNames = hasChangedAutomaticTypeDirectiveNames;
        builderProgram = createProgram(rootFileNames, compilerOptions, compilerHost, builderProgram, configFileParsingDiagnostics, projectReferences);
        resolutionCache.finishCachingPerDirectoryResolution();
        // Update watches
        ts.updateMissingFilePathsWatch(builderProgram.getProgram(), missingFilesMap || (missingFilesMap = ts.createMap()), watchMissingFilePath);
        if (needsUpdateInTypeRootWatch) {
            resolutionCache.updateTypeRootsWatch();
        }
        if (missingFilePathsRequestedForRelease) {
            // These are the paths that program creater told us as not in use any more but were missing on the disk.
            // We didnt remove the entry for them from sourceFiles cache so that we dont have to do File IO,
            // if there is already watcher for it (for missing files)
            // At this point our watches were updated, hence now we know that these paths are not tracked and need to be removed
            // so that at later time we have correct result of their presence
            for (const missingFilePath of missingFilePathsRequestedForRelease) {
                if (!missingFilesMap.has(missingFilePath)) {
                    sourceFilesCache.delete(missingFilePath);
                }
            }
            missingFilePathsRequestedForRelease = undefined;
        }
    }
    function updateRootFileNames(files: string[]) {
        ts.Debug.assert(!configFileName, "Cannot update root file names with config file watch mode");
        rootFileNames = files;
        scheduleProgramUpdate();
    }
    function updateNewLine() {
        return ts.getNewLineCharacter(compilerOptions || optionsToExtendForConfigFile, () => host.getNewLine());
    }
    function toPath(fileName: string) {
        return ts.toPath(fileName, currentDirectory, getCanonicalFileName);
    }
    function isFileMissingOnHost(hostSourceFile: HostFileInfo | undefined): hostSourceFile is FileMissingOnHost {
        return typeof hostSourceFile === "boolean";
    }
    function isFilePresenceUnknownOnHost(hostSourceFile: FileMayBePresentOnHost): hostSourceFile is FilePresenceUnknownOnHost {
        return typeof (hostSourceFile as FilePresenceUnknownOnHost).version === "boolean";
    }
    function fileExists(fileName: string) {
        const path = toPath(fileName);
        // If file is missing on host from cache, we can definitely say file doesnt exist
        // otherwise we need to ensure from the disk
        if (isFileMissingOnHost(sourceFilesCache.get(path))) {
            return true;
        }
        return directoryStructureHost.fileExists(fileName);
    }
    function getVersionedSourceFileByPath(fileName: string, path: ts.Path, languageVersion: ts.ScriptTarget, onError?: (message: string) => void, shouldCreateNewSourceFile?: boolean): ts.SourceFile | undefined {
        const hostSourceFile = sourceFilesCache.get(path);
        // No source file on the host
        if (isFileMissingOnHost(hostSourceFile)) {
            return undefined;
        }
        // Create new source file if requested or the versions dont match
        if (hostSourceFile === undefined || shouldCreateNewSourceFile || isFilePresenceUnknownOnHost(hostSourceFile)) {
            const sourceFile = getNewSourceFile(fileName, languageVersion, onError);
            if (hostSourceFile) {
                if (sourceFile) {
                    // Set the source file and create file watcher now that file was present on the disk
                    (hostSourceFile as FilePresentOnHost).sourceFile = sourceFile;
                    hostSourceFile.version = sourceFile.version;
                    if (!hostSourceFile.fileWatcher) {
                        hostSourceFile.fileWatcher = watchFilePath(host, fileName, onSourceFileChange, ts.PollingInterval.Low, watchOptions, path, ts.WatchType.SourceFile);
                    }
                }
                else {
                    // There is no source file on host any more, close the watch, missing file paths will track it
                    if (hostSourceFile.fileWatcher) {
                        hostSourceFile.fileWatcher.close();
                    }
                    sourceFilesCache.set(path, false);
                }
            }
            else {
                if (sourceFile) {
                    const fileWatcher = watchFilePath(host, fileName, onSourceFileChange, ts.PollingInterval.Low, watchOptions, path, ts.WatchType.SourceFile);
                    sourceFilesCache.set(path, { sourceFile, version: sourceFile.version, fileWatcher });
                }
                else {
                    sourceFilesCache.set(path, false);
                }
            }
            return sourceFile;
        }
        return hostSourceFile.sourceFile;
    }
    function nextSourceFileVersion(path: ts.Path) {
        const hostSourceFile = sourceFilesCache.get(path);
        if (hostSourceFile !== undefined) {
            if (isFileMissingOnHost(hostSourceFile)) {
                // The next version, lets set it as presence unknown file
                sourceFilesCache.set(path, { version: false });
            }
            else {
                (hostSourceFile as FilePresenceUnknownOnHost).version = false;
            }
        }
    }
    function getSourceVersion(path: ts.Path): string | undefined {
        const hostSourceFile = sourceFilesCache.get(path);
        return !hostSourceFile || !hostSourceFile.version ? undefined : hostSourceFile.version;
    }
    function onReleaseOldSourceFile(oldSourceFile: ts.SourceFile, _oldOptions: ts.CompilerOptions, hasSourceFileByPath: boolean) {
        const hostSourceFileInfo = sourceFilesCache.get(oldSourceFile.resolvedPath);
        // If this is the source file thats in the cache and new program doesnt need it,
        // remove the cached entry.
        // Note we arent deleting entry if file became missing in new program or
        // there was version update and new source file was created.
        if (hostSourceFileInfo !== undefined) {
            // record the missing file paths so they can be removed later if watchers arent tracking them
            if (isFileMissingOnHost(hostSourceFileInfo)) {
                (missingFilePathsRequestedForRelease || (missingFilePathsRequestedForRelease = [])).push(oldSourceFile.path);
            }
            else if ((hostSourceFileInfo as FilePresentOnHost).sourceFile === oldSourceFile) {
                if (hostSourceFileInfo.fileWatcher) {
                    hostSourceFileInfo.fileWatcher.close();
                }
                sourceFilesCache.delete(oldSourceFile.resolvedPath);
                if (!hasSourceFileByPath) {
                    resolutionCache.removeResolutionsOfFile(oldSourceFile.path);
                }
            }
        }
    }
    function reportWatchDiagnostic(message: ts.DiagnosticMessage) {
        if (host.onWatchStatusChange) {
            host.onWatchStatusChange(ts.createCompilerDiagnostic(message), newLine, compilerOptions || optionsToExtendForConfigFile);
        }
    }
    // Upon detecting a file change, wait for 250ms and then perform a recompilation. This gives batch
    // operations (such as saving all modified files in an editor) a chance to complete before we kick
    // off a new compilation.
    function scheduleProgramUpdate() {
        if (!host.setTimeout || !host.clearTimeout) {
            return;
        }
        if (timerToUpdateProgram) {
            host.clearTimeout(timerToUpdateProgram);
        }
        writeLog("Scheduling update");
        timerToUpdateProgram = host.setTimeout(updateProgram, 250);
    }
    function scheduleProgramReload() {
        ts.Debug.assert(!!configFileName);
        reloadLevel = ts.ConfigFileProgramReloadLevel.Full;
        scheduleProgramUpdate();
    }
    function updateProgram() {
        timerToUpdateProgram = undefined;
        reportWatchDiagnostic(ts.Diagnostics.File_change_detected_Starting_incremental_compilation);
        switch (reloadLevel) {
            case ts.ConfigFileProgramReloadLevel.Partial:
                ts.perfLogger.logStartUpdateProgram("PartialConfigReload");
                reloadFileNamesFromConfigFile();
                break;
            case ts.ConfigFileProgramReloadLevel.Full:
                ts.perfLogger.logStartUpdateProgram("FullConfigReload");
                reloadConfigFile();
                break;
            default:
                ts.perfLogger.logStartUpdateProgram("SynchronizeProgram");
                synchronizeProgram();
                break;
        }
        ts.perfLogger.logStopUpdateProgram("Done");
    }
    function reloadFileNamesFromConfigFile() {
        writeLog("Reloading new file names and options");
        const result = ts.getFileNamesFromConfigSpecs(configFileSpecs, ts.getNormalizedAbsolutePath(ts.getDirectoryPath(configFileName), currentDirectory), compilerOptions, parseConfigFileHost);
        if (ts.updateErrorForNoInputFiles(result, ts.getNormalizedAbsolutePath(configFileName, currentDirectory), configFileSpecs, (configFileParsingDiagnostics!), canConfigFileJsonReportNoInputFiles)) {
            hasChangedConfigFileParsingErrors = true;
        }
        rootFileNames = result.fileNames;
        // Update the program
        synchronizeProgram();
    }
    function reloadConfigFile() {
        writeLog(`Reloading config file: ${configFileName}`);
        reloadLevel = ts.ConfigFileProgramReloadLevel.None;
        if (cachedDirectoryStructureHost) {
            cachedDirectoryStructureHost.clearCache();
        }
        parseConfigFile();
        hasChangedCompilerOptions = true;
        synchronizeProgram();
        // Update the wild card directory watch
        watchConfigFileWildCardDirectories();
    }
    function parseConfigFile() {
        setConfigFileParsingResult((ts.getParsedCommandLineOfConfigFile(configFileName, optionsToExtendForConfigFile, parseConfigFileHost, /*extendedConfigCache*/ undefined, watchOptionsToExtend)!)); // TODO: GH#18217
    }
    function setConfigFileParsingResult(configFileParseResult: ts.ParsedCommandLine) {
        rootFileNames = configFileParseResult.fileNames;
        compilerOptions = configFileParseResult.options;
        watchOptions = configFileParseResult.watchOptions;
        configFileSpecs = configFileParseResult.configFileSpecs!; // TODO: GH#18217
        projectReferences = configFileParseResult.projectReferences;
        configFileParsingDiagnostics = ts.getConfigFileParsingDiagnostics(configFileParseResult).slice();
        canConfigFileJsonReportNoInputFiles = ts.canJsonReportNoInutFiles(configFileParseResult.raw);
        hasChangedConfigFileParsingErrors = true;
    }
    function onSourceFileChange(fileName: string, eventKind: ts.FileWatcherEventKind, path: ts.Path) {
        updateCachedSystemWithFile(fileName, path, eventKind);
        // Update the source file cache
        if (eventKind === ts.FileWatcherEventKind.Deleted && sourceFilesCache.has(path)) {
            resolutionCache.invalidateResolutionOfFile(path);
        }
        resolutionCache.removeResolutionsFromProjectReferenceRedirects(path);
        nextSourceFileVersion(path);
        // Update the program
        scheduleProgramUpdate();
    }
    function updateCachedSystemWithFile(fileName: string, path: ts.Path, eventKind: ts.FileWatcherEventKind) {
        if (cachedDirectoryStructureHost) {
            cachedDirectoryStructureHost.addOrDeleteFile(fileName, path, eventKind);
        }
    }
    function watchMissingFilePath(missingFilePath: ts.Path) {
        return watchFilePath(host, missingFilePath, onMissingFileChange, ts.PollingInterval.Medium, watchOptions, missingFilePath, ts.WatchType.MissingFile);
    }
    function onMissingFileChange(fileName: string, eventKind: ts.FileWatcherEventKind, missingFilePath: ts.Path) {
        updateCachedSystemWithFile(fileName, missingFilePath, eventKind);
        if (eventKind === ts.FileWatcherEventKind.Created && missingFilesMap.has(missingFilePath)) {
            missingFilesMap.get(missingFilePath)!.close();
            missingFilesMap.delete(missingFilePath);
            // Delete the entry in the source files cache so that new source file is created
            nextSourceFileVersion(missingFilePath);
            // When a missing file is created, we should update the graph.
            scheduleProgramUpdate();
        }
    }
    function watchConfigFileWildCardDirectories() {
        if (configFileSpecs) {
            ts.updateWatchingWildcardDirectories(watchedWildcardDirectories || (watchedWildcardDirectories = ts.createMap()), ts.createMapFromTemplate(configFileSpecs.wildcardDirectories), watchWildcardDirectory);
        }
        else if (watchedWildcardDirectories) {
            ts.clearMap(watchedWildcardDirectories, ts.closeFileWatcherOf);
        }
    }
    function watchWildcardDirectory(directory: string, flags: ts.WatchDirectoryFlags) {
        return watchDirectory(host, directory, fileOrDirectory => {
            ts.Debug.assert(!!configFileName);
            const fileOrDirectoryPath = toPath(fileOrDirectory);
            // Since the file existance changed, update the sourceFiles cache
            if (cachedDirectoryStructureHost) {
                cachedDirectoryStructureHost.addOrDeleteFileOrDirectory(fileOrDirectory, fileOrDirectoryPath);
            }
            nextSourceFileVersion(fileOrDirectoryPath);
            if (ts.isPathIgnored(fileOrDirectoryPath))
                return;
            // If the the added or created file or directory is not supported file name, ignore the file
            // But when watched directory is added/removed, we need to reload the file list
            if (fileOrDirectoryPath !== directory && ts.hasExtension(fileOrDirectoryPath) && !ts.isSupportedSourceFileName(fileOrDirectory, compilerOptions)) {
                writeLog(`Project: ${configFileName} Detected file add/remove of non supported extension: ${fileOrDirectory}`);
                return;
            }
            // Reload is pending, do the reload
            if (reloadLevel !== ts.ConfigFileProgramReloadLevel.Full) {
                reloadLevel = ts.ConfigFileProgramReloadLevel.Partial;
                // Schedule Update the program
                scheduleProgramUpdate();
            }
        }, flags, watchOptions, ts.WatchType.WildcardDirectory);
    }
}
