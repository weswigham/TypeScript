import * as ts from "./ts";
// Used by importFixes, getEditsForFileRename, and declaration emit to synthesize import module specifiers.
/* @internal */
const enum RelativePreference {
    Relative,
    NonRelative,
    Auto
}
// See UserPreferences#importPathEnding
/* @internal */
const enum Ending {
    Minimal,
    Index,
    JsExtension
}
// Processed preferences
/* @internal */
interface Preferences {
    readonly relativePreference: RelativePreference;
    readonly ending: Ending;
}
/* @internal */
function getPreferences({ importModuleSpecifierPreference, importModuleSpecifierEnding }: ts.UserPreferences, compilerOptions: ts.CompilerOptions, importingSourceFile: ts.SourceFile): Preferences {
    return {
        relativePreference: importModuleSpecifierPreference === "relative" ? RelativePreference.Relative : importModuleSpecifierPreference === "non-relative" ? RelativePreference.NonRelative : RelativePreference.Auto,
        ending: getEnding(),
    };
    function getEnding(): Ending {
        switch (importModuleSpecifierEnding) {
            case "minimal": return Ending.Minimal;
            case "index": return Ending.Index;
            case "js": return Ending.JsExtension;
            default: return usesJsExtensionOnImports(importingSourceFile) ? Ending.JsExtension
                : ts.getEmitModuleResolutionKind(compilerOptions) !== ts.ModuleResolutionKind.NodeJs ? Ending.Index : Ending.Minimal;
        }
    }
}
/* @internal */
function getPreferencesForUpdate(compilerOptions: ts.CompilerOptions, oldImportSpecifier: string): Preferences {
    return {
        relativePreference: ts.isExternalModuleNameRelative(oldImportSpecifier) ? RelativePreference.Relative : RelativePreference.NonRelative,
        ending: ts.hasJSFileExtension(oldImportSpecifier) ?
            Ending.JsExtension :
            ts.getEmitModuleResolutionKind(compilerOptions) !== ts.ModuleResolutionKind.NodeJs || ts.endsWith(oldImportSpecifier, "index") ? Ending.Index : Ending.Minimal,
    };
}
/* @internal */
export function updateModuleSpecifier(compilerOptions: ts.CompilerOptions, importingSourceFileName: ts.Path, toFileName: string, host: ts.ModuleSpecifierResolutionHost, files: readonly ts.SourceFile[], redirectTargetsMap: ts.RedirectTargetsMap, oldImportSpecifier: string): string | undefined {
    const res = getModuleSpecifierWorker(compilerOptions, importingSourceFileName, toFileName, host, files, redirectTargetsMap, getPreferencesForUpdate(compilerOptions, oldImportSpecifier));
    if (res === oldImportSpecifier)
        return undefined;
    return res;
}
// Note: importingSourceFile is just for usesJsExtensionOnImports
/* @internal */
export function getModuleSpecifier(compilerOptions: ts.CompilerOptions, importingSourceFile: ts.SourceFile, importingSourceFileName: ts.Path, toFileName: string, host: ts.ModuleSpecifierResolutionHost, files: readonly ts.SourceFile[], preferences: ts.UserPreferences = {}, redirectTargetsMap: ts.RedirectTargetsMap): string {
    return getModuleSpecifierWorker(compilerOptions, importingSourceFileName, toFileName, host, files, redirectTargetsMap, getPreferences(preferences, compilerOptions, importingSourceFile));
}
/* @internal */
export function getNodeModulesPackageName(compilerOptions: ts.CompilerOptions, importingSourceFileName: ts.Path, nodeModulesFileName: string, host: ts.ModuleSpecifierResolutionHost, files: readonly ts.SourceFile[], redirectTargetsMap: ts.RedirectTargetsMap): string | undefined {
    const info = getInfo(importingSourceFileName, host);
    const modulePaths = getAllModulePaths(files, importingSourceFileName, nodeModulesFileName, info.getCanonicalFileName, host, redirectTargetsMap);
    return ts.firstDefined(modulePaths, moduleFileName => tryGetModuleNameAsNodeModule(moduleFileName, info, host, compilerOptions, /*packageNameOnly*/ true));
}
/* @internal */
function getModuleSpecifierWorker(compilerOptions: ts.CompilerOptions, importingSourceFileName: ts.Path, toFileName: string, host: ts.ModuleSpecifierResolutionHost, files: readonly ts.SourceFile[], redirectTargetsMap: ts.RedirectTargetsMap, preferences: Preferences): string {
    const info = getInfo(importingSourceFileName, host);
    const modulePaths = getAllModulePaths(files, importingSourceFileName, toFileName, info.getCanonicalFileName, host, redirectTargetsMap);
    return ts.firstDefined(modulePaths, moduleFileName => tryGetModuleNameAsNodeModule(moduleFileName, info, host, compilerOptions)) ||
        getLocalModuleSpecifier(toFileName, info, compilerOptions, preferences);
}
/** Returns an import for each symlink and for the realpath. */
/* @internal */
export function getModuleSpecifiers(moduleSymbol: ts.Symbol, compilerOptions: ts.CompilerOptions, importingSourceFile: ts.SourceFile, host: ts.ModuleSpecifierResolutionHost, files: readonly ts.SourceFile[], userPreferences: ts.UserPreferences, redirectTargetsMap: ts.RedirectTargetsMap): readonly string[] {
    const ambient = tryGetModuleNameFromAmbientModule(moduleSymbol);
    if (ambient)
        return [ambient];
    const info = getInfo(importingSourceFile.path, host);
    const moduleSourceFile = ts.getSourceFileOfNode(moduleSymbol.valueDeclaration || ts.getNonAugmentationDeclaration(moduleSymbol));
    const modulePaths = getAllModulePaths(files, importingSourceFile.path, moduleSourceFile.originalFileName, info.getCanonicalFileName, host, redirectTargetsMap);
    const preferences = getPreferences(userPreferences, compilerOptions, importingSourceFile);
    const global = ts.mapDefined(modulePaths, moduleFileName => tryGetModuleNameAsNodeModule(moduleFileName, info, host, compilerOptions));
    return global.length ? global : modulePaths.map(moduleFileName => getLocalModuleSpecifier(moduleFileName, info, compilerOptions, preferences));
}
/* @internal */
interface Info {
    readonly getCanonicalFileName: ts.GetCanonicalFileName;
    readonly sourceDirectory: ts.Path;
}
// importingSourceFileName is separate because getEditsForFileRename may need to specify an updated path
/* @internal */
function getInfo(importingSourceFileName: ts.Path, host: ts.ModuleSpecifierResolutionHost): Info {
    const getCanonicalFileName = ts.createGetCanonicalFileName(host.useCaseSensitiveFileNames ? host.useCaseSensitiveFileNames() : true);
    const sourceDirectory = ts.getDirectoryPath(importingSourceFileName);
    return { getCanonicalFileName, sourceDirectory };
}
/* @internal */
function getLocalModuleSpecifier(moduleFileName: string, { getCanonicalFileName, sourceDirectory }: Info, compilerOptions: ts.CompilerOptions, { ending, relativePreference }: Preferences): string {
    const { baseUrl, paths, rootDirs } = compilerOptions;
    const relativePath = rootDirs && tryGetModuleNameFromRootDirs(rootDirs, moduleFileName, sourceDirectory, getCanonicalFileName, ending, compilerOptions) ||
        removeExtensionAndIndexPostFix(ts.ensurePathIsNonModuleName(ts.getRelativePathFromDirectory(sourceDirectory, moduleFileName, getCanonicalFileName)), ending, compilerOptions);
    if (!baseUrl || relativePreference === RelativePreference.Relative) {
        return relativePath;
    }
    const relativeToBaseUrl = getRelativePathIfInDirectory(moduleFileName, baseUrl, getCanonicalFileName);
    if (!relativeToBaseUrl) {
        return relativePath;
    }
    const importRelativeToBaseUrl = removeExtensionAndIndexPostFix(relativeToBaseUrl, ending, compilerOptions);
    const fromPaths = paths && tryGetModuleNameFromPaths(ts.removeFileExtension(relativeToBaseUrl), importRelativeToBaseUrl, paths);
    const nonRelative = fromPaths === undefined ? importRelativeToBaseUrl : fromPaths;
    if (relativePreference === RelativePreference.NonRelative) {
        return nonRelative;
    }
    if (relativePreference !== RelativePreference.Auto)
        ts.Debug.assertNever(relativePreference);
    // Prefer a relative import over a baseUrl import if it has fewer components.
    return isPathRelativeToParent(nonRelative) || countPathComponents(relativePath) < countPathComponents(nonRelative) ? relativePath : nonRelative;
}
/* @internal */
export function countPathComponents(path: string): number {
    let count = 0;
    for (let i = ts.startsWith(path, "./") ? 2 : 0; i < path.length; i++) {
        if (path.charCodeAt(i) === ts.CharacterCodes.slash)
            count++;
    }
    return count;
}
/* @internal */
function usesJsExtensionOnImports({ imports }: ts.SourceFile): boolean {
    return ts.firstDefined(imports, ({ text }) => ts.pathIsRelative(text) ? ts.hasJSFileExtension(text) : undefined) || false;
}
/* @internal */
function numberOfDirectorySeparators(str: string) {
    const match = str.match(/\//g);
    return match ? match.length : 0;
}
/* @internal */
function comparePathsByNumberOfDirectrorySeparators(a: string, b: string) {
    return ts.compareValues(numberOfDirectorySeparators(a), numberOfDirectorySeparators(b));
}
/**
 * Looks for existing imports that use symlinks to this module.
 * Symlinks will be returned first so they are preferred over the real path.
 */
/* @internal */
function getAllModulePaths(files: readonly ts.SourceFile[], importingFileName: string, importedFileName: string, getCanonicalFileName: ts.GetCanonicalFileName, host: ts.ModuleSpecifierResolutionHost, redirectTargetsMap: ts.RedirectTargetsMap): readonly string[] {
    const redirects = redirectTargetsMap.get(importedFileName);
    const importedFileNames = redirects ? [...redirects, importedFileName] : [importedFileName];
    const cwd = host.getCurrentDirectory ? host.getCurrentDirectory() : "";
    const targets = importedFileNames.map(f => ts.getNormalizedAbsolutePath(f, cwd));
    const links = host.getProbableSymlinks
        ? host.getProbableSymlinks(files)
        : ts.discoverProbableSymlinks(files, getCanonicalFileName, cwd);
    const result: string[] = [];
    const compareStrings = (!host.useCaseSensitiveFileNames || host.useCaseSensitiveFileNames()) ? ts.compareStringsCaseSensitive : ts.compareStringsCaseInsensitive;
    links.forEach((resolved, path) => {
        if (ts.startsWithDirectory(importingFileName, resolved, getCanonicalFileName)) {
            return; // Don't want to a package to globally import from itself
        }
        const target = ts.find(targets, t => compareStrings(t.slice(0, resolved.length + 1), resolved + "/") === ts.Comparison.EqualTo);
        if (target === undefined)
            return;
        const relative = ts.getRelativePathFromDirectory(resolved, target, getCanonicalFileName);
        const option = ts.resolvePath(path, relative);
        if (!host.fileExists || host.fileExists(option)) {
            result.push(option);
        }
    });
    result.push(...targets);
    if (result.length < 2)
        return result;
    // Sort by paths closest to importing file Name directory
    const allFileNames = ts.arrayToMap(result, ts.identity, getCanonicalFileName);
    const sortedPaths: string[] = [];
    for (let directory = ts.getDirectoryPath(ts.toPath(importingFileName, cwd, getCanonicalFileName)); allFileNames.size !== 0; directory = ts.getDirectoryPath(directory)) {
        const directoryStart = ts.ensureTrailingDirectorySeparator(directory);
        let pathsInDirectory: string[] | undefined;
        allFileNames.forEach((canonicalFileName, fileName) => {
            if (ts.startsWith(canonicalFileName, directoryStart)) {
                (pathsInDirectory || (pathsInDirectory = [])).push(fileName);
                allFileNames.delete(fileName);
            }
        });
        if (pathsInDirectory) {
            if (pathsInDirectory.length > 1) {
                pathsInDirectory.sort(comparePathsByNumberOfDirectrorySeparators);
            }
            sortedPaths.push(...pathsInDirectory);
        }
    }
    return sortedPaths;
}
/* @internal */
function tryGetModuleNameFromAmbientModule(moduleSymbol: ts.Symbol): string | undefined {
    const decl = (ts.find(moduleSymbol.declarations, d => ts.isNonGlobalAmbientModule(d) && (!ts.isExternalModuleAugmentation(d) || !ts.isExternalModuleNameRelative(ts.getTextOfIdentifierOrLiteral(d.name)))) as (ts.ModuleDeclaration & {
        name: ts.StringLiteral;
    }) | undefined);
    if (decl) {
        return decl.name.text;
    }
}
/* @internal */
function tryGetModuleNameFromPaths(relativeToBaseUrlWithIndex: string, relativeToBaseUrl: string, paths: ts.MapLike<readonly string[]>): string | undefined {
    for (const key in paths) {
        for (const patternText of paths[key]) {
            const pattern = ts.removeFileExtension(ts.normalizePath(patternText));
            const indexOfStar = pattern.indexOf("*");
            if (indexOfStar !== -1) {
                const prefix = pattern.substr(0, indexOfStar);
                const suffix = pattern.substr(indexOfStar + 1);
                if (relativeToBaseUrl.length >= prefix.length + suffix.length &&
                    ts.startsWith(relativeToBaseUrl, prefix) &&
                    ts.endsWith(relativeToBaseUrl, suffix) ||
                    !suffix && relativeToBaseUrl === ts.removeTrailingDirectorySeparator(prefix)) {
                    const matchedStar = relativeToBaseUrl.substr(prefix.length, relativeToBaseUrl.length - suffix.length);
                    return key.replace("*", matchedStar);
                }
            }
            else if (pattern === relativeToBaseUrl || pattern === relativeToBaseUrlWithIndex) {
                return key;
            }
        }
    }
}
/* @internal */
function tryGetModuleNameFromRootDirs(rootDirs: readonly string[], moduleFileName: string, sourceDirectory: string, getCanonicalFileName: (file: string) => string, ending: Ending, compilerOptions: ts.CompilerOptions): string | undefined {
    const normalizedTargetPath = getPathRelativeToRootDirs(moduleFileName, rootDirs, getCanonicalFileName);
    if (normalizedTargetPath === undefined) {
        return undefined;
    }
    const normalizedSourcePath = getPathRelativeToRootDirs(sourceDirectory, rootDirs, getCanonicalFileName);
    const relativePath = normalizedSourcePath !== undefined ? ts.ensurePathIsNonModuleName(ts.getRelativePathFromDirectory(normalizedSourcePath, normalizedTargetPath, getCanonicalFileName)) : normalizedTargetPath;
    return ts.getEmitModuleResolutionKind(compilerOptions) === ts.ModuleResolutionKind.NodeJs
        ? removeExtensionAndIndexPostFix(relativePath, ending, compilerOptions)
        : ts.removeFileExtension(relativePath);
}
/* @internal */
function tryGetModuleNameAsNodeModule(moduleFileName: string, { getCanonicalFileName, sourceDirectory }: Info, host: ts.ModuleSpecifierResolutionHost, options: ts.CompilerOptions, packageNameOnly?: boolean): string | undefined {
    if (!host.fileExists || !host.readFile) {
        return undefined;
    }
    const parts: NodeModulePathParts = getNodeModulePathParts(moduleFileName)!;
    if (!parts) {
        return undefined;
    }
    let packageJsonContent: any | undefined;
    const packageRootPath = moduleFileName.substring(0, parts.packageRootIndex);
    if (!packageNameOnly) {
        const packageJsonPath = ts.combinePaths(packageRootPath, "package.json");
        packageJsonContent = host.fileExists(packageJsonPath)
            ? JSON.parse(host.readFile(packageJsonPath)!)
            : undefined;
        const versionPaths = packageJsonContent && packageJsonContent.typesVersions
            ? ts.getPackageJsonTypesVersionsPaths(packageJsonContent.typesVersions)
            : undefined;
        if (versionPaths) {
            const subModuleName = moduleFileName.slice(parts.packageRootIndex + 1);
            const fromPaths = tryGetModuleNameFromPaths(ts.removeFileExtension(subModuleName), removeExtensionAndIndexPostFix(subModuleName, Ending.Minimal, options), versionPaths.paths);
            if (fromPaths !== undefined) {
                moduleFileName = ts.combinePaths(moduleFileName.slice(0, parts.packageRootIndex), fromPaths);
            }
        }
    }
    // Simplify the full file path to something that can be resolved by Node.
    // If the module could be imported by a directory name, use that directory's name
    const moduleSpecifier = packageNameOnly ? moduleFileName : getDirectoryOrExtensionlessFileName(moduleFileName);
    const globalTypingsCacheLocation = host.getGlobalTypingsCacheLocation && host.getGlobalTypingsCacheLocation();
    // Get a path that's relative to node_modules or the importing file's path
    // if node_modules folder is in this folder or any of its parent folders, no need to keep it.
    const pathToTopLevelNodeModules = getCanonicalFileName(moduleSpecifier.substring(0, parts.topLevelNodeModulesIndex));
    if (!(ts.startsWith(sourceDirectory, pathToTopLevelNodeModules) || globalTypingsCacheLocation && ts.startsWith(getCanonicalFileName(globalTypingsCacheLocation), pathToTopLevelNodeModules))) {
        return undefined;
    }
    // If the module was found in @types, get the actual Node package name
    const nodeModulesDirectoryName = moduleSpecifier.substring(parts.topLevelPackageNameIndex + 1);
    const packageName = ts.getPackageNameFromTypesPackageName(nodeModulesDirectoryName);
    // For classic resolution, only allow importing from node_modules/@types, not other node_modules
    return ts.getEmitModuleResolutionKind(options) !== ts.ModuleResolutionKind.NodeJs && packageName === nodeModulesDirectoryName ? undefined : packageName;
    function getDirectoryOrExtensionlessFileName(path: string): string {
        // If the file is the main module, it can be imported by the package name
        if (packageJsonContent) {
            const mainFileRelative = packageJsonContent.typings || packageJsonContent.types || packageJsonContent.main;
            if (mainFileRelative) {
                const mainExportFile = ts.toPath(mainFileRelative, packageRootPath, getCanonicalFileName);
                if (ts.removeFileExtension(mainExportFile) === ts.removeFileExtension(getCanonicalFileName(path))) {
                    return packageRootPath;
                }
            }
        }
        // We still have a file name - remove the extension
        const fullModulePathWithoutExtension = ts.removeFileExtension(path);
        // If the file is /index, it can be imported by its directory name
        // IFF there is not _also_ a file by the same name
        if (getCanonicalFileName(fullModulePathWithoutExtension.substring(parts.fileNameIndex)) === "/index" && !tryGetAnyFileFromPath(host, fullModulePathWithoutExtension.substring(0, parts.fileNameIndex))) {
            return fullModulePathWithoutExtension.substring(0, parts.fileNameIndex);
        }
        return fullModulePathWithoutExtension;
    }
}
/* @internal */
function tryGetAnyFileFromPath(host: ts.ModuleSpecifierResolutionHost, path: string) {
    if (!host.fileExists)
        return;
    // We check all js, `node` and `json` extensions in addition to TS, since node module resolution would also choose those over the directory
    const extensions = ts.getSupportedExtensions({ allowJs: true }, [{ extension: "node", isMixedContent: false }, { extension: "json", isMixedContent: false, scriptKind: ts.ScriptKind.JSON }]);
    for (const e of extensions) {
        const fullPath = path + e;
        if (host.fileExists(fullPath)) {
            return fullPath;
        }
    }
}
/* @internal */
interface NodeModulePathParts {
    readonly topLevelNodeModulesIndex: number;
    readonly topLevelPackageNameIndex: number;
    readonly packageRootIndex: number;
    readonly fileNameIndex: number;
}
/* @internal */
function getNodeModulePathParts(fullPath: string): NodeModulePathParts | undefined {
    // If fullPath can't be valid module file within node_modules, returns undefined.
    // Example of expected pattern: /base/path/node_modules/[@scope/otherpackage/@otherscope/node_modules/]package/[subdirectory/]file.js
    // Returns indices:                       ^            ^                                                      ^             ^
    let topLevelNodeModulesIndex = 0;
    let topLevelPackageNameIndex = 0;
    let packageRootIndex = 0;
    let fileNameIndex = 0;
    const enum States {
        BeforeNodeModules,
        NodeModules,
        Scope,
        PackageContent
    }
    let partStart = 0;
    let partEnd = 0;
    let state = States.BeforeNodeModules;
    while (partEnd >= 0) {
        partStart = partEnd;
        partEnd = fullPath.indexOf("/", partStart + 1);
        switch (state) {
            case States.BeforeNodeModules:
                if (fullPath.indexOf(ts.nodeModulesPathPart, partStart) === partStart) {
                    topLevelNodeModulesIndex = partStart;
                    topLevelPackageNameIndex = partEnd;
                    state = States.NodeModules;
                }
                break;
            case States.NodeModules:
            case States.Scope:
                if (state === States.NodeModules && fullPath.charAt(partStart + 1) === "@") {
                    state = States.Scope;
                }
                else {
                    packageRootIndex = partEnd;
                    state = States.PackageContent;
                }
                break;
            case States.PackageContent:
                if (fullPath.indexOf(ts.nodeModulesPathPart, partStart) === partStart) {
                    state = States.NodeModules;
                }
                else {
                    state = States.PackageContent;
                }
                break;
        }
    }
    fileNameIndex = partStart;
    return state > States.NodeModules ? { topLevelNodeModulesIndex, topLevelPackageNameIndex, packageRootIndex, fileNameIndex } : undefined;
}
/* @internal */
function getPathRelativeToRootDirs(path: string, rootDirs: readonly string[], getCanonicalFileName: ts.GetCanonicalFileName): string | undefined {
    return ts.firstDefined(rootDirs, rootDir => {
        const relativePath = getRelativePathIfInDirectory(path, rootDir, getCanonicalFileName)!; // TODO: GH#18217
        return isPathRelativeToParent(relativePath) ? undefined : relativePath;
    });
}
/* @internal */
function removeExtensionAndIndexPostFix(fileName: string, ending: Ending, options: ts.CompilerOptions): string {
    if (ts.fileExtensionIs(fileName, ts.Extension.Json))
        return fileName;
    const noExtension = ts.removeFileExtension(fileName);
    switch (ending) {
        case Ending.Minimal:
            return ts.removeSuffix(noExtension, "/index");
        case Ending.Index:
            return noExtension;
        case Ending.JsExtension:
            return noExtension + getJSExtensionForFile(fileName, options);
        default:
            return ts.Debug.assertNever(ending);
    }
}
/* @internal */
function getJSExtensionForFile(fileName: string, options: ts.CompilerOptions): ts.Extension {
    const ext = ts.extensionFromPath(fileName);
    switch (ext) {
        case ts.Extension.Ts:
        case ts.Extension.Dts:
            return ts.Extension.Js;
        case ts.Extension.Tsx:
            return options.jsx === ts.JsxEmit.Preserve ? ts.Extension.Jsx : ts.Extension.Js;
        case ts.Extension.Js:
        case ts.Extension.Jsx:
        case ts.Extension.Json:
            return ext;
        case ts.Extension.TsBuildInfo:
            return ts.Debug.fail(`Extension ${ts.Extension.TsBuildInfo} is unsupported:: FileName:: ${fileName}`);
        default:
            return ts.Debug.assertNever(ext);
    }
}
/* @internal */
function getRelativePathIfInDirectory(path: string, directoryPath: string, getCanonicalFileName: ts.GetCanonicalFileName): string | undefined {
    const relativePath = ts.getRelativePathToDirectoryOrUrl(directoryPath, path, directoryPath, getCanonicalFileName, /*isAbsolutePathAnUrl*/ false);
    return ts.isRootedDiskPath(relativePath) ? undefined : relativePath;
}
/* @internal */
function isPathRelativeToParent(path: string): boolean {
    return ts.startsWith(path, "..");
}
