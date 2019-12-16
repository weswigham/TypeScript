import * as ts from "./ts";
/*@internal*/
/** This is the cache of module/typedirectives resolution that can be retained across program */
export interface ResolutionCache {
    startRecordingFilesWithChangedResolutions(): void;
    finishRecordingFilesWithChangedResolutions(): ts.Path[] | undefined;
    resolveModuleNames(moduleNames: string[], containingFile: string, reusedNames: string[] | undefined, redirectedReference?: ts.ResolvedProjectReference): (ts.ResolvedModuleFull | undefined)[];
    getResolvedModuleWithFailedLookupLocationsFromCache(moduleName: string, containingFile: string): CachedResolvedModuleWithFailedLookupLocations | undefined;
    resolveTypeReferenceDirectives(typeDirectiveNames: string[], containingFile: string, redirectedReference?: ts.ResolvedProjectReference): (ts.ResolvedTypeReferenceDirective | undefined)[];
    invalidateResolutionOfFile(filePath: ts.Path): void;
    removeResolutionsOfFile(filePath: ts.Path): void;
    removeResolutionsFromProjectReferenceRedirects(filePath: ts.Path): void;
    setFilesWithInvalidatedNonRelativeUnresolvedImports(filesWithUnresolvedImports: ts.Map<readonly string[]>): void;
    createHasInvalidatedResolution(forceAllFilesAsInvalidated?: boolean): ts.HasInvalidatedResolution;
    startCachingPerDirectoryResolution(): void;
    finishCachingPerDirectoryResolution(): void;
    updateTypeRootsWatch(): void;
    closeTypeRootsWatch(): void;
    clear(): void;
}
/* @internal */
interface ResolutionWithFailedLookupLocations {
    readonly failedLookupLocations: readonly string[];
    isInvalidated?: boolean;
    refCount?: number;
}
/* @internal */
interface ResolutionWithResolvedFileName {
    resolvedFileName: string | undefined;
}
/* @internal */
interface CachedResolvedModuleWithFailedLookupLocations extends ts.ResolvedModuleWithFailedLookupLocations, ResolutionWithFailedLookupLocations {
}
/* @internal */
interface CachedResolvedTypeReferenceDirectiveWithFailedLookupLocations extends ts.ResolvedTypeReferenceDirectiveWithFailedLookupLocations, ResolutionWithFailedLookupLocations {
}
/* @internal */
export interface ResolutionCacheHost extends ts.ModuleResolutionHost {
    toPath(fileName: string): ts.Path;
    getCanonicalFileName: ts.GetCanonicalFileName;
    getCompilationSettings(): ts.CompilerOptions;
    watchDirectoryOfFailedLookupLocation(directory: string, cb: ts.DirectoryWatcherCallback, flags: ts.WatchDirectoryFlags): ts.FileWatcher;
    onInvalidatedResolution(): void;
    watchTypeRootsDirectory(directory: string, cb: ts.DirectoryWatcherCallback, flags: ts.WatchDirectoryFlags): ts.FileWatcher;
    onChangedAutomaticTypeDirectiveNames(): void;
    getCachedDirectoryStructureHost(): ts.CachedDirectoryStructureHost | undefined;
    projectName?: string;
    getGlobalCache?(): string | undefined;
    globalCacheResolutionModuleName?(externalModuleName: string): string;
    writeLog(s: string): void;
    maxNumberOfFilesToIterateForInvalidation?: number;
    getCurrentProgram(): ts.Program | undefined;
    fileIsOpen(filePath: ts.Path): boolean;
}
/* @internal */
interface DirectoryWatchesOfFailedLookup {
    /** watcher for the directory of failed lookup */
    watcher: ts.FileWatcher;
    /** ref count keeping this directory watch alive */
    refCount: number;
    /** is the directory watched being non recursive */
    nonRecursive?: boolean;
}
/* @internal */
interface DirectoryOfFailedLookupWatch {
    dir: string;
    dirPath: ts.Path;
    nonRecursive?: boolean;
}
/* @internal */
export function isPathIgnored(path: ts.Path) {
    return ts.some(ts.ignoredPaths, searchPath => ts.stringContains(path, searchPath));
}
/**
 * Filter out paths like
 * "/", "/user", "/user/username", "/user/username/folderAtRoot",
 * "c:/", "c:/users", "c:/users/username", "c:/users/username/folderAtRoot", "c:/folderAtRoot"
 * @param dirPath
 */
/* @internal */
export function canWatchDirectory(dirPath: ts.Path) {
    const rootLength = ts.getRootLength(dirPath);
    if (dirPath.length === rootLength) {
        // Ignore "/", "c:/"
        return false;
    }
    let nextDirectorySeparator = dirPath.indexOf(ts.directorySeparator, rootLength);
    if (nextDirectorySeparator === -1) {
        // ignore "/user", "c:/users" or "c:/folderAtRoot"
        return false;
    }
    let pathPartForUserCheck = dirPath.substring(rootLength, nextDirectorySeparator + 1);
    const isNonDirectorySeparatorRoot = rootLength > 1 || dirPath.charCodeAt(0) !== ts.CharacterCodes.slash;
    if (isNonDirectorySeparatorRoot &&
        dirPath.search(/[a-zA-Z]:/) !== 0 && // Non dos style paths
        pathPartForUserCheck.search(/[a-zA-z]\$\//) === 0) { // Dos style nextPart
        nextDirectorySeparator = dirPath.indexOf(ts.directorySeparator, nextDirectorySeparator + 1);
        if (nextDirectorySeparator === -1) {
            // ignore "//vda1cs4850/c$/folderAtRoot"
            return false;
        }
        pathPartForUserCheck = dirPath.substring(rootLength + pathPartForUserCheck.length, nextDirectorySeparator + 1);
    }
    if (isNonDirectorySeparatorRoot &&
        pathPartForUserCheck.search(/users\//i) !== 0) {
        // Paths like c:/folderAtRoot/subFolder are allowed
        return true;
    }
    for (let searchIndex = nextDirectorySeparator + 1, searchLevels = 2; searchLevels > 0; searchLevels--) {
        searchIndex = dirPath.indexOf(ts.directorySeparator, searchIndex) + 1;
        if (searchIndex === 0) {
            // Folder isnt at expected minimum levels
            return false;
        }
    }
    return true;
}
/* @internal */
export const maxNumberOfFilesToIterateForInvalidation = 256;
/* @internal */
type GetResolutionWithResolvedFileName<T extends ResolutionWithFailedLookupLocations = ResolutionWithFailedLookupLocations, R extends ResolutionWithResolvedFileName = ResolutionWithResolvedFileName> = (resolution: T) => R | undefined;
/* @internal */
export function createResolutionCache(resolutionHost: ResolutionCacheHost, rootDirForResolution: string | undefined, logChangesWhenResolvingModule: boolean): ResolutionCache {
    let filesWithChangedSetOfUnresolvedImports: ts.Path[] | undefined;
    let filesWithInvalidatedResolutions: ts.Map<true> | undefined;
    let filesWithInvalidatedNonRelativeUnresolvedImports: ts.ReadonlyMap<readonly string[]> | undefined;
    let allFilesHaveInvalidatedResolution = false;
    const nonRelativeExternalModuleResolutions = ts.createMultiMap<ResolutionWithFailedLookupLocations>();
    const getCurrentDirectory = ts.memoize(() => resolutionHost.getCurrentDirectory!()); // TODO: GH#18217
    const cachedDirectoryStructureHost = resolutionHost.getCachedDirectoryStructureHost();
    // The resolvedModuleNames and resolvedTypeReferenceDirectives are the cache of resolutions per file.
    // The key in the map is source file's path.
    // The values are Map of resolutions with key being name lookedup.
    const resolvedModuleNames = ts.createMap<ts.Map<CachedResolvedModuleWithFailedLookupLocations>>();
    const perDirectoryResolvedModuleNames: ts.CacheWithRedirects<ts.Map<CachedResolvedModuleWithFailedLookupLocations>> = ts.createCacheWithRedirects();
    const nonRelativeModuleNameCache: ts.CacheWithRedirects<ts.PerModuleNameCache> = ts.createCacheWithRedirects();
    const moduleResolutionCache = ts.createModuleResolutionCacheWithMaps(perDirectoryResolvedModuleNames, nonRelativeModuleNameCache, getCurrentDirectory(), resolutionHost.getCanonicalFileName);
    const resolvedTypeReferenceDirectives = ts.createMap<ts.Map<CachedResolvedTypeReferenceDirectiveWithFailedLookupLocations>>();
    const perDirectoryResolvedTypeReferenceDirectives: ts.CacheWithRedirects<ts.Map<CachedResolvedTypeReferenceDirectiveWithFailedLookupLocations>> = ts.createCacheWithRedirects();
    /**
     * These are the extensions that failed lookup files will have by default,
     * any other extension of failed lookup will be store that path in custom failed lookup path
     * This helps in not having to comb through all resolutions when files are added/removed
     * Note that .d.ts file also has .d.ts extension hence will be part of default extensions
     */
    const failedLookupDefaultExtensions = [ts.Extension.Ts, ts.Extension.Tsx, ts.Extension.Js, ts.Extension.Jsx, ts.Extension.Json];
    const customFailedLookupPaths = ts.createMap<number>();
    const directoryWatchesOfFailedLookups = ts.createMap<DirectoryWatchesOfFailedLookup>();
    const rootDir = rootDirForResolution && ts.removeTrailingDirectorySeparator(ts.getNormalizedAbsolutePath(rootDirForResolution, getCurrentDirectory()));
    const rootPath = ((rootDir && resolutionHost.toPath(rootDir)) as ts.Path); // TODO: GH#18217
    // TypeRoot watches for the types that get added as part of getAutomaticTypeDirectiveNames
    const typeRootsWatches = ts.createMap<ts.FileWatcher>();
    return {
        startRecordingFilesWithChangedResolutions,
        finishRecordingFilesWithChangedResolutions,
        // perDirectoryResolvedModuleNames and perDirectoryResolvedTypeReferenceDirectives could be non empty if there was exception during program update
        // (between startCachingPerDirectoryResolution and finishCachingPerDirectoryResolution)
        startCachingPerDirectoryResolution: clearPerDirectoryResolutions,
        finishCachingPerDirectoryResolution,
        resolveModuleNames,
        getResolvedModuleWithFailedLookupLocationsFromCache,
        resolveTypeReferenceDirectives,
        removeResolutionsFromProjectReferenceRedirects,
        removeResolutionsOfFile,
        invalidateResolutionOfFile,
        setFilesWithInvalidatedNonRelativeUnresolvedImports,
        createHasInvalidatedResolution,
        updateTypeRootsWatch,
        closeTypeRootsWatch,
        clear
    };
    function getResolvedModule(resolution: CachedResolvedModuleWithFailedLookupLocations) {
        return resolution.resolvedModule;
    }
    function getResolvedTypeReferenceDirective(resolution: CachedResolvedTypeReferenceDirectiveWithFailedLookupLocations) {
        return resolution.resolvedTypeReferenceDirective;
    }
    function isInDirectoryPath(dir: ts.Path | undefined, file: ts.Path) {
        if (dir === undefined || file.length <= dir.length) {
            return false;
        }
        return ts.startsWith(file, dir) && file[dir.length] === ts.directorySeparator;
    }
    function clear() {
        ts.clearMap(directoryWatchesOfFailedLookups, ts.closeFileWatcherOf);
        customFailedLookupPaths.clear();
        nonRelativeExternalModuleResolutions.clear();
        closeTypeRootsWatch();
        resolvedModuleNames.clear();
        resolvedTypeReferenceDirectives.clear();
        allFilesHaveInvalidatedResolution = false;
        // perDirectoryResolvedModuleNames and perDirectoryResolvedTypeReferenceDirectives could be non empty if there was exception during program update
        // (between startCachingPerDirectoryResolution and finishCachingPerDirectoryResolution)
        clearPerDirectoryResolutions();
    }
    function startRecordingFilesWithChangedResolutions() {
        filesWithChangedSetOfUnresolvedImports = [];
    }
    function finishRecordingFilesWithChangedResolutions() {
        const collected = filesWithChangedSetOfUnresolvedImports;
        filesWithChangedSetOfUnresolvedImports = undefined;
        return collected;
    }
    function isFileWithInvalidatedNonRelativeUnresolvedImports(path: ts.Path): boolean {
        if (!filesWithInvalidatedNonRelativeUnresolvedImports) {
            return false;
        }
        // Invalidated if file has unresolved imports
        const value = filesWithInvalidatedNonRelativeUnresolvedImports.get(path);
        return !!value && !!value.length;
    }
    function createHasInvalidatedResolution(forceAllFilesAsInvalidated?: boolean): ts.HasInvalidatedResolution {
        if (allFilesHaveInvalidatedResolution || forceAllFilesAsInvalidated) {
            // Any file asked would have invalidated resolution
            filesWithInvalidatedResolutions = undefined;
            return ts.returnTrue;
        }
        const collected = filesWithInvalidatedResolutions;
        filesWithInvalidatedResolutions = undefined;
        return path => (!!collected && collected.has(path)) ||
            isFileWithInvalidatedNonRelativeUnresolvedImports(path);
    }
    function clearPerDirectoryResolutions() {
        perDirectoryResolvedModuleNames.clear();
        nonRelativeModuleNameCache.clear();
        perDirectoryResolvedTypeReferenceDirectives.clear();
        nonRelativeExternalModuleResolutions.forEach(watchFailedLookupLocationOfNonRelativeModuleResolutions);
        nonRelativeExternalModuleResolutions.clear();
    }
    function finishCachingPerDirectoryResolution() {
        allFilesHaveInvalidatedResolution = false;
        filesWithInvalidatedNonRelativeUnresolvedImports = undefined;
        clearPerDirectoryResolutions();
        directoryWatchesOfFailedLookups.forEach((watcher, path) => {
            if (watcher.refCount === 0) {
                directoryWatchesOfFailedLookups.delete(path);
                watcher.watcher.close();
            }
        });
    }
    function resolveModuleName(moduleName: string, containingFile: string, compilerOptions: ts.CompilerOptions, host: ts.ModuleResolutionHost, redirectedReference?: ts.ResolvedProjectReference): CachedResolvedModuleWithFailedLookupLocations {
        const primaryResult = ts.resolveModuleName(moduleName, containingFile, compilerOptions, host, moduleResolutionCache, redirectedReference);
        // return result immediately only if global cache support is not enabled or if it is .ts, .tsx or .d.ts
        if (!resolutionHost.getGlobalCache) {
            return primaryResult;
        }
        // otherwise try to load typings from @types
        const globalCache = resolutionHost.getGlobalCache();
        if (globalCache !== undefined && !ts.isExternalModuleNameRelative(moduleName) && !(primaryResult.resolvedModule && ts.extensionIsTS(primaryResult.resolvedModule.extension))) {
            // create different collection of failed lookup locations for second pass
            // if it will fail and we've already found something during the first pass - we don't want to pollute its results
            const { resolvedModule, failedLookupLocations } = ts.loadModuleFromGlobalCache(ts.Debug.assertDefined(resolutionHost.globalCacheResolutionModuleName)(moduleName), resolutionHost.projectName, compilerOptions, host, globalCache);
            if (resolvedModule) {
                return { resolvedModule, failedLookupLocations: ts.addRange((primaryResult.failedLookupLocations as string[]), failedLookupLocations) };
            }
        }
        // Default return the result from the first pass
        return primaryResult;
    }
    function resolveNamesWithLocalCache<T extends ResolutionWithFailedLookupLocations, R extends ResolutionWithResolvedFileName>(names: readonly string[], containingFile: string, redirectedReference: ts.ResolvedProjectReference | undefined, cache: ts.Map<ts.Map<T>>, perDirectoryCacheWithRedirects: ts.CacheWithRedirects<ts.Map<T>>, loader: (name: string, containingFile: string, options: ts.CompilerOptions, host: ts.ModuleResolutionHost, redirectedReference?: ts.ResolvedProjectReference) => T, getResolutionWithResolvedFileName: GetResolutionWithResolvedFileName<T, R>, shouldRetryResolution: (t: T) => boolean, reusedNames: readonly string[] | undefined, logChanges: boolean): (R | undefined)[] {
        const path = resolutionHost.toPath(containingFile);
        const resolutionsInFile = cache.get(path) || (cache.set(path, ts.createMap()).get(path)!);
        const dirPath = ts.getDirectoryPath(path);
        const perDirectoryCache = perDirectoryCacheWithRedirects.getOrCreateMapOfCacheRedirects(redirectedReference);
        let perDirectoryResolution = perDirectoryCache.get(dirPath);
        if (!perDirectoryResolution) {
            perDirectoryResolution = ts.createMap();
            perDirectoryCache.set(dirPath, perDirectoryResolution);
        }
        const resolvedModules: (R | undefined)[] = [];
        const compilerOptions = resolutionHost.getCompilationSettings();
        const hasInvalidatedNonRelativeUnresolvedImport = logChanges && isFileWithInvalidatedNonRelativeUnresolvedImports(path);
        // All the resolutions in this file are invalidated if this file wasnt resolved using same redirect
        const program = resolutionHost.getCurrentProgram();
        const oldRedirect = program && program.getResolvedProjectReferenceToRedirect(containingFile);
        const unmatchedRedirects = oldRedirect ?
            !redirectedReference || redirectedReference.sourceFile.path !== oldRedirect.sourceFile.path :
            !!redirectedReference;
        const seenNamesInFile = ts.createMap<true>();
        for (const name of names) {
            let resolution = resolutionsInFile.get(name);
            // Resolution is valid if it is present and not invalidated
            if (!seenNamesInFile.has(name) &&
                allFilesHaveInvalidatedResolution || unmatchedRedirects || !resolution || resolution.isInvalidated ||
                // If the name is unresolved import that was invalidated, recalculate
                (hasInvalidatedNonRelativeUnresolvedImport && !ts.isExternalModuleNameRelative(name) && shouldRetryResolution(resolution))) {
                const existingResolution = resolution;
                const resolutionInDirectory = perDirectoryResolution.get(name);
                if (resolutionInDirectory) {
                    resolution = resolutionInDirectory;
                }
                else {
                    resolution = loader(name, containingFile, compilerOptions, resolutionHost, redirectedReference);
                    perDirectoryResolution.set(name, resolution);
                }
                resolutionsInFile.set(name, resolution);
                watchFailedLookupLocationsOfExternalModuleResolutions(name, resolution);
                if (existingResolution) {
                    stopWatchFailedLookupLocationOfResolution(existingResolution);
                }
                if (logChanges && filesWithChangedSetOfUnresolvedImports && !resolutionIsEqualTo(existingResolution, resolution)) {
                    filesWithChangedSetOfUnresolvedImports.push(path);
                    // reset log changes to avoid recording the same file multiple times
                    logChanges = false;
                }
            }
            ts.Debug.assert(resolution !== undefined && !resolution.isInvalidated);
            seenNamesInFile.set(name, true);
            resolvedModules.push(getResolutionWithResolvedFileName(resolution));
        }
        // Stop watching and remove the unused name
        resolutionsInFile.forEach((resolution, name) => {
            if (!seenNamesInFile.has(name) && !ts.contains(reusedNames, name)) {
                stopWatchFailedLookupLocationOfResolution(resolution);
                resolutionsInFile.delete(name);
            }
        });
        return resolvedModules;
        function resolutionIsEqualTo(oldResolution: T | undefined, newResolution: T | undefined): boolean {
            if (oldResolution === newResolution) {
                return true;
            }
            if (!oldResolution || !newResolution) {
                return false;
            }
            const oldResult = getResolutionWithResolvedFileName(oldResolution);
            const newResult = getResolutionWithResolvedFileName(newResolution);
            if (oldResult === newResult) {
                return true;
            }
            if (!oldResult || !newResult) {
                return false;
            }
            return oldResult.resolvedFileName === newResult.resolvedFileName;
        }
    }
    function resolveTypeReferenceDirectives(typeDirectiveNames: string[], containingFile: string, redirectedReference?: ts.ResolvedProjectReference): (ts.ResolvedTypeReferenceDirective | undefined)[] {
        return resolveNamesWithLocalCache<CachedResolvedTypeReferenceDirectiveWithFailedLookupLocations, ts.ResolvedTypeReferenceDirective>(typeDirectiveNames, containingFile, redirectedReference, resolvedTypeReferenceDirectives, perDirectoryResolvedTypeReferenceDirectives, ts.resolveTypeReferenceDirective, getResolvedTypeReferenceDirective, 
        /*shouldRetryResolution*/ resolution => resolution.resolvedTypeReferenceDirective === undefined, 
        /*reusedNames*/ undefined, /*logChanges*/ false);
    }
    function resolveModuleNames(moduleNames: string[], containingFile: string, reusedNames: string[] | undefined, redirectedReference?: ts.ResolvedProjectReference): (ts.ResolvedModuleFull | undefined)[] {
        return resolveNamesWithLocalCache<CachedResolvedModuleWithFailedLookupLocations, ts.ResolvedModuleFull>(moduleNames, containingFile, redirectedReference, resolvedModuleNames, perDirectoryResolvedModuleNames, resolveModuleName, getResolvedModule, 
        /*shouldRetryResolution*/ resolution => !resolution.resolvedModule || !ts.resolutionExtensionIsTSOrJson(resolution.resolvedModule.extension), reusedNames, logChangesWhenResolvingModule);
    }
    function getResolvedModuleWithFailedLookupLocationsFromCache(moduleName: string, containingFile: string): CachedResolvedModuleWithFailedLookupLocations | undefined {
        const cache = resolvedModuleNames.get(resolutionHost.toPath(containingFile));
        return cache && cache.get(moduleName);
    }
    function isNodeModulesDirectory(dirPath: ts.Path) {
        return ts.endsWith(dirPath, "/node_modules");
    }
    function isNodeModulesAtTypesDirectory(dirPath: ts.Path) {
        return ts.endsWith(dirPath, "/node_modules/@types");
    }
    function getDirectoryToWatchFailedLookupLocation(failedLookupLocation: string, failedLookupLocationPath: ts.Path): DirectoryOfFailedLookupWatch | undefined {
        if (isInDirectoryPath(rootPath, failedLookupLocationPath)) {
            // Ensure failed look up is normalized path
            failedLookupLocation = ts.isRootedDiskPath(failedLookupLocation) ? ts.normalizePath(failedLookupLocation) : ts.getNormalizedAbsolutePath(failedLookupLocation, getCurrentDirectory());
            ts.Debug.assert(failedLookupLocation.length === failedLookupLocationPath.length, `FailedLookup: ${failedLookupLocation} failedLookupLocationPath: ${failedLookupLocationPath}`);
            const subDirectoryInRoot = failedLookupLocationPath.indexOf(ts.directorySeparator, rootPath.length + 1);
            if (subDirectoryInRoot !== -1) {
                // Instead of watching root, watch directory in root to avoid watching excluded directories not needed for module resolution
                return { dir: failedLookupLocation.substr(0, subDirectoryInRoot), dirPath: (failedLookupLocationPath.substr(0, subDirectoryInRoot) as ts.Path) };
            }
            else {
                // Always watch root directory non recursively
                return { dir: rootDir!, dirPath: rootPath, nonRecursive: false }; // TODO: GH#18217
            }
        }
        return getDirectoryToWatchFromFailedLookupLocationDirectory(ts.getDirectoryPath(ts.getNormalizedAbsolutePath(failedLookupLocation, getCurrentDirectory())), ts.getDirectoryPath(failedLookupLocationPath));
    }
    function getDirectoryToWatchFromFailedLookupLocationDirectory(dir: string, dirPath: ts.Path): DirectoryOfFailedLookupWatch | undefined {
        // If directory path contains node module, get the most parent node_modules directory for watching
        while (ts.pathContainsNodeModules(dirPath)) {
            dir = ts.getDirectoryPath(dir);
            dirPath = ts.getDirectoryPath(dirPath);
        }
        // If the directory is node_modules use it to watch, always watch it recursively
        if (isNodeModulesDirectory(dirPath)) {
            return canWatchDirectory(ts.getDirectoryPath(dirPath)) ? { dir, dirPath } : undefined;
        }
        let nonRecursive = true;
        // Use some ancestor of the root directory
        let subDirectoryPath: ts.Path | undefined, subDirectory: string | undefined;
        if (rootPath !== undefined) {
            while (!isInDirectoryPath(dirPath, rootPath)) {
                const parentPath = ts.getDirectoryPath(dirPath);
                if (parentPath === dirPath) {
                    break;
                }
                nonRecursive = false;
                subDirectoryPath = dirPath;
                subDirectory = dir;
                dirPath = parentPath;
                dir = ts.getDirectoryPath(dir);
            }
        }
        return canWatchDirectory(dirPath) ? { dir: subDirectory || dir, dirPath: subDirectoryPath || dirPath, nonRecursive } : undefined;
    }
    function isPathWithDefaultFailedLookupExtension(path: ts.Path) {
        return ts.fileExtensionIsOneOf(path, failedLookupDefaultExtensions);
    }
    function watchFailedLookupLocationsOfExternalModuleResolutions(name: string, resolution: ResolutionWithFailedLookupLocations) {
        // No need to set the resolution refCount
        if (resolution.failedLookupLocations && resolution.failedLookupLocations.length) {
            if (resolution.refCount) {
                resolution.refCount++;
            }
            else {
                resolution.refCount = 1;
                if (ts.isExternalModuleNameRelative(name)) {
                    watchFailedLookupLocationOfResolution(resolution);
                }
                else {
                    nonRelativeExternalModuleResolutions.add(name, resolution);
                }
            }
        }
    }
    function watchFailedLookupLocationOfResolution(resolution: ResolutionWithFailedLookupLocations) {
        ts.Debug.assert(!!resolution.refCount);
        const { failedLookupLocations } = resolution;
        let setAtRoot = false;
        for (const failedLookupLocation of failedLookupLocations) {
            const failedLookupLocationPath = resolutionHost.toPath(failedLookupLocation);
            const toWatch = getDirectoryToWatchFailedLookupLocation(failedLookupLocation, failedLookupLocationPath);
            if (toWatch) {
                const { dir, dirPath, nonRecursive } = toWatch;
                // If the failed lookup location path is not one of the supported extensions,
                // store it in the custom path
                if (!isPathWithDefaultFailedLookupExtension(failedLookupLocationPath)) {
                    const refCount = customFailedLookupPaths.get(failedLookupLocationPath) || 0;
                    customFailedLookupPaths.set(failedLookupLocationPath, refCount + 1);
                }
                if (dirPath === rootPath) {
                    ts.Debug.assert(!nonRecursive);
                    setAtRoot = true;
                }
                else {
                    setDirectoryWatcher(dir, dirPath, nonRecursive);
                }
            }
        }
        if (setAtRoot) {
            // This is always non recursive
            setDirectoryWatcher(rootDir!, rootPath, /*nonRecursive*/ true); // TODO: GH#18217
        }
    }
    function setRefCountToUndefined(resolution: ResolutionWithFailedLookupLocations) {
        resolution.refCount = undefined;
    }
    function watchFailedLookupLocationOfNonRelativeModuleResolutions(resolutions: ResolutionWithFailedLookupLocations[], name: string) {
        const program = resolutionHost.getCurrentProgram();
        const updateResolution = program && program.getTypeChecker().tryFindAmbientModuleWithoutAugmentations(name) ?
            setRefCountToUndefined : watchFailedLookupLocationOfResolution;
        resolutions.forEach(updateResolution);
    }
    function setDirectoryWatcher(dir: string, dirPath: ts.Path, nonRecursive?: boolean) {
        const dirWatcher = directoryWatchesOfFailedLookups.get(dirPath);
        if (dirWatcher) {
            ts.Debug.assert(!!nonRecursive === !!dirWatcher.nonRecursive);
            dirWatcher.refCount++;
        }
        else {
            directoryWatchesOfFailedLookups.set(dirPath, { watcher: createDirectoryWatcher(dir, dirPath, nonRecursive), refCount: 1, nonRecursive });
        }
    }
    function stopWatchFailedLookupLocationOfResolution(resolution: ResolutionWithFailedLookupLocations) {
        if (!resolution.refCount) {
            return;
        }
        resolution.refCount--;
        if (resolution.refCount) {
            return;
        }
        const { failedLookupLocations } = resolution;
        let removeAtRoot = false;
        for (const failedLookupLocation of failedLookupLocations) {
            const failedLookupLocationPath = resolutionHost.toPath(failedLookupLocation);
            const toWatch = getDirectoryToWatchFailedLookupLocation(failedLookupLocation, failedLookupLocationPath);
            if (toWatch) {
                const { dirPath } = toWatch;
                const refCount = customFailedLookupPaths.get(failedLookupLocationPath);
                if (refCount) {
                    if (refCount === 1) {
                        customFailedLookupPaths.delete(failedLookupLocationPath);
                    }
                    else {
                        ts.Debug.assert(refCount > 1);
                        customFailedLookupPaths.set(failedLookupLocationPath, refCount - 1);
                    }
                }
                if (dirPath === rootPath) {
                    removeAtRoot = true;
                }
                else {
                    removeDirectoryWatcher(dirPath);
                }
            }
        }
        if (removeAtRoot) {
            removeDirectoryWatcher(rootPath);
        }
    }
    function removeDirectoryWatcher(dirPath: string) {
        const dirWatcher = directoryWatchesOfFailedLookups.get(dirPath)!;
        // Do not close the watcher yet since it might be needed by other failed lookup locations.
        dirWatcher.refCount--;
    }
    function createDirectoryWatcher(directory: string, dirPath: ts.Path, nonRecursive: boolean | undefined) {
        return resolutionHost.watchDirectoryOfFailedLookupLocation(directory, fileOrDirectory => {
            const fileOrDirectoryPath = resolutionHost.toPath(fileOrDirectory);
            if (cachedDirectoryStructureHost) {
                // Since the file existence changed, update the sourceFiles cache
                cachedDirectoryStructureHost.addOrDeleteFileOrDirectory(fileOrDirectory, fileOrDirectoryPath);
            }
            if (!allFilesHaveInvalidatedResolution && invalidateResolutionOfFailedLookupLocation(fileOrDirectoryPath, dirPath === fileOrDirectoryPath)) {
                resolutionHost.onInvalidatedResolution();
            }
        }, nonRecursive ? ts.WatchDirectoryFlags.None : ts.WatchDirectoryFlags.Recursive);
    }
    function removeResolutionsOfFileFromCache(cache: ts.Map<ts.Map<ResolutionWithFailedLookupLocations>>, filePath: ts.Path) {
        // Deleted file, stop watching failed lookups for all the resolutions in the file
        const resolutions = cache.get(filePath);
        if (resolutions) {
            resolutions.forEach(stopWatchFailedLookupLocationOfResolution);
            cache.delete(filePath);
        }
    }
    function removeResolutionsFromProjectReferenceRedirects(filePath: ts.Path) {
        if (!ts.fileExtensionIs(filePath, ts.Extension.Json)) {
            return;
        }
        const program = resolutionHost.getCurrentProgram();
        if (!program) {
            return;
        }
        // If this file is input file for the referenced project, get it
        const resolvedProjectReference = program.getResolvedProjectReferenceByPath(filePath);
        if (!resolvedProjectReference) {
            return;
        }
        // filePath is for the projectReference and the containing file is from this project reference, invalidate the resolution
        resolvedProjectReference.commandLine.fileNames.forEach(f => removeResolutionsOfFile(resolutionHost.toPath(f)));
    }
    function removeResolutionsOfFile(filePath: ts.Path) {
        removeResolutionsOfFileFromCache(resolvedModuleNames, filePath);
        removeResolutionsOfFileFromCache(resolvedTypeReferenceDirectives, filePath);
    }
    function invalidateResolutionCache<T extends ResolutionWithFailedLookupLocations, R extends ResolutionWithResolvedFileName>(cache: ts.Map<ts.Map<T>>, isInvalidatedResolution: (resolution: T, getResolutionWithResolvedFileName: GetResolutionWithResolvedFileName<T, R>) => boolean, getResolutionWithResolvedFileName: GetResolutionWithResolvedFileName<T, R>) {
        const seen = ts.createMap<ts.Map<true>>();
        cache.forEach((resolutions, containingFilePath) => {
            const dirPath = ts.getDirectoryPath(containingFilePath);
            let seenInDir = seen.get(dirPath);
            if (!seenInDir) {
                seenInDir = ts.createMap<true>();
                seen.set(dirPath, seenInDir);
            }
            resolutions.forEach((resolution, name) => {
                if (seenInDir!.has(name)) {
                    return;
                }
                seenInDir!.set(name, true);
                if (!resolution.isInvalidated && isInvalidatedResolution(resolution, getResolutionWithResolvedFileName)) {
                    // Mark the file as needing re-evaluation of module resolution instead of using it blindly.
                    resolution.isInvalidated = true;
                    (filesWithInvalidatedResolutions || (filesWithInvalidatedResolutions = ts.createMap<true>())).set(containingFilePath, true);
                    // When its a file with inferred types resolution, invalidate type reference directive resolution
                    if (containingFilePath.endsWith(ts.inferredTypesContainingFile)) {
                        resolutionHost.onChangedAutomaticTypeDirectiveNames();
                    }
                }
            });
        });
    }
    function hasReachedResolutionIterationLimit() {
        const maxSize = resolutionHost.maxNumberOfFilesToIterateForInvalidation || maxNumberOfFilesToIterateForInvalidation;
        return resolvedModuleNames.size > maxSize || resolvedTypeReferenceDirectives.size > maxSize;
    }
    function invalidateResolutions(isInvalidatedResolution: (resolution: ResolutionWithFailedLookupLocations, getResolutionWithResolvedFileName: GetResolutionWithResolvedFileName) => boolean) {
        // If more than maxNumberOfFilesToIterateForInvalidation present,
        // just invalidated all files and recalculate the resolutions for files instead
        if (hasReachedResolutionIterationLimit()) {
            allFilesHaveInvalidatedResolution = true;
            return;
        }
        invalidateResolutionCache(resolvedModuleNames, isInvalidatedResolution, getResolvedModule);
        invalidateResolutionCache(resolvedTypeReferenceDirectives, isInvalidatedResolution, getResolvedTypeReferenceDirective);
    }
    function invalidateResolutionOfFile(filePath: ts.Path) {
        removeResolutionsOfFile(filePath);
        invalidateResolutions(
        // Resolution is invalidated if the resulting file name is same as the deleted file path
        (resolution, getResolutionWithResolvedFileName) => {
            const result = getResolutionWithResolvedFileName(resolution);
            return !!result && resolutionHost.toPath(result.resolvedFileName!) === filePath; // TODO: GH#18217
        });
    }
    function setFilesWithInvalidatedNonRelativeUnresolvedImports(filesMap: ts.ReadonlyMap<readonly string[]>) {
        ts.Debug.assert(filesWithInvalidatedNonRelativeUnresolvedImports === filesMap || filesWithInvalidatedNonRelativeUnresolvedImports === undefined);
        filesWithInvalidatedNonRelativeUnresolvedImports = filesMap;
    }
    function invalidateResolutionOfFailedLookupLocation(fileOrDirectoryPath: ts.Path, isCreatingWatchedDirectory: boolean) {
        let isChangedFailedLookupLocation: (location: string) => boolean;
        if (isCreatingWatchedDirectory) {
            // Watching directory is created
            // Invalidate any resolution has failed lookup in this directory
            isChangedFailedLookupLocation = location => isInDirectoryPath(fileOrDirectoryPath, resolutionHost.toPath(location));
        }
        else {
            // If something to do with folder/file starting with "." in node_modules folder, skip it
            if (isPathIgnored(fileOrDirectoryPath))
                return false;
            // prevent saving an open file from over-eagerly triggering invalidation
            if (resolutionHost.fileIsOpen(fileOrDirectoryPath)) {
                return false;
            }
            // Some file or directory in the watching directory is created
            // Return early if it does not have any of the watching extension or not the custom failed lookup path
            const dirOfFileOrDirectory = ts.getDirectoryPath(fileOrDirectoryPath);
            if (isNodeModulesAtTypesDirectory(fileOrDirectoryPath) || isNodeModulesDirectory(fileOrDirectoryPath) ||
                isNodeModulesAtTypesDirectory(dirOfFileOrDirectory) || isNodeModulesDirectory(dirOfFileOrDirectory)) {
                // Invalidate any resolution from this directory
                isChangedFailedLookupLocation = location => {
                    const locationPath = resolutionHost.toPath(location);
                    return locationPath === fileOrDirectoryPath || ts.startsWith(resolutionHost.toPath(location), fileOrDirectoryPath);
                };
            }
            else {
                if (!isPathWithDefaultFailedLookupExtension(fileOrDirectoryPath) && !customFailedLookupPaths.has(fileOrDirectoryPath)) {
                    return false;
                }
                // Ignore emits from the program
                if (ts.isEmittedFileOfProgram(resolutionHost.getCurrentProgram(), fileOrDirectoryPath)) {
                    return false;
                }
                // Resolution need to be invalidated if failed lookup location is same as the file or directory getting created
                isChangedFailedLookupLocation = location => resolutionHost.toPath(location) === fileOrDirectoryPath;
            }
        }
        const hasChangedFailedLookupLocation = (resolution: ResolutionWithFailedLookupLocations) => ts.some(resolution.failedLookupLocations, isChangedFailedLookupLocation);
        const invalidatedFilesCount = filesWithInvalidatedResolutions && filesWithInvalidatedResolutions.size;
        invalidateResolutions(
        // Resolution is invalidated if the resulting file name is same as the deleted file path
        hasChangedFailedLookupLocation);
        return allFilesHaveInvalidatedResolution || filesWithInvalidatedResolutions && filesWithInvalidatedResolutions.size !== invalidatedFilesCount;
    }
    function closeTypeRootsWatch() {
        ts.clearMap(typeRootsWatches, ts.closeFileWatcher);
    }
    function getDirectoryToWatchFailedLookupLocationFromTypeRoot(typeRoot: string, typeRootPath: ts.Path): ts.Path | undefined {
        if (allFilesHaveInvalidatedResolution) {
            return undefined;
        }
        if (isInDirectoryPath(rootPath, typeRootPath)) {
            return rootPath;
        }
        const toWatch = getDirectoryToWatchFromFailedLookupLocationDirectory(typeRoot, typeRootPath);
        return toWatch && directoryWatchesOfFailedLookups.has(toWatch.dirPath) ? toWatch.dirPath : undefined;
    }
    function createTypeRootsWatch(typeRootPath: ts.Path, typeRoot: string): ts.FileWatcher {
        // Create new watch and recursive info
        return resolutionHost.watchTypeRootsDirectory(typeRoot, fileOrDirectory => {
            const fileOrDirectoryPath = resolutionHost.toPath(fileOrDirectory);
            if (cachedDirectoryStructureHost) {
                // Since the file existence changed, update the sourceFiles cache
                cachedDirectoryStructureHost.addOrDeleteFileOrDirectory(fileOrDirectory, fileOrDirectoryPath);
            }
            // For now just recompile
            // We could potentially store more data here about whether it was/would be really be used or not
            // and with that determine to trigger compilation but for now this is enough
            resolutionHost.onChangedAutomaticTypeDirectiveNames();
            // Since directory watchers invoked are flaky, the failed lookup location events might not be triggered
            // So handle to failed lookup locations here as well to ensure we are invalidating resolutions
            const dirPath = getDirectoryToWatchFailedLookupLocationFromTypeRoot(typeRoot, typeRootPath);
            if (dirPath && invalidateResolutionOfFailedLookupLocation(fileOrDirectoryPath, dirPath === fileOrDirectoryPath)) {
                resolutionHost.onInvalidatedResolution();
            }
        }, ts.WatchDirectoryFlags.Recursive);
    }
    /**
     * Watches the types that would get added as part of getAutomaticTypeDirectiveNames
     * To be called when compiler options change
     */
    function updateTypeRootsWatch() {
        const options = resolutionHost.getCompilationSettings();
        if (options.types) {
            // No need to do any watch since resolution cache is going to handle the failed lookups
            // for the types added by this
            closeTypeRootsWatch();
            return;
        }
        // we need to assume the directories exist to ensure that we can get all the type root directories that get included
        // But filter directories that are at root level to say directory doesnt exist, so that we arent watching them
        const typeRoots = ts.getEffectiveTypeRoots(options, { directoryExists: directoryExistsForTypeRootWatch, getCurrentDirectory });
        if (typeRoots) {
            ts.mutateMap(typeRootsWatches, ts.arrayToMap(typeRoots, tr => resolutionHost.toPath(tr)), {
                createNewValue: createTypeRootsWatch,
                onDeleteValue: ts.closeFileWatcher
            });
        }
        else {
            closeTypeRootsWatch();
        }
    }
    /**
     * Use this function to return if directory exists to get type roots to watch
     * If we return directory exists then only the paths will be added to type roots
     * Hence return true for all directories except root directories which are filtered from watching
     */
    function directoryExistsForTypeRootWatch(nodeTypesDirectory: string) {
        const dir = ts.getDirectoryPath(ts.getDirectoryPath(nodeTypesDirectory));
        const dirPath = resolutionHost.toPath(dir);
        return dirPath === rootPath || canWatchDirectory(dirPath);
    }
}
