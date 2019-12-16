import * as ts from "./ts";
/* @internal */
/**
 * Partial interface of the System thats needed to support the caching of directory structure
 */
export interface DirectoryStructureHost {
    fileExists(path: string): boolean;
    readFile(path: string, encoding?: string): string | undefined;
    // TODO: GH#18217 Optional methods are frequently used as non-optional
    directoryExists?(path: string): boolean;
    getDirectories?(path: string): string[];
    readDirectory?(path: string, extensions?: readonly string[], exclude?: readonly string[], include?: readonly string[], depth?: number): string[];
    realpath?(path: string): string;
    createDirectory?(path: string): void;
    writeFile?(path: string, data: string, writeByteOrderMark?: boolean): void;
}
/* @internal */
interface FileAndDirectoryExistence {
    fileExists: boolean;
    directoryExists: boolean;
}
/* @internal */
export interface CachedDirectoryStructureHost extends DirectoryStructureHost {
    useCaseSensitiveFileNames: boolean;
    getDirectories(path: string): string[];
    readDirectory(path: string, extensions?: readonly string[], exclude?: readonly string[], include?: readonly string[], depth?: number): string[];
    /** Returns the queried result for the file exists and directory exists if at all it was done */
    addOrDeleteFileOrDirectory(fileOrDirectory: string, fileOrDirectoryPath: ts.Path): FileAndDirectoryExistence | undefined;
    addOrDeleteFile(fileName: string, filePath: ts.Path, eventKind: ts.FileWatcherEventKind): void;
    clearCache(): void;
}
/* @internal */
interface MutableFileSystemEntries {
    readonly files: string[];
    readonly directories: string[];
}
/* @internal */
export function createCachedDirectoryStructureHost(host: DirectoryStructureHost, currentDirectory: string, useCaseSensitiveFileNames: boolean): CachedDirectoryStructureHost | undefined {
    if (!host.getDirectories || !host.readDirectory) {
        return undefined;
    }
    const cachedReadDirectoryResult = ts.createMap<MutableFileSystemEntries>();
    const getCanonicalFileName = ts.createGetCanonicalFileName(useCaseSensitiveFileNames);
    return {
        useCaseSensitiveFileNames,
        fileExists,
        readFile: (path, encoding) => host.readFile(path, encoding),
        directoryExists: host.directoryExists && directoryExists,
        getDirectories,
        readDirectory,
        createDirectory: host.createDirectory && createDirectory,
        writeFile: host.writeFile && writeFile,
        addOrDeleteFileOrDirectory,
        addOrDeleteFile,
        clearCache,
        realpath: host.realpath && realpath
    };
    function toPath(fileName: string) {
        return ts.toPath(fileName, currentDirectory, getCanonicalFileName);
    }
    function getCachedFileSystemEntries(rootDirPath: ts.Path): MutableFileSystemEntries | undefined {
        return cachedReadDirectoryResult.get(ts.ensureTrailingDirectorySeparator(rootDirPath));
    }
    function getCachedFileSystemEntriesForBaseDir(path: ts.Path): MutableFileSystemEntries | undefined {
        return getCachedFileSystemEntries(ts.getDirectoryPath(path));
    }
    function getBaseNameOfFileName(fileName: string) {
        return ts.getBaseFileName(ts.normalizePath(fileName));
    }
    function createCachedFileSystemEntries(rootDir: string, rootDirPath: ts.Path) {
        const resultFromHost: MutableFileSystemEntries = {
            files: ts.map(host.readDirectory!(rootDir, /*extensions*/ undefined, /*exclude*/ undefined, /*include*/ ["*.*"]), getBaseNameOfFileName) || [],
            directories: host.getDirectories!(rootDir) || []
        };
        cachedReadDirectoryResult.set(ts.ensureTrailingDirectorySeparator(rootDirPath), resultFromHost);
        return resultFromHost;
    }
    /**
     * If the readDirectory result was already cached, it returns that
     * Otherwise gets result from host and caches it.
     * The host request is done under try catch block to avoid caching incorrect result
     */
    function tryReadDirectory(rootDir: string, rootDirPath: ts.Path): MutableFileSystemEntries | undefined {
        rootDirPath = ts.ensureTrailingDirectorySeparator(rootDirPath);
        const cachedResult = getCachedFileSystemEntries(rootDirPath);
        if (cachedResult) {
            return cachedResult;
        }
        try {
            return createCachedFileSystemEntries(rootDir, rootDirPath);
        }
        catch (_e) {
            // If there is exception to read directories, dont cache the result and direct the calls to host
            ts.Debug.assert(!cachedReadDirectoryResult.has(ts.ensureTrailingDirectorySeparator(rootDirPath)));
            return undefined;
        }
    }
    function fileNameEqual(name1: string, name2: string) {
        return getCanonicalFileName(name1) === getCanonicalFileName(name2);
    }
    function hasEntry(entries: readonly string[], name: string) {
        return ts.some(entries, file => fileNameEqual(file, name));
    }
    function updateFileSystemEntry(entries: string[], baseName: string, isValid: boolean) {
        if (hasEntry(entries, baseName)) {
            if (!isValid) {
                return ts.filterMutate(entries, entry => !fileNameEqual(entry, baseName));
            }
        }
        else if (isValid) {
            return entries.push(baseName);
        }
    }
    function writeFile(fileName: string, data: string, writeByteOrderMark?: boolean): void {
        const path = toPath(fileName);
        const result = getCachedFileSystemEntriesForBaseDir(path);
        if (result) {
            updateFilesOfFileSystemEntry(result, getBaseNameOfFileName(fileName), /*fileExists*/ true);
        }
        return host.writeFile!(fileName, data, writeByteOrderMark);
    }
    function fileExists(fileName: string): boolean {
        const path = toPath(fileName);
        const result = getCachedFileSystemEntriesForBaseDir(path);
        return result && hasEntry(result.files, getBaseNameOfFileName(fileName)) ||
            host.fileExists(fileName);
    }
    function directoryExists(dirPath: string): boolean {
        const path = toPath(dirPath);
        return cachedReadDirectoryResult.has(ts.ensureTrailingDirectorySeparator(path)) || host.directoryExists!(dirPath);
    }
    function createDirectory(dirPath: string) {
        const path = toPath(dirPath);
        const result = getCachedFileSystemEntriesForBaseDir(path);
        const baseFileName = getBaseNameOfFileName(dirPath);
        if (result) {
            updateFileSystemEntry(result.directories, baseFileName, /*isValid*/ true);
        }
        host.createDirectory!(dirPath);
    }
    function getDirectories(rootDir: string): string[] {
        const rootDirPath = toPath(rootDir);
        const result = tryReadDirectory(rootDir, rootDirPath);
        if (result) {
            return result.directories.slice();
        }
        return host.getDirectories!(rootDir);
    }
    function readDirectory(rootDir: string, extensions?: readonly string[], excludes?: readonly string[], includes?: readonly string[], depth?: number): string[] {
        const rootDirPath = toPath(rootDir);
        const result = tryReadDirectory(rootDir, rootDirPath);
        if (result) {
            return ts.matchFiles(rootDir, extensions, excludes, includes, useCaseSensitiveFileNames, currentDirectory, depth, getFileSystemEntries, realpath);
        }
        return host.readDirectory!(rootDir, extensions, excludes, includes, depth);
        function getFileSystemEntries(dir: string): ts.FileSystemEntries {
            const path = toPath(dir);
            if (path === rootDirPath) {
                return result!;
            }
            return tryReadDirectory(dir, path) || ts.emptyFileSystemEntries;
        }
    }
    function realpath(s: string) {
        return host.realpath ? host.realpath(s) : s;
    }
    function addOrDeleteFileOrDirectory(fileOrDirectory: string, fileOrDirectoryPath: ts.Path) {
        const existingResult = getCachedFileSystemEntries(fileOrDirectoryPath);
        if (existingResult) {
            // Just clear the cache for now
            // For now just clear the cache, since this could mean that multiple level entries might need to be re-evaluated
            clearCache();
            return undefined;
        }
        const parentResult = getCachedFileSystemEntriesForBaseDir(fileOrDirectoryPath);
        if (!parentResult) {
            return undefined;
        }
        // This was earlier a file (hence not in cached directory contents)
        // or we never cached the directory containing it
        if (!host.directoryExists) {
            // Since host doesnt support directory exists, clear the cache as otherwise it might not be same
            clearCache();
            return undefined;
        }
        const baseName = getBaseNameOfFileName(fileOrDirectory);
        const fsQueryResult: FileAndDirectoryExistence = {
            fileExists: host.fileExists(fileOrDirectoryPath),
            directoryExists: host.directoryExists(fileOrDirectoryPath)
        };
        if (fsQueryResult.directoryExists || hasEntry(parentResult.directories, baseName)) {
            // Folder added or removed, clear the cache instead of updating the folder and its structure
            clearCache();
        }
        else {
            // No need to update the directory structure, just files
            updateFilesOfFileSystemEntry(parentResult, baseName, fsQueryResult.fileExists);
        }
        return fsQueryResult;
    }
    function addOrDeleteFile(fileName: string, filePath: ts.Path, eventKind: ts.FileWatcherEventKind) {
        if (eventKind === ts.FileWatcherEventKind.Changed) {
            return;
        }
        const parentResult = getCachedFileSystemEntriesForBaseDir(filePath);
        if (parentResult) {
            updateFilesOfFileSystemEntry(parentResult, getBaseNameOfFileName(fileName), eventKind === ts.FileWatcherEventKind.Created);
        }
    }
    function updateFilesOfFileSystemEntry(parentResult: MutableFileSystemEntries, baseName: string, fileExists: boolean) {
        updateFileSystemEntry(parentResult.files, baseName, fileExists);
    }
    function clearCache() {
        cachedReadDirectoryResult.clear();
    }
}
/* @internal */
export enum ConfigFileProgramReloadLevel {
    None,
    /** Update the file name list from the disk */
    Partial,
    /** Reload completely by re-reading contents of config file from disk and updating program */
    Full
}
/**
 * Updates the existing missing file watches with the new set of missing files after new program is created
 */
/* @internal */
export function updateMissingFilePathsWatch(program: ts.Program, missingFileWatches: ts.Map<ts.FileWatcher>, createMissingFileWatch: (missingFilePath: ts.Path) => ts.FileWatcher) {
    const missingFilePaths = program.getMissingFilePaths();
    const newMissingFilePathMap = ts.arrayToSet(missingFilePaths);
    // Update the missing file paths watcher
    ts.mutateMap(missingFileWatches, newMissingFilePathMap, {
        // Watch the missing files
        createNewValue: createMissingFileWatch,
        // Files that are no longer missing (e.g. because they are no longer required)
        // should no longer be watched.
        onDeleteValue: ts.closeFileWatcher
    });
}
/* @internal */
export interface WildcardDirectoryWatcher {
    watcher: ts.FileWatcher;
    flags: ts.WatchDirectoryFlags;
}
/**
 * Updates the existing wild card directory watches with the new set of wild card directories from the config file
 * after new program is created because the config file was reloaded or program was created first time from the config file
 * Note that there is no need to call this function when the program is updated with additional files without reloading config files,
 * as wildcard directories wont change unless reloading config file
 */
/* @internal */
export function updateWatchingWildcardDirectories(existingWatchedForWildcards: ts.Map<WildcardDirectoryWatcher>, wildcardDirectories: ts.Map<ts.WatchDirectoryFlags>, watchDirectory: (directory: string, flags: ts.WatchDirectoryFlags) => ts.FileWatcher) {
    ts.mutateMap(existingWatchedForWildcards, wildcardDirectories, {
        // Create new watch and recursive info
        createNewValue: createWildcardDirectoryWatcher,
        // Close existing watch thats not needed any more
        onDeleteValue: closeFileWatcherOf,
        // Close existing watch that doesnt match in the flags
        onExistingValue: updateWildcardDirectoryWatcher
    });
    function createWildcardDirectoryWatcher(directory: string, flags: ts.WatchDirectoryFlags): WildcardDirectoryWatcher {
        // Create new watch and recursive info
        return {
            watcher: watchDirectory(directory, flags),
            flags
        };
    }
    function updateWildcardDirectoryWatcher(existingWatcher: WildcardDirectoryWatcher, flags: ts.WatchDirectoryFlags, directory: string) {
        // Watcher needs to be updated if the recursive flags dont match
        if (existingWatcher.flags === flags) {
            return;
        }
        existingWatcher.watcher.close();
        existingWatchedForWildcards.set(directory, createWildcardDirectoryWatcher(directory, flags));
    }
}
/* @internal */
export function isEmittedFileOfProgram(program: ts.Program | undefined, file: string) {
    if (!program) {
        return false;
    }
    return program.isEmittedFile(file);
}
/* @internal */
export enum WatchLogLevel {
    None,
    TriggerOnly,
    Verbose
}
/* @internal */
export interface WatchFileHost {
    watchFile(path: string, callback: ts.FileWatcherCallback, pollingInterval?: number, options?: ts.WatchOptions): ts.FileWatcher;
}
/* @internal */
export interface WatchDirectoryHost {
    watchDirectory(path: string, callback: ts.DirectoryWatcherCallback, recursive?: boolean, options?: ts.WatchOptions): ts.FileWatcher;
}
/* @internal */
export type WatchFile<X, Y> = (host: WatchFileHost, file: string, callback: ts.FileWatcherCallback, pollingInterval: ts.PollingInterval, options: ts.WatchOptions | undefined, detailInfo1: X, detailInfo2?: Y) => ts.FileWatcher;
/* @internal */
export type FilePathWatcherCallback = (fileName: string, eventKind: ts.FileWatcherEventKind, filePath: ts.Path) => void;
/* @internal */
export type WatchFilePath<X, Y> = (host: WatchFileHost, file: string, callback: FilePathWatcherCallback, pollingInterval: ts.PollingInterval, options: ts.WatchOptions | undefined, path: ts.Path, detailInfo1: X, detailInfo2?: Y) => ts.FileWatcher;
/* @internal */
export type WatchDirectory<X, Y> = (host: WatchDirectoryHost, directory: string, callback: ts.DirectoryWatcherCallback, flags: ts.WatchDirectoryFlags, options: ts.WatchOptions | undefined, detailInfo1: X, detailInfo2?: Y) => ts.FileWatcher;
/* @internal */
export interface WatchFactory<X, Y> {
    watchFile: WatchFile<X, Y>;
    watchFilePath: WatchFilePath<X, Y>;
    watchDirectory: WatchDirectory<X, Y>;
}
/* @internal */
export function getWatchFactory<X, Y = undefined>(watchLogLevel: WatchLogLevel, log: (s: string) => void, getDetailWatchInfo?: GetDetailWatchInfo<X, Y>): WatchFactory<X, Y> {
    return getWatchFactoryWith(watchLogLevel, log, getDetailWatchInfo, watchFile, watchDirectory);
}
/* @internal */
function getWatchFactoryWith<X, Y = undefined>(watchLogLevel: WatchLogLevel, log: (s: string) => void, getDetailWatchInfo: GetDetailWatchInfo<X, Y> | undefined, watchFile: (host: WatchFileHost, file: string, callback: ts.FileWatcherCallback, watchPriority: ts.PollingInterval, options: ts.WatchOptions | undefined) => ts.FileWatcher, watchDirectory: (host: WatchDirectoryHost, directory: string, callback: ts.DirectoryWatcherCallback, flags: ts.WatchDirectoryFlags, options: ts.WatchOptions | undefined) => ts.FileWatcher): WatchFactory<X, Y> {
    const createFileWatcher: CreateFileWatcher<WatchFileHost, ts.PollingInterval, ts.FileWatcherEventKind, never, X, Y> = getCreateFileWatcher(watchLogLevel, watchFile);
    const createFilePathWatcher: CreateFileWatcher<WatchFileHost, ts.PollingInterval, ts.FileWatcherEventKind, ts.Path, X, Y> = watchLogLevel === WatchLogLevel.None ? watchFilePath : createFileWatcher;
    const createDirectoryWatcher: CreateFileWatcher<WatchDirectoryHost, ts.WatchDirectoryFlags, undefined, never, X, Y> = getCreateFileWatcher(watchLogLevel, watchDirectory);
    if (watchLogLevel === WatchLogLevel.Verbose && ts.sysLog === ts.noop) {
        ts.setSysLog(s => log(s));
    }
    return {
        watchFile: (host, file, callback, pollingInterval, options, detailInfo1, detailInfo2) => createFileWatcher(host, file, callback, pollingInterval, options, /*passThrough*/ undefined, detailInfo1, detailInfo2, watchFile, log, "FileWatcher", getDetailWatchInfo),
        watchFilePath: (host, file, callback, pollingInterval, options, path, detailInfo1, detailInfo2) => createFilePathWatcher(host, file, callback, pollingInterval, options, path, detailInfo1, detailInfo2, watchFile, log, "FileWatcher", getDetailWatchInfo),
        watchDirectory: (host, directory, callback, flags, options, detailInfo1, detailInfo2) => createDirectoryWatcher(host, directory, callback, flags, options, /*passThrough*/ undefined, detailInfo1, detailInfo2, watchDirectory, log, "DirectoryWatcher", getDetailWatchInfo)
    };
}
/* @internal */
function watchFile(host: WatchFileHost, file: string, callback: ts.FileWatcherCallback, pollingInterval: ts.PollingInterval, options: ts.WatchOptions | undefined): ts.FileWatcher {
    return host.watchFile(file, callback, pollingInterval, options);
}
/* @internal */
function watchFilePath(host: WatchFileHost, file: string, callback: FilePathWatcherCallback, pollingInterval: ts.PollingInterval, options: ts.WatchOptions | undefined, path: ts.Path): ts.FileWatcher {
    return watchFile(host, file, (fileName, eventKind) => callback(fileName, eventKind, path), pollingInterval, options);
}
/* @internal */
function watchDirectory(host: WatchDirectoryHost, directory: string, callback: ts.DirectoryWatcherCallback, flags: ts.WatchDirectoryFlags, options: ts.WatchOptions | undefined): ts.FileWatcher {
    return host.watchDirectory(directory, callback, (flags & ts.WatchDirectoryFlags.Recursive) !== 0, options);
}
/* @internal */
type WatchCallback<T, U> = (fileName: string, cbOptional?: T, passThrough?: U) => void;
/* @internal */
type AddWatch<H, T, U, V> = (host: H, file: string, cb: WatchCallback<U, V>, flags: T, options: ts.WatchOptions | undefined, passThrough?: V, detailInfo1?: undefined, detailInfo2?: undefined) => ts.FileWatcher;
/* @internal */
export type GetDetailWatchInfo<X, Y> = (detailInfo1: X, detailInfo2: Y | undefined) => string;
/* @internal */
type CreateFileWatcher<H, T, U, V, X, Y> = (host: H, file: string, cb: WatchCallback<U, V>, flags: T, options: ts.WatchOptions | undefined, passThrough: V | undefined, detailInfo1: X | undefined, detailInfo2: Y | undefined, addWatch: AddWatch<H, T, U, V>, log: (s: string) => void, watchCaption: string, getDetailWatchInfo: GetDetailWatchInfo<X, Y> | undefined) => ts.FileWatcher;
/* @internal */
function getCreateFileWatcher<H, T, U, V, X, Y>(watchLogLevel: WatchLogLevel, addWatch: AddWatch<H, T, U, V>): CreateFileWatcher<H, T, U, V, X, Y> {
    switch (watchLogLevel) {
        case WatchLogLevel.None:
            return addWatch;
        case WatchLogLevel.TriggerOnly:
            return createFileWatcherWithTriggerLogging;
        case WatchLogLevel.Verbose:
            return addWatch === <any>watchDirectory ? createDirectoryWatcherWithLogging : createFileWatcherWithLogging;
    }
}
/* @internal */
function createFileWatcherWithLogging<H, T, U, V, X, Y>(host: H, file: string, cb: WatchCallback<U, V>, flags: T, options: ts.WatchOptions | undefined, passThrough: V | undefined, detailInfo1: X | undefined, detailInfo2: Y | undefined, addWatch: AddWatch<H, T, U, V>, log: (s: string) => void, watchCaption: string, getDetailWatchInfo: GetDetailWatchInfo<X, Y> | undefined): ts.FileWatcher {
    log(`${watchCaption}:: Added:: ${getWatchInfo(file, flags, options, detailInfo1, detailInfo2, getDetailWatchInfo)}`);
    const watcher = createFileWatcherWithTriggerLogging(host, file, cb, flags, options, passThrough, detailInfo1, detailInfo2, addWatch, log, watchCaption, getDetailWatchInfo);
    return {
        close: () => {
            log(`${watchCaption}:: Close:: ${getWatchInfo(file, flags, options, detailInfo1, detailInfo2, getDetailWatchInfo)}`);
            watcher.close();
        }
    };
}
/* @internal */
function createDirectoryWatcherWithLogging<H, T, U, V, X, Y>(host: H, file: string, cb: WatchCallback<U, V>, flags: T, options: ts.WatchOptions | undefined, passThrough: V | undefined, detailInfo1: X | undefined, detailInfo2: Y | undefined, addWatch: AddWatch<H, T, U, V>, log: (s: string) => void, watchCaption: string, getDetailWatchInfo: GetDetailWatchInfo<X, Y> | undefined): ts.FileWatcher {
    const watchInfo = `${watchCaption}:: Added:: ${getWatchInfo(file, flags, options, detailInfo1, detailInfo2, getDetailWatchInfo)}`;
    log(watchInfo);
    const start = ts.timestamp();
    const watcher = createFileWatcherWithTriggerLogging(host, file, cb, flags, options, passThrough, detailInfo1, detailInfo2, addWatch, log, watchCaption, getDetailWatchInfo);
    const elapsed = ts.timestamp() - start;
    log(`Elapsed:: ${elapsed}ms ${watchInfo}`);
    return {
        close: () => {
            const watchInfo = `${watchCaption}:: Close:: ${getWatchInfo(file, flags, options, detailInfo1, detailInfo2, getDetailWatchInfo)}`;
            log(watchInfo);
            const start = ts.timestamp();
            watcher.close();
            const elapsed = ts.timestamp() - start;
            log(`Elapsed:: ${elapsed}ms ${watchInfo}`);
        }
    };
}
/* @internal */
function createFileWatcherWithTriggerLogging<H, T, U, V, X, Y>(host: H, file: string, cb: WatchCallback<U, V>, flags: T, options: ts.WatchOptions | undefined, passThrough: V | undefined, detailInfo1: X | undefined, detailInfo2: Y | undefined, addWatch: AddWatch<H, T, U, V>, log: (s: string) => void, watchCaption: string, getDetailWatchInfo: GetDetailWatchInfo<X, Y> | undefined): ts.FileWatcher {
    return addWatch(host, file, (fileName, cbOptional) => {
        const triggerredInfo = `${watchCaption}:: Triggered with ${fileName} ${cbOptional !== undefined ? cbOptional : ""}:: ${getWatchInfo(file, flags, options, detailInfo1, detailInfo2, getDetailWatchInfo)}`;
        log(triggerredInfo);
        const start = ts.timestamp();
        cb(fileName, cbOptional, passThrough);
        const elapsed = ts.timestamp() - start;
        log(`Elapsed:: ${elapsed}ms ${triggerredInfo}`);
    }, flags, options);
}
/* @internal */
export function getFallbackOptions(options: ts.WatchOptions | undefined): ts.WatchOptions {
    const fallbackPolling = options?.fallbackPolling;
    return {
        watchFile: fallbackPolling !== undefined ?
            fallbackPolling as unknown as ts.WatchFileKind :
            ts.WatchFileKind.PriorityPollingInterval
    };
}
/* @internal */
function getWatchInfo<T, X, Y>(file: string, flags: T, options: ts.WatchOptions | undefined, detailInfo1: X, detailInfo2: Y | undefined, getDetailWatchInfo: GetDetailWatchInfo<X, Y> | undefined) {
    return `WatchInfo: ${file} ${flags} ${JSON.stringify(options)} ${getDetailWatchInfo ? getDetailWatchInfo(detailInfo1, detailInfo2) : detailInfo2 === undefined ? detailInfo1 : `${detailInfo1} ${detailInfo2}`}`;
}
/* @internal */
export function closeFileWatcherOf<T extends {
    watcher: ts.FileWatcher;
}>(objWithWatcher: T) {
    objWithWatcher.watcher.close();
}
