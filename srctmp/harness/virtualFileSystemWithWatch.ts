import * as ts from "./ts";
import * as Harness from "./Harness";
export const libFile: File = {
    path: "/a/lib/lib.d.ts",
    content: `/// <reference no-default-lib="true"/>
interface Boolean {}
interface Function {}
interface CallableFunction {}
interface NewableFunction {}
interface IArguments {}
interface Number { toExponential: any; }
interface Object {}
interface RegExp {}
interface String { charAt: any; }
interface Array<T> { length: number; [n: number]: T; }`
};
export const safeList = {
    path: (<ts.Path>"/safeList.json"),
    content: JSON.stringify({
        commander: "commander",
        express: "express",
        jquery: "jquery",
        lodash: "lodash",
        moment: "moment",
        chroma: "chroma-js"
    })
};
function getExecutingFilePathFromLibFile(): string {
    return ts.combinePaths(ts.getDirectoryPath(libFile.path), "tsc.js");
}
export interface TestServerHostCreationParameters {
    useCaseSensitiveFileNames?: boolean;
    executingFilePath?: string;
    currentDirectory?: string;
    newLine?: string;
    windowsStyleRoot?: string;
    environmentVariables?: ts.Map<string>;
    runWithoutRecursiveWatches?: boolean;
    runWithFallbackPolling?: boolean;
}
export function createWatchedSystem(fileOrFolderList: readonly FileOrFolderOrSymLink[], params?: TestServerHostCreationParameters): TestServerHost {
    return new TestServerHost(/*withSafelist*/ false, fileOrFolderList, params);
}
export function createServerHost(fileOrFolderList: readonly FileOrFolderOrSymLink[], params?: TestServerHostCreationParameters): TestServerHost {
    const host = new TestServerHost(/*withSafelist*/ true, fileOrFolderList, params);
    // Just like sys, patch the host to use writeFile
    ts.patchWriteFileEnsuringDirectory(host);
    return host;
}
export interface File {
    path: string;
    content: string;
    fileSize?: number;
}
export interface Folder {
    path: string;
}
export interface SymLink {
    /** Location of the symlink. */
    path: string;
    /** Relative path to the real file. */
    symLink: string;
}
export type FileOrFolderOrSymLink = File | Folder | SymLink;
function isFile(fileOrFolderOrSymLink: FileOrFolderOrSymLink): fileOrFolderOrSymLink is File {
    return ts.isString((<File>fileOrFolderOrSymLink).content);
}
function isSymLink(fileOrFolderOrSymLink: FileOrFolderOrSymLink): fileOrFolderOrSymLink is SymLink {
    return ts.isString((<SymLink>fileOrFolderOrSymLink).symLink);
}
interface FSEntryBase {
    path: ts.Path;
    fullPath: string;
    modifiedTime: Date;
}
interface FsFile extends FSEntryBase {
    content: string;
    fileSize?: number;
}
interface FsFolder extends FSEntryBase {
    entries: ts.SortedArray<FSEntry>;
}
interface FsSymLink extends FSEntryBase {
    symLink: string;
}
type FSEntry = FsFile | FsFolder | FsSymLink;
function isFsFolder(s: FSEntry): s is FsFolder {
    return s && ts.isArray((<FsFolder>s).entries);
}
function isFsFile(s: FSEntry): s is FsFile {
    return s && ts.isString((<FsFile>s).content);
}
function isFsSymLink(s: FSEntry): s is FsSymLink {
    return s && ts.isString((<FsSymLink>s).symLink);
}
function invokeWatcherCallbacks<T>(callbacks: readonly T[] | undefined, invokeCallback: (cb: T) => void): void {
    if (callbacks) {
        // The array copy is made to ensure that even if one of the callback removes the callbacks,
        // we dont miss any callbacks following it
        const cbs = callbacks.slice();
        for (const cb of cbs) {
            invokeCallback(cb);
        }
    }
}
function createWatcher<T>(map: ts.MultiMap<T>, path: string, callback: T): ts.FileWatcher {
    map.add(path, callback);
    return { close: () => map.remove(path, callback) };
}
function getDiffInKeys<T>(map: ts.Map<T>, expectedKeys: readonly string[]) {
    if (map.size === expectedKeys.length) {
        return "";
    }
    const notInActual: string[] = [];
    const duplicates: string[] = [];
    const seen = ts.createMap<true>();
    ts.forEach(expectedKeys, expectedKey => {
        if (seen.has(expectedKey)) {
            duplicates.push(expectedKey);
            return;
        }
        seen.set(expectedKey, true);
        if (!map.has(expectedKey)) {
            notInActual.push(expectedKey);
        }
    });
    const inActualNotExpected: string[] = [];
    map.forEach((_value, key) => {
        if (!seen.has(key)) {
            inActualNotExpected.push(key);
        }
        seen.set(key, true);
    });
    return `\n\nNotInActual: ${notInActual}\nDuplicates: ${duplicates}\nInActualButNotInExpected: ${inActualNotExpected}`;
}
export function verifyMapSize(caption: string, map: ts.Map<any>, expectedKeys: readonly string[]) {
    assert.equal(map.size, expectedKeys.length, `${caption}: incorrect size of map: Actual keys: ${ts.arrayFrom(map.keys())} Expected: ${expectedKeys}${getDiffInKeys(map, expectedKeys)}`);
}
export type MapValueTester<T, U> = [ts.Map<U[]> | undefined, (value: T) => U];
export function checkMap<T, U = undefined>(caption: string, actual: ts.MultiMap<T>, expectedKeys: ts.ReadonlyMap<number>, valueTester?: MapValueTester<T, U>): void;
export function checkMap<T, U = undefined>(caption: string, actual: ts.MultiMap<T>, expectedKeys: readonly string[], eachKeyCount: number, valueTester?: MapValueTester<T, U>): void;
export function checkMap<T>(caption: string, actual: ts.Map<T> | ts.MultiMap<T>, expectedKeys: readonly string[], eachKeyCount: undefined): void;
export function checkMap<T, U = undefined>(caption: string, actual: ts.Map<T> | ts.MultiMap<T>, expectedKeysMapOrArray: ts.ReadonlyMap<number> | readonly string[], eachKeyCountOrValueTester?: number | MapValueTester<T, U>, valueTester?: MapValueTester<T, U>) {
    const expectedKeys = ts.isArray(expectedKeysMapOrArray) ? ts.arrayToMap(expectedKeysMapOrArray, s => s, () => eachKeyCountOrValueTester as number) : expectedKeysMapOrArray;
    verifyMapSize(caption, actual, ts.isArray(expectedKeysMapOrArray) ? expectedKeysMapOrArray : ts.arrayFrom(expectedKeys.keys()));
    if (!ts.isNumber(eachKeyCountOrValueTester)) {
        valueTester = eachKeyCountOrValueTester;
    }
    const [expectedValues, valueMapper] = valueTester || [undefined, undefined!];
    expectedKeys.forEach((count, name) => {
        assert.isTrue(actual.has(name), `${caption}: expected to contain ${name}, actual keys: ${ts.arrayFrom(actual.keys())}`);
        // Check key information only if eachKeyCount is provided
        if (!ts.isArray(expectedKeysMapOrArray) || eachKeyCountOrValueTester !== undefined) {
            assert.equal((actual as ts.MultiMap<T>).get(name)!.length, count, `${caption}: Expected to be have ${count} entries for ${name}. Actual entry: ${JSON.stringify(actual.get(name))}`);
            if (expectedValues) {
                assert.deepEqual((actual as ts.MultiMap<T>).get(name)!.map(valueMapper), expectedValues.get(name), `${caption}:: expected values mismatch for ${name}`);
            }
        }
    });
}
export function checkArray(caption: string, actual: readonly string[], expected: readonly string[]) {
    checkMap(caption, ts.arrayToMap(actual, ts.identity), expected, /*eachKeyCount*/ undefined);
}
export function checkWatchedFiles(host: TestServerHost, expectedFiles: string[], additionalInfo?: string) {
    checkMap(`watchedFiles:: ${additionalInfo || ""}::`, host.watchedFiles, expectedFiles, /*eachKeyCount*/ undefined);
}
export function checkWatchedFilesDetailed(host: TestServerHost, expectedFiles: ts.ReadonlyMap<number>, expectedPollingIntervals?: ts.Map<ts.PollingInterval[]>): void;
export function checkWatchedFilesDetailed(host: TestServerHost, expectedFiles: readonly string[], eachFileWatchCount: number, expectedPollingIntervals?: ts.Map<ts.PollingInterval[]>): void;
export function checkWatchedFilesDetailed(host: TestServerHost, expectedFiles: ts.ReadonlyMap<number> | readonly string[], eachFileWatchCount?: number | ts.Map<ts.PollingInterval[]>, expectedPollingIntervals?: ts.Map<ts.PollingInterval[]>) {
    if (!ts.isNumber(eachFileWatchCount))
        expectedPollingIntervals = eachFileWatchCount;
    if (ts.isArray(expectedFiles)) {
        checkMap("watchedFiles", host.watchedFiles, expectedFiles, eachFileWatchCount as number, [expectedPollingIntervals, ({ pollingInterval }) => pollingInterval]);
    }
    else {
        checkMap("watchedFiles", host.watchedFiles, expectedFiles, [expectedPollingIntervals, ({ pollingInterval }) => pollingInterval]);
    }
}
export function checkWatchedDirectories(host: TestServerHost, expectedDirectories: string[], recursive: boolean) {
    checkMap(`watchedDirectories${recursive ? " recursive" : ""}`, recursive ? host.fsWatchesRecursive : host.fsWatches, expectedDirectories, /*eachKeyCount*/ undefined);
}
export interface FallbackPollingOptions {
    fallbackPollingInterval: ts.PollingInterval;
    fallbackOptions: ts.WatchOptions | undefined;
}
export function checkWatchedDirectoriesDetailed(host: TestServerHost, expectedDirectories: ts.ReadonlyMap<number>, recursive: boolean, expectedFallbacks?: ts.Map<FallbackPollingOptions[]>): void;
export function checkWatchedDirectoriesDetailed(host: TestServerHost, expectedDirectories: readonly string[], eachDirectoryWatchCount: number, recursive: boolean, expectedFallbacks?: ts.Map<FallbackPollingOptions[]>): void;
export function checkWatchedDirectoriesDetailed(host: TestServerHost, expectedDirectories: ts.ReadonlyMap<number> | readonly string[], recursiveOrEachDirectoryWatchCount: boolean | number, recursiveOrExpectedFallbacks?: boolean | ts.Map<FallbackPollingOptions[]>, expectedFallbacks?: ts.Map<FallbackPollingOptions[]>) {
    if (typeof recursiveOrExpectedFallbacks !== "boolean")
        expectedFallbacks = recursiveOrExpectedFallbacks;
    if (ts.isArray(expectedDirectories)) {
        checkMap(`fsWatches${recursiveOrExpectedFallbacks ? " recursive" : ""}`, recursiveOrExpectedFallbacks as boolean ? host.fsWatchesRecursive : host.fsWatches, expectedDirectories, recursiveOrEachDirectoryWatchCount as number, [expectedFallbacks, ({ fallbackPollingInterval, fallbackOptions }) => ({ fallbackPollingInterval, fallbackOptions })]);
    }
    else {
        recursiveOrExpectedFallbacks = recursiveOrEachDirectoryWatchCount as boolean;
        checkMap(`fsWatches{recursive ? " recursive" : ""}`, recursiveOrExpectedFallbacks ? host.fsWatchesRecursive : host.fsWatches, expectedDirectories, [expectedFallbacks, ({ fallbackPollingInterval, fallbackOptions }) => ({ fallbackPollingInterval, fallbackOptions })]);
    }
}
export function checkOutputContains(host: TestServerHost, expected: readonly string[]) {
    const mapExpected = ts.arrayToSet(expected);
    const mapSeen = ts.createMap<true>();
    for (const f of host.getOutput()) {
        assert.isUndefined(mapSeen.get(f), `Already found ${f} in ${JSON.stringify(host.getOutput())}`);
        if (mapExpected.has(f)) {
            mapExpected.delete(f);
            mapSeen.set(f, true);
        }
    }
    assert.equal(mapExpected.size, 0, `Output has missing ${JSON.stringify(ts.arrayFrom(mapExpected.keys()))} in ${JSON.stringify(host.getOutput())}`);
}
export function checkOutputDoesNotContain(host: TestServerHost, expectedToBeAbsent: string[] | readonly string[]) {
    const mapExpectedToBeAbsent = ts.arrayToSet(expectedToBeAbsent);
    for (const f of host.getOutput()) {
        assert.isFalse(mapExpectedToBeAbsent.has(f), `Contains ${f} in ${JSON.stringify(host.getOutput())}`);
    }
}
class Callbacks {
    private map: TimeOutCallback[] = [];
    private nextId = 1;
    getNextId() {
        return this.nextId;
    }
    register(cb: (...args: any[]) => void, args: any[]) {
        const timeoutId = this.nextId;
        this.nextId++;
        this.map[timeoutId] = cb.bind(/*this*/ undefined, ...args);
        return timeoutId;
    }
    unregister(id: any) {
        if (typeof id === "number") {
            delete this.map[id];
        }
    }
    count() {
        let n = 0;
        for (const _ in this.map) {
            n++;
        }
        return n;
    }
    invoke(invokeKey?: number) {
        if (invokeKey) {
            this.map[invokeKey]();
            delete this.map[invokeKey];
            return;
        }
        // Note: invoking a callback may result in new callbacks been queued,
        // so do not clear the entire callback list regardless. Only remove the
        // ones we have invoked.
        for (const key in this.map) {
            this.map[key]();
            delete this.map[key];
        }
    }
}
type TimeOutCallback = () => any;
export interface TestFileWatcher {
    cb: ts.FileWatcherCallback;
    fileName: string;
    pollingInterval: ts.PollingInterval;
}
export interface TestFsWatcher {
    cb: ts.FsWatchCallback;
    fallbackPollingInterval: ts.PollingInterval;
    fallbackOptions: ts.WatchOptions | undefined;
}
export interface ReloadWatchInvokeOptions {
    /** Invokes the directory watcher for the parent instead of the file changed */
    invokeDirectoryWatcherInsteadOfFileChanged: boolean;
    /** When new file is created, do not invoke watches for it */
    ignoreWatchInvokedWithTriggerAsFileCreate: boolean;
    /** Invoke the file delete, followed by create instead of file changed */
    invokeFileDeleteCreateAsPartInsteadOfChange: boolean;
}
export enum Tsc_WatchFile {
    DynamicPolling = "DynamicPriorityPolling",
    SingleFileWatcherPerName = "SingleFileWatcherPerName"
}
export enum Tsc_WatchDirectory {
    WatchFile = "RecursiveDirectoryUsingFsWatchFile",
    NonRecursiveWatchDirectory = "RecursiveDirectoryUsingNonRecursiveWatchDirectory",
    DynamicPolling = "RecursiveDirectoryUsingDynamicPriorityPolling"
}
const timeIncrements = 1000;
export interface TestServerHostOptions {
    useCaseSensitiveFileNames: boolean;
    executingFilePath: string;
    currentDirectory: string;
    fileOrFolderorSymLinkList: readonly FileOrFolderOrSymLink[];
    newLine?: string;
    useWindowsStylePaths?: boolean;
    environmentVariables?: ts.Map<string>;
}
export class TestServerHost implements ts.server.ServerHost, ts.FormatDiagnosticsHost, ts.ModuleResolutionHost {
    args: string[] = [];
    private readonly output: string[] = [];
    private fs: ts.Map<FSEntry> = ts.createMap<FSEntry>();
    private time = timeIncrements;
    getCanonicalFileName: (s: string) => string;
    private toPath: (f: string) => ts.Path;
    private timeoutCallbacks = new Callbacks();
    private immediateCallbacks = new Callbacks();
    readonly screenClears: number[] = [];
    readonly watchedFiles = ts.createMultiMap<TestFileWatcher>();
    readonly fsWatches = ts.createMultiMap<TestFsWatcher>();
    readonly fsWatchesRecursive = ts.createMultiMap<TestFsWatcher>();
    runWithFallbackPolling: boolean;
    public readonly useCaseSensitiveFileNames: boolean;
    public readonly newLine: string;
    public readonly windowsStyleRoot?: string;
    private readonly environmentVariables?: ts.Map<string>;
    private readonly executingFilePath: string;
    private readonly currentDirectory: string;
    public require: ((initialPath: string, moduleName: string) => ts.RequireResult) | undefined;
    watchFile: ts.HostWatchFile;
    watchDirectory: ts.HostWatchDirectory;
    constructor(public withSafeList: boolean, fileOrFolderorSymLinkList: readonly FileOrFolderOrSymLink[], { useCaseSensitiveFileNames, executingFilePath, currentDirectory, newLine, windowsStyleRoot, environmentVariables, runWithoutRecursiveWatches, runWithFallbackPolling }: TestServerHostCreationParameters = {}) {
        this.useCaseSensitiveFileNames = !!useCaseSensitiveFileNames;
        this.newLine = newLine || "\n";
        this.windowsStyleRoot = windowsStyleRoot;
        this.environmentVariables = environmentVariables;
        currentDirectory = currentDirectory || "/";
        this.getCanonicalFileName = ts.createGetCanonicalFileName(!!useCaseSensitiveFileNames);
        this.toPath = s => ts.toPath(s, currentDirectory, this.getCanonicalFileName);
        this.executingFilePath = this.getHostSpecificPath(executingFilePath || getExecutingFilePathFromLibFile());
        this.currentDirectory = this.getHostSpecificPath(currentDirectory);
        this.runWithFallbackPolling = !!runWithFallbackPolling;
        const tscWatchFile = this.environmentVariables && this.environmentVariables.get("TSC_WATCHFILE");
        const tscWatchDirectory = this.environmentVariables && this.environmentVariables.get("TSC_WATCHDIRECTORY");
        const { watchFile, watchDirectory } = ts.createSystemWatchFunctions({
            // We dont have polling watch file
            // it is essentially fsWatch but lets get that separate from fsWatch and
            // into watchedFiles for easier testing
            pollingWatchFile: tscWatchFile === Tsc_WatchFile.SingleFileWatcherPerName ?
                ts.createSingleFileWatcherPerName(this.watchFileWorker.bind(this), this.useCaseSensitiveFileNames) :
                this.watchFileWorker.bind(this),
            getModifiedTime: this.getModifiedTime.bind(this),
            setTimeout: this.setTimeout.bind(this),
            clearTimeout: this.clearTimeout.bind(this),
            fsWatch: this.fsWatch.bind(this),
            fileExists: this.fileExists.bind(this),
            useCaseSensitiveFileNames: this.useCaseSensitiveFileNames,
            fsSupportsRecursiveFsWatch: tscWatchDirectory ? false : !runWithoutRecursiveWatches,
            directoryExists: this.directoryExists.bind(this),
            getAccessibleSortedChildDirectories: path => this.getDirectories(path),
            realpath: this.realpath.bind(this),
            tscWatchFile,
            tscWatchDirectory
        });
        this.watchFile = watchFile;
        this.watchDirectory = watchDirectory;
        this.reloadFS(fileOrFolderorSymLinkList);
    }
    getNewLine() {
        return this.newLine;
    }
    toNormalizedAbsolutePath(s: string) {
        return ts.getNormalizedAbsolutePath(s, this.currentDirectory);
    }
    toFullPath(s: string) {
        return this.toPath(this.toNormalizedAbsolutePath(s));
    }
    getHostSpecificPath(s: string) {
        if (this.windowsStyleRoot && s.startsWith(ts.directorySeparator)) {
            return this.windowsStyleRoot + s.substring(1);
        }
        return s;
    }
    now() {
        this.time += timeIncrements;
        return new Date(this.time);
    }
    reloadFS(fileOrFolderOrSymLinkList: readonly FileOrFolderOrSymLink[], options?: Partial<ReloadWatchInvokeOptions>) {
        const mapNewLeaves = ts.createMap<true>();
        const isNewFs = this.fs.size === 0;
        fileOrFolderOrSymLinkList = fileOrFolderOrSymLinkList.concat(this.withSafeList ? safeList : []);
        const filesOrFoldersToLoad: readonly FileOrFolderOrSymLink[] = !this.windowsStyleRoot ? fileOrFolderOrSymLinkList :
            fileOrFolderOrSymLinkList.map<FileOrFolderOrSymLink>(f => {
                const result = ts.clone(f);
                result.path = this.getHostSpecificPath(f.path);
                return result;
            });
        for (const fileOrDirectory of filesOrFoldersToLoad) {
            const path = this.toFullPath(fileOrDirectory.path);
            mapNewLeaves.set(path, true);
            // If its a change
            const currentEntry = this.fs.get(path);
            if (currentEntry) {
                if (isFsFile(currentEntry)) {
                    if (isFile(fileOrDirectory)) {
                        // Update file
                        if (currentEntry.content !== fileOrDirectory.content) {
                            this.modifyFile(fileOrDirectory.path, fileOrDirectory.content, options);
                        }
                    }
                    else {
                        // TODO: Changing from file => folder/Symlink
                    }
                }
                else if (isFsSymLink(currentEntry)) {
                    // TODO: update symlinks
                }
                else {
                    // Folder
                    if (isFile(fileOrDirectory)) {
                        // TODO: Changing from folder => file
                    }
                    else {
                        // Folder update: Nothing to do.
                        currentEntry.modifiedTime = this.now();
                        this.invokeFsWatches(currentEntry.fullPath, "change");
                    }
                }
            }
            else {
                this.ensureFileOrFolder(fileOrDirectory, options && options.ignoreWatchInvokedWithTriggerAsFileCreate);
            }
        }
        if (!isNewFs) {
            this.fs.forEach((fileOrDirectory, path) => {
                // If this entry is not from the new file or folder
                if (!mapNewLeaves.get(path)) {
                    // Leaf entries that arent in new list => remove these
                    if (isFsFile(fileOrDirectory) || isFsSymLink(fileOrDirectory) || isFsFolder(fileOrDirectory) && fileOrDirectory.entries.length === 0) {
                        this.removeFileOrFolder(fileOrDirectory, folder => !mapNewLeaves.get(folder.path));
                    }
                }
            });
        }
    }
    modifyFile(filePath: string, content: string, options?: Partial<ReloadWatchInvokeOptions>) {
        const path = this.toFullPath(filePath);
        const currentEntry = this.fs.get(path);
        if (!currentEntry || !isFsFile(currentEntry)) {
            throw new Error(`file not present: ${filePath}`);
        }
        if (options && options.invokeFileDeleteCreateAsPartInsteadOfChange) {
            this.removeFileOrFolder(currentEntry, ts.returnFalse);
            this.ensureFileOrFolder({ path: filePath, content });
        }
        else {
            currentEntry.content = content;
            currentEntry.modifiedTime = this.now();
            this.fs.get(ts.getDirectoryPath(currentEntry.path))!.modifiedTime = this.now();
            if (options && options.invokeDirectoryWatcherInsteadOfFileChanged) {
                const directoryFullPath = ts.getDirectoryPath(currentEntry.fullPath);
                this.invokeFileWatcher(directoryFullPath, ts.FileWatcherEventKind.Changed, /*useFileNameInCallback*/ true);
                this.invokeFsWatchesCallbacks(directoryFullPath, "rename", currentEntry.fullPath);
                this.invokeRecursiveFsWatches(directoryFullPath, "rename", currentEntry.fullPath);
            }
            else {
                this.invokeFileAndFsWatches(currentEntry.fullPath, ts.FileWatcherEventKind.Changed);
            }
        }
    }
    renameFile(fileName: string, newFileName: string) {
        const fullPath = ts.getNormalizedAbsolutePath(fileName, this.currentDirectory);
        const path = this.toPath(fullPath);
        const file = this.fs.get(path) as FsFile;
        ts.Debug.assert(!!file);
        // Only remove the file
        this.removeFileOrFolder(file, ts.returnFalse, /*isRenaming*/ true);
        // Add updated folder with new folder name
        const newFullPath = ts.getNormalizedAbsolutePath(newFileName, this.currentDirectory);
        const newFile = this.toFsFile({ path: newFullPath, content: file.content });
        const newPath = newFile.path;
        const basePath = ts.getDirectoryPath(path);
        ts.Debug.assert(basePath !== path);
        ts.Debug.assert(basePath === ts.getDirectoryPath(newPath));
        const baseFolder = this.fs.get(basePath) as FsFolder;
        this.addFileOrFolderInFolder(baseFolder, newFile);
    }
    renameFolder(folderName: string, newFolderName: string) {
        const fullPath = ts.getNormalizedAbsolutePath(folderName, this.currentDirectory);
        const path = this.toPath(fullPath);
        const folder = this.fs.get(path) as FsFolder;
        ts.Debug.assert(!!folder);
        // Only remove the folder
        this.removeFileOrFolder(folder, ts.returnFalse, /*isRenaming*/ true);
        // Add updated folder with new folder name
        const newFullPath = ts.getNormalizedAbsolutePath(newFolderName, this.currentDirectory);
        const newFolder = this.toFsFolder(newFullPath);
        const newPath = newFolder.path;
        const basePath = ts.getDirectoryPath(path);
        ts.Debug.assert(basePath !== path);
        ts.Debug.assert(basePath === ts.getDirectoryPath(newPath));
        const baseFolder = this.fs.get(basePath) as FsFolder;
        this.addFileOrFolderInFolder(baseFolder, newFolder);
        // Invoke watches for files in the folder as deleted (from old path)
        this.renameFolderEntries(folder, newFolder);
    }
    private renameFolderEntries(oldFolder: FsFolder, newFolder: FsFolder) {
        for (const entry of oldFolder.entries) {
            this.fs.delete(entry.path);
            this.invokeFileAndFsWatches(entry.fullPath, ts.FileWatcherEventKind.Deleted);
            entry.fullPath = ts.combinePaths(newFolder.fullPath, ts.getBaseFileName(entry.fullPath));
            entry.path = this.toPath(entry.fullPath);
            if (newFolder !== oldFolder) {
                newFolder.entries.push(entry);
            }
            this.fs.set(entry.path, entry);
            this.invokeFileAndFsWatches(entry.fullPath, ts.FileWatcherEventKind.Created);
            if (isFsFolder(entry)) {
                this.renameFolderEntries(entry, entry);
            }
        }
    }
    ensureFileOrFolder(fileOrDirectoryOrSymLink: FileOrFolderOrSymLink, ignoreWatchInvokedWithTriggerAsFileCreate?: boolean) {
        if (isFile(fileOrDirectoryOrSymLink)) {
            const file = this.toFsFile(fileOrDirectoryOrSymLink);
            // file may already exist when updating existing type declaration file
            if (!this.fs.get(file.path)) {
                const baseFolder = this.ensureFolder(ts.getDirectoryPath(file.fullPath));
                this.addFileOrFolderInFolder(baseFolder, file, ignoreWatchInvokedWithTriggerAsFileCreate);
            }
        }
        else if (isSymLink(fileOrDirectoryOrSymLink)) {
            const symLink = this.toFsSymLink(fileOrDirectoryOrSymLink);
            ts.Debug.assert(!this.fs.get(symLink.path));
            const baseFolder = this.ensureFolder(ts.getDirectoryPath(symLink.fullPath));
            this.addFileOrFolderInFolder(baseFolder, symLink, ignoreWatchInvokedWithTriggerAsFileCreate);
        }
        else {
            const fullPath = ts.getNormalizedAbsolutePath(fileOrDirectoryOrSymLink.path, this.currentDirectory);
            this.ensureFolder(fullPath);
        }
    }
    private ensureFolder(fullPath: string): FsFolder {
        const path = this.toPath(fullPath);
        let folder = this.fs.get(path) as FsFolder;
        if (!folder) {
            folder = this.toFsFolder(fullPath);
            const baseFullPath = ts.getDirectoryPath(fullPath);
            if (fullPath !== baseFullPath) {
                // Add folder in the base folder
                const baseFolder = this.ensureFolder(baseFullPath);
                this.addFileOrFolderInFolder(baseFolder, folder);
            }
            else {
                // root folder
                ts.Debug.assert(this.fs.size === 0);
                this.fs.set(path, folder);
            }
        }
        ts.Debug.assert(isFsFolder(folder));
        return folder;
    }
    private addFileOrFolderInFolder(folder: FsFolder, fileOrDirectory: FsFile | FsFolder | FsSymLink, ignoreWatch?: boolean) {
        if (!this.fs.has(fileOrDirectory.path)) {
            ts.insertSorted(folder.entries, fileOrDirectory, (a, b) => ts.compareStringsCaseSensitive(ts.getBaseFileName(a.path), ts.getBaseFileName(b.path)));
        }
        folder.modifiedTime = this.now();
        this.fs.set(fileOrDirectory.path, fileOrDirectory);
        if (ignoreWatch) {
            return;
        }
        this.invokeFileAndFsWatches(fileOrDirectory.fullPath, ts.FileWatcherEventKind.Created);
        this.invokeFileAndFsWatches(folder.fullPath, ts.FileWatcherEventKind.Changed);
    }
    private removeFileOrFolder(fileOrDirectory: FsFile | FsFolder | FsSymLink, isRemovableLeafFolder: (folder: FsFolder) => boolean, isRenaming = false) {
        const basePath = ts.getDirectoryPath(fileOrDirectory.path);
        const baseFolder = this.fs.get(basePath) as FsFolder;
        if (basePath !== fileOrDirectory.path) {
            ts.Debug.assert(!!baseFolder);
            baseFolder.modifiedTime = this.now();
            ts.filterMutate(baseFolder.entries, entry => entry !== fileOrDirectory);
        }
        this.fs.delete(fileOrDirectory.path);
        if (isFsFolder(fileOrDirectory)) {
            ts.Debug.assert(fileOrDirectory.entries.length === 0 || isRenaming);
        }
        this.invokeFileAndFsWatches(fileOrDirectory.fullPath, ts.FileWatcherEventKind.Deleted);
        this.invokeFileAndFsWatches(baseFolder.fullPath, ts.FileWatcherEventKind.Changed);
        if (basePath !== fileOrDirectory.path &&
            baseFolder.entries.length === 0 &&
            isRemovableLeafFolder(baseFolder)) {
            this.removeFileOrFolder(baseFolder, isRemovableLeafFolder);
        }
    }
    deleteFile(filePath: string) {
        const path = this.toFullPath(filePath);
        const currentEntry = this.fs.get(path) as FsFile;
        ts.Debug.assert(isFsFile(currentEntry));
        this.removeFileOrFolder(currentEntry, ts.returnFalse);
    }
    deleteFolder(folderPath: string, recursive?: boolean) {
        const path = this.toFullPath(folderPath);
        const currentEntry = this.fs.get(path) as FsFolder;
        ts.Debug.assert(isFsFolder(currentEntry));
        if (recursive && currentEntry.entries.length) {
            const subEntries = currentEntry.entries.slice();
            subEntries.forEach(fsEntry => {
                if (isFsFolder(fsEntry)) {
                    this.deleteFolder(fsEntry.fullPath, recursive);
                }
                else {
                    this.removeFileOrFolder(fsEntry, ts.returnFalse);
                }
            });
        }
        this.removeFileOrFolder(currentEntry, ts.returnFalse);
    }
    private watchFileWorker(fileName: string, cb: ts.FileWatcherCallback, pollingInterval: ts.PollingInterval) {
        return createWatcher(this.watchedFiles, this.toFullPath(fileName), { fileName, cb, pollingInterval });
    }
    private fsWatch(fileOrDirectory: string, _entryKind: ts.FileSystemEntryKind, cb: ts.FsWatchCallback, recursive: boolean, fallbackPollingInterval: ts.PollingInterval, fallbackOptions: ts.WatchOptions | undefined): ts.FileWatcher {
        return this.runWithFallbackPolling ?
            this.watchFile(fileOrDirectory, ts.createFileWatcherCallback(cb), fallbackPollingInterval, fallbackOptions) :
            createWatcher(recursive ? this.fsWatchesRecursive : this.fsWatches, this.toFullPath(fileOrDirectory), { cb, fallbackPollingInterval, fallbackOptions });
    }
    invokeFileWatcher(fileFullPath: string, eventKind: ts.FileWatcherEventKind, useFileNameInCallback?: boolean) {
        invokeWatcherCallbacks(this.watchedFiles.get(this.toPath(fileFullPath)), ({ cb, fileName }) => cb(useFileNameInCallback ? fileName : fileFullPath, eventKind));
    }
    private fsWatchCallback(map: ts.MultiMap<TestFsWatcher>, fullPath: string, eventName: "rename" | "change", entryFullPath?: string) {
        invokeWatcherCallbacks(map.get(this.toPath(fullPath)), ({ cb }) => cb(eventName, entryFullPath ? this.getRelativePathToDirectory(fullPath, entryFullPath) : ""));
    }
    invokeFsWatchesCallbacks(fullPath: string, eventName: "rename" | "change", entryFullPath?: string) {
        this.fsWatchCallback(this.fsWatches, fullPath, eventName, entryFullPath);
    }
    invokeFsWatchesRecursiveCallbacks(fullPath: string, eventName: "rename" | "change", entryFullPath?: string) {
        this.fsWatchCallback(this.fsWatchesRecursive, fullPath, eventName, entryFullPath);
    }
    private getRelativePathToDirectory(directoryFullPath: string, fileFullPath: string) {
        return ts.getRelativePathToDirectoryOrUrl(directoryFullPath, fileFullPath, this.currentDirectory, this.getCanonicalFileName, /*isAbsolutePathAnUrl*/ false);
    }
    private invokeRecursiveFsWatches(fullPath: string, eventName: "rename" | "change", entryFullPath?: string) {
        this.invokeFsWatchesRecursiveCallbacks(fullPath, eventName, entryFullPath);
        const basePath = ts.getDirectoryPath(fullPath);
        if (this.getCanonicalFileName(fullPath) !== this.getCanonicalFileName(basePath)) {
            this.invokeRecursiveFsWatches(basePath, eventName, entryFullPath || fullPath);
        }
    }
    private invokeFsWatches(fullPath: string, eventName: "rename" | "change") {
        this.invokeFsWatchesCallbacks(fullPath, eventName);
        this.invokeFsWatchesCallbacks(ts.getDirectoryPath(fullPath), eventName, fullPath);
        this.invokeRecursiveFsWatches(fullPath, eventName);
    }
    private invokeFileAndFsWatches(fileOrFolderFullPath: string, eventKind: ts.FileWatcherEventKind) {
        this.invokeFileWatcher(fileOrFolderFullPath, eventKind);
        this.invokeFsWatches(fileOrFolderFullPath, eventKind === ts.FileWatcherEventKind.Changed ? "change" : "rename");
    }
    private toFsEntry(path: string): FSEntryBase {
        const fullPath = ts.getNormalizedAbsolutePath(path, this.currentDirectory);
        return {
            path: this.toPath(fullPath),
            fullPath,
            modifiedTime: this.now()
        };
    }
    private toFsFile(file: File): FsFile {
        const fsFile = this.toFsEntry(file.path) as FsFile;
        fsFile.content = file.content;
        fsFile.fileSize = file.fileSize;
        return fsFile;
    }
    private toFsSymLink(symLink: SymLink): FsSymLink {
        const fsSymLink = this.toFsEntry(symLink.path) as FsSymLink;
        fsSymLink.symLink = ts.getNormalizedAbsolutePath(symLink.symLink, ts.getDirectoryPath(fsSymLink.fullPath));
        return fsSymLink;
    }
    private toFsFolder(path: string): FsFolder {
        const fsFolder = this.toFsEntry(path) as FsFolder;
        fsFolder.entries = ([] as FSEntry[] as ts.SortedArray<FSEntry>); // https://github.com/Microsoft/TypeScript/issues/19873
        return fsFolder;
    }
    private getRealFsEntry<T extends FSEntry>(isFsEntry: (fsEntry: FSEntry) => fsEntry is T, path: ts.Path, fsEntry = this.fs.get(path)!): T | undefined {
        if (isFsEntry(fsEntry)) {
            return fsEntry;
        }
        if (isFsSymLink(fsEntry)) {
            return this.getRealFsEntry(isFsEntry, this.toPath(fsEntry.symLink));
        }
        if (fsEntry) {
            // This fs entry is something else
            return undefined;
        }
        const realpath = this.realpath(path);
        if (path !== realpath) {
            return this.getRealFsEntry(isFsEntry, this.toPath(realpath));
        }
        return undefined;
    }
    private isFsFile(fsEntry: FSEntry) {
        return !!this.getRealFile(fsEntry.path, fsEntry);
    }
    private getRealFile(path: ts.Path, fsEntry?: FSEntry): FsFile | undefined {
        return this.getRealFsEntry(isFsFile, path, fsEntry);
    }
    private isFsFolder(fsEntry: FSEntry) {
        return !!this.getRealFolder(fsEntry.path, fsEntry);
    }
    private getRealFolder(path: ts.Path, fsEntry = this.fs.get(path)): FsFolder | undefined {
        return this.getRealFsEntry(isFsFolder, path, fsEntry);
    }
    fileExists(s: string) {
        const path = this.toFullPath(s);
        return !!this.getRealFile(path);
    }
    getModifiedTime(s: string) {
        const path = this.toFullPath(s);
        const fsEntry = this.fs.get(path);
        return (fsEntry && fsEntry.modifiedTime)!; // TODO: GH#18217
    }
    setModifiedTime(s: string, date: Date) {
        const path = this.toFullPath(s);
        const fsEntry = this.fs.get(path);
        if (fsEntry) {
            fsEntry.modifiedTime = date;
        }
    }
    readFile(s: string): string | undefined {
        const fsEntry = this.getRealFile(this.toFullPath(s));
        return fsEntry ? fsEntry.content : undefined;
    }
    getFileSize(s: string) {
        const path = this.toFullPath(s);
        const entry = this.fs.get(path)!;
        if (isFsFile(entry)) {
            return entry.fileSize ? entry.fileSize : entry.content.length;
        }
        return undefined!; // TODO: GH#18217
    }
    directoryExists(s: string) {
        const path = this.toFullPath(s);
        return !!this.getRealFolder(path);
    }
    getDirectories(s: string): string[] {
        const path = this.toFullPath(s);
        const folder = this.getRealFolder(path);
        if (folder) {
            return ts.mapDefined(folder.entries, entry => this.isFsFolder(entry) ? ts.getBaseFileName(entry.fullPath) : undefined);
        }
        ts.Debug.fail(folder ? "getDirectories called on file" : "getDirectories called on missing folder");
        return [];
    }
    readDirectory(path: string, extensions?: readonly string[], exclude?: readonly string[], include?: readonly string[], depth?: number): string[] {
        return ts.matchFiles(path, extensions, exclude, include, this.useCaseSensitiveFileNames, this.getCurrentDirectory(), depth, (dir) => {
            const directories: string[] = [];
            const files: string[] = [];
            const folder = this.getRealFolder(this.toPath(dir));
            if (folder) {
                folder.entries.forEach((entry) => {
                    if (this.isFsFolder(entry)) {
                        directories.push(ts.getBaseFileName(entry.fullPath));
                    }
                    else if (this.isFsFile(entry)) {
                        files.push(ts.getBaseFileName(entry.fullPath));
                    }
                    else {
                        ts.Debug.fail("Unknown entry");
                    }
                });
            }
            return { directories, files };
        }, path => this.realpath(path));
    }
    createHash(s: string): string {
        return Harness.mockHash(s);
    }
    createSHA256Hash(s: string): string {
        return ts.sys.createSHA256Hash!(s);
    }
    // TOOD: record and invoke callbacks to simulate timer events
    setTimeout(callback: TimeOutCallback, _time: number, ...args: any[]) {
        return this.timeoutCallbacks.register(callback, args);
    }
    getNextTimeoutId() {
        return this.timeoutCallbacks.getNextId();
    }
    clearTimeout(timeoutId: any): void {
        this.timeoutCallbacks.unregister(timeoutId);
    }
    clearScreen(): void {
        this.screenClears.push(this.output.length);
    }
    checkTimeoutQueueLengthAndRun(expected: number) {
        this.checkTimeoutQueueLength(expected);
        this.runQueuedTimeoutCallbacks();
    }
    checkTimeoutQueueLength(expected: number) {
        const callbacksCount = this.timeoutCallbacks.count();
        assert.equal(callbacksCount, expected, `expected ${expected} timeout callbacks queued but found ${callbacksCount}.`);
    }
    runQueuedTimeoutCallbacks(timeoutId?: number) {
        try {
            this.timeoutCallbacks.invoke(timeoutId);
        }
        catch (e) {
            if (e.message === this.exitMessage) {
                return;
            }
            throw e;
        }
    }
    runQueuedImmediateCallbacks(checkCount?: number) {
        if (checkCount !== undefined) {
            assert.equal(this.immediateCallbacks.count(), checkCount);
        }
        this.immediateCallbacks.invoke();
    }
    setImmediate(callback: TimeOutCallback, _time: number, ...args: any[]) {
        return this.immediateCallbacks.register(callback, args);
    }
    clearImmediate(timeoutId: any): void {
        this.immediateCallbacks.unregister(timeoutId);
    }
    createDirectory(directoryName: string): void {
        const folder = this.toFsFolder(directoryName);
        // base folder has to be present
        const base = ts.getDirectoryPath(folder.path);
        const baseFolder = this.fs.get(base) as FsFolder;
        ts.Debug.assert(isFsFolder(baseFolder));
        ts.Debug.assert(!this.fs.get(folder.path));
        this.addFileOrFolderInFolder(baseFolder, folder);
    }
    writeFile(path: string, content: string): void {
        const file = this.toFsFile({ path, content });
        // base folder has to be present
        const base = ts.getDirectoryPath(file.path);
        const folder = this.fs.get(base) as FsFolder;
        ts.Debug.assert(isFsFolder(folder));
        if (!this.fs.has(file.path)) {
            this.addFileOrFolderInFolder(folder, file);
        }
        else {
            this.modifyFile(path, content);
        }
    }
    write(message: string) {
        this.output.push(message);
    }
    getOutput(): readonly string[] {
        return this.output;
    }
    clearOutput() {
        ts.clear(this.output);
        this.screenClears.length = 0;
    }
    realpath(s: string): string {
        const fullPath = this.toNormalizedAbsolutePath(s);
        const path = this.toPath(fullPath);
        if (ts.getDirectoryPath(path) === path) {
            // Root
            return s;
        }
        const dirFullPath = this.realpath(ts.getDirectoryPath(fullPath));
        const realFullPath = ts.combinePaths(dirFullPath, ts.getBaseFileName(fullPath));
        const fsEntry = this.fs.get(this.toPath(realFullPath))!;
        if (isFsSymLink(fsEntry)) {
            return this.realpath(fsEntry.symLink);
        }
        return realFullPath;
    }
    readonly exitMessage = "System Exit";
    exitCode: number | undefined;
    readonly resolvePath = (s: string) => s;
    readonly getExecutingFilePath = () => this.executingFilePath;
    readonly getCurrentDirectory = () => this.currentDirectory;
    exit(exitCode?: number) {
        this.exitCode = exitCode;
        throw new Error(this.exitMessage);
    }
    getEnvironmentVariable(name: string) {
        return this.environmentVariables && this.environmentVariables.get(name) || "";
    }
}
export type TestServerHostTrackingWrittenFiles = TestServerHost & {
    writtenFiles: ts.Map<true>;
};
export function changeToHostTrackingWrittenFiles(inputHost: TestServerHost) {
    const host = inputHost as TestServerHostTrackingWrittenFiles;
    const originalWriteFile = host.writeFile;
    host.writtenFiles = ts.createMap<true>();
    host.writeFile = (fileName, content) => {
        originalWriteFile.call(host, fileName, content);
        const path = host.toFullPath(fileName);
        host.writtenFiles.set(path, true);
    };
    return host;
}
export const tsbuildProjectsLocation = "/user/username/projects";
export function getTsBuildProjectFilePath(project: string, file: string) {
    return `${tsbuildProjectsLocation}/${project}/${file}`;
}
export function getTsBuildProjectFile(project: string, file: string): File {
    return {
        path: getTsBuildProjectFilePath(project, file),
        content: Harness.IO.readFile(`${Harness.IO.getWorkspaceRoot()}/tests/projects/${project}/${file}`)!
    };
}
