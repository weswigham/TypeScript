import * as ts from "./ts";
/* @internal */
export function getStringLiteralCompletions(sourceFile: ts.SourceFile, position: number, contextToken: ts.Node | undefined, checker: ts.TypeChecker, options: ts.CompilerOptions, host: ts.LanguageServiceHost, log: ts.Completions.Log, preferences: ts.UserPreferences): ts.CompletionInfo | undefined {
    if (ts.isInReferenceComment(sourceFile, position)) {
        const entries = getTripleSlashReferenceCompletion(sourceFile, position, options, host);
        return entries && convertPathCompletions(entries);
    }
    if (ts.isInString(sourceFile, position, contextToken)) {
        return !contextToken || !ts.isStringLiteralLike(contextToken)
            ? undefined
            : convertStringLiteralCompletions(getStringLiteralCompletionEntries(sourceFile, contextToken, position, checker, options, host), sourceFile, checker, log, preferences);
    }
}
/* @internal */
function convertStringLiteralCompletions(completion: StringLiteralCompletion | undefined, sourceFile: ts.SourceFile, checker: ts.TypeChecker, log: ts.Completions.Log, preferences: ts.UserPreferences): ts.CompletionInfo | undefined {
    if (completion === undefined) {
        return undefined;
    }
    switch (completion.kind) {
        case StringLiteralCompletionKind.Paths:
            return convertPathCompletions(completion.paths);
        case StringLiteralCompletionKind.Properties: {
            const entries: ts.CompletionEntry[] = [];
            ts.Completions.getCompletionEntriesFromSymbols(completion.symbols, entries, sourceFile, sourceFile, checker, ts.ScriptTarget.ESNext, log, ts.Completions.CompletionKind.String, preferences); // Target will not be used, so arbitrary
            return { isGlobalCompletion: false, isMemberCompletion: true, isNewIdentifierLocation: completion.hasIndexSignature, entries };
        }
        case StringLiteralCompletionKind.Types: {
            const entries = completion.types.map(type => ({ name: type.value, kindModifiers: ts.ScriptElementKindModifier.none, kind: ts.ScriptElementKind.string, sortText: "0" }));
            return { isGlobalCompletion: false, isMemberCompletion: false, isNewIdentifierLocation: completion.isNewIdentifier, entries };
        }
        default:
            return ts.Debug.assertNever(completion);
    }
}
/* @internal */
export function getStringLiteralCompletionDetails(name: string, sourceFile: ts.SourceFile, position: number, contextToken: ts.Node | undefined, checker: ts.TypeChecker, options: ts.CompilerOptions, host: ts.LanguageServiceHost, cancellationToken: ts.CancellationToken) {
    if (!contextToken || !ts.isStringLiteralLike(contextToken))
        return undefined;
    const completions = getStringLiteralCompletionEntries(sourceFile, contextToken, position, checker, options, host);
    return completions && stringLiteralCompletionDetails(name, contextToken, completions, sourceFile, checker, cancellationToken);
}
/* @internal */
function stringLiteralCompletionDetails(name: string, location: ts.Node, completion: StringLiteralCompletion, sourceFile: ts.SourceFile, checker: ts.TypeChecker, cancellationToken: ts.CancellationToken): ts.CompletionEntryDetails | undefined {
    switch (completion.kind) {
        case StringLiteralCompletionKind.Paths: {
            const match = ts.find(completion.paths, p => p.name === name);
            return match && ts.Completions.createCompletionDetails(name, kindModifiersFromExtension(match.extension), match.kind, [ts.textPart(name)]);
        }
        case StringLiteralCompletionKind.Properties: {
            const match = ts.find(completion.symbols, s => s.name === name);
            return match && ts.Completions.createCompletionDetailsForSymbol(match, checker, sourceFile, location, cancellationToken);
        }
        case StringLiteralCompletionKind.Types:
            return ts.find(completion.types, t => t.value === name) ? ts.Completions.createCompletionDetails(name, ts.ScriptElementKindModifier.none, ts.ScriptElementKind.typeElement, [ts.textPart(name)]) : undefined;
        default:
            return ts.Debug.assertNever(completion);
    }
}
/* @internal */
function convertPathCompletions(pathCompletions: readonly PathCompletion[]): ts.CompletionInfo {
    const isGlobalCompletion = false; // We don't want the editor to offer any other completions, such as snippets, inside a comment.
    const isNewIdentifierLocation = true; // The user may type in a path that doesn't yet exist, creating a "new identifier" with respect to the collection of identifiers the server is aware of.
    const entries = pathCompletions.map(({ name, kind, span, extension }): ts.CompletionEntry => ({ name, kind, kindModifiers: kindModifiersFromExtension(extension), sortText: ts.Completions.SortText.LocationPriority, replacementSpan: span }));
    return { isGlobalCompletion, isMemberCompletion: false, isNewIdentifierLocation, entries };
}
/* @internal */
function kindModifiersFromExtension(extension: ts.Extension | undefined): ts.ScriptElementKindModifier {
    switch (extension) {
        case ts.Extension.Dts: return ts.ScriptElementKindModifier.dtsModifier;
        case ts.Extension.Js: return ts.ScriptElementKindModifier.jsModifier;
        case ts.Extension.Json: return ts.ScriptElementKindModifier.jsonModifier;
        case ts.Extension.Jsx: return ts.ScriptElementKindModifier.jsxModifier;
        case ts.Extension.Ts: return ts.ScriptElementKindModifier.tsModifier;
        case ts.Extension.Tsx: return ts.ScriptElementKindModifier.tsxModifier;
        case ts.Extension.TsBuildInfo: return ts.Debug.fail(`Extension ${ts.Extension.TsBuildInfo} is unsupported.`);
        case undefined: return ts.ScriptElementKindModifier.none;
        default:
            return ts.Debug.assertNever(extension);
    }
}
/* @internal */
const enum StringLiteralCompletionKind {
    Paths,
    Properties,
    Types
}
/* @internal */
interface StringLiteralCompletionsFromProperties {
    readonly kind: StringLiteralCompletionKind.Properties;
    readonly symbols: readonly ts.Symbol[];
    readonly hasIndexSignature: boolean;
}
/* @internal */
interface StringLiteralCompletionsFromTypes {
    readonly kind: StringLiteralCompletionKind.Types;
    readonly types: readonly ts.StringLiteralType[];
    readonly isNewIdentifier: boolean;
}
/* @internal */
type StringLiteralCompletion = {
    readonly kind: StringLiteralCompletionKind.Paths;
    readonly paths: readonly PathCompletion[];
} | StringLiteralCompletionsFromProperties | StringLiteralCompletionsFromTypes;
/* @internal */
function getStringLiteralCompletionEntries(sourceFile: ts.SourceFile, node: ts.StringLiteralLike, position: number, typeChecker: ts.TypeChecker, compilerOptions: ts.CompilerOptions, host: ts.LanguageServiceHost): StringLiteralCompletion | undefined {
    const { parent } = node;
    switch (parent.kind) {
        case ts.SyntaxKind.LiteralType:
            switch (parent.parent.kind) {
                case ts.SyntaxKind.TypeReference:
                    return { kind: StringLiteralCompletionKind.Types, types: getStringLiteralTypes(typeChecker.getTypeArgumentConstraint((parent as ts.LiteralTypeNode))), isNewIdentifier: false };
                case ts.SyntaxKind.IndexedAccessType:
                    // Get all apparent property names
                    // i.e. interface Foo {
                    //          foo: string;
                    //          bar: string;
                    //      }
                    //      let x: Foo["/*completion position*/"]
                    return stringLiteralCompletionsFromProperties(typeChecker.getTypeFromTypeNode((parent.parent as ts.IndexedAccessTypeNode).objectType));
                case ts.SyntaxKind.ImportType:
                    return { kind: StringLiteralCompletionKind.Paths, paths: getStringLiteralCompletionsFromModuleNames(sourceFile, node, compilerOptions, host, typeChecker) };
                case ts.SyntaxKind.UnionType: {
                    if (!ts.isTypeReferenceNode(parent.parent.parent))
                        return undefined;
                    const alreadyUsedTypes = getAlreadyUsedTypesInStringLiteralUnion((parent.parent as ts.UnionTypeNode), (parent as ts.LiteralTypeNode));
                    const types = getStringLiteralTypes(typeChecker.getTypeArgumentConstraint((parent.parent as ts.UnionTypeNode))).filter(t => !ts.contains(alreadyUsedTypes, t.value));
                    return { kind: StringLiteralCompletionKind.Types, types, isNewIdentifier: false };
                }
                default:
                    return undefined;
            }
        case ts.SyntaxKind.PropertyAssignment:
            if (ts.isObjectLiteralExpression(parent.parent) && (<ts.PropertyAssignment>parent).name === node) {
                // Get quoted name of properties of the object literal expression
                // i.e. interface ConfigFiles {
                //          'jspm:dev': string
                //      }
                //      let files: ConfigFiles = {
                //          '/*completion position*/'
                //      }
                //
                //      function foo(c: ConfigFiles) {}
                //      foo({
                //          '/*completion position*/'
                //      });
                return stringLiteralCompletionsFromProperties(typeChecker.getContextualType(parent.parent));
            }
            return fromContextualType();
        case ts.SyntaxKind.ElementAccessExpression: {
            const { expression, argumentExpression } = (parent as ts.ElementAccessExpression);
            if (node === argumentExpression) {
                // Get all names of properties on the expression
                // i.e. interface A {
                //      'prop1': string
                // }
                // let a: A;
                // a['/*completion position*/']
                return stringLiteralCompletionsFromProperties(typeChecker.getTypeAtLocation(expression));
            }
            return undefined;
        }
        case ts.SyntaxKind.CallExpression:
        case ts.SyntaxKind.NewExpression:
            if (!ts.isRequireCall(parent, /*checkArgumentIsStringLiteralLike*/ false) && !ts.isImportCall(parent)) {
                const argumentInfo = ts.SignatureHelp.getArgumentInfoForCompletions(node, position, sourceFile);
                // Get string literal completions from specialized signatures of the target
                // i.e. declare function f(a: 'A');
                // f("/*completion position*/")
                return argumentInfo ? getStringLiteralCompletionsFromSignature(argumentInfo, typeChecker) : fromContextualType();
            }
        // falls through (is `require("")` or `import("")`)
        case ts.SyntaxKind.ImportDeclaration:
        case ts.SyntaxKind.ExportDeclaration:
        case ts.SyntaxKind.ExternalModuleReference:
            // Get all known external module names or complete a path to a module
            // i.e. import * as ns from "/*completion position*/";
            //      var y = import("/*completion position*/");
            //      import x = require("/*completion position*/");
            //      var y = require("/*completion position*/");
            //      export * from "/*completion position*/";
            return { kind: StringLiteralCompletionKind.Paths, paths: getStringLiteralCompletionsFromModuleNames(sourceFile, node, compilerOptions, host, typeChecker) };
        default:
            return fromContextualType();
    }
    function fromContextualType(): StringLiteralCompletion {
        // Get completion for string literal from string literal type
        // i.e. var x: "hi" | "hello" = "/*completion position*/"
        return { kind: StringLiteralCompletionKind.Types, types: getStringLiteralTypes(ts.getContextualTypeFromParent(node, typeChecker)), isNewIdentifier: false };
    }
}
/* @internal */
function getAlreadyUsedTypesInStringLiteralUnion(union: ts.UnionTypeNode, current: ts.LiteralTypeNode): readonly string[] {
    return ts.mapDefined(union.types, type => type !== current && ts.isLiteralTypeNode(type) && ts.isStringLiteral(type.literal) ? type.literal.text : undefined);
}
/* @internal */
function getStringLiteralCompletionsFromSignature(argumentInfo: ts.SignatureHelp.ArgumentInfoForCompletions, checker: ts.TypeChecker): StringLiteralCompletionsFromTypes {
    let isNewIdentifier = false;
    const uniques = ts.createMap<true>();
    const candidates: ts.Signature[] = [];
    checker.getResolvedSignature(argumentInfo.invocation, candidates, argumentInfo.argumentCount);
    const types = ts.flatMap(candidates, candidate => {
        if (!ts.signatureHasRestParameter(candidate) && argumentInfo.argumentCount > candidate.parameters.length)
            return;
        const type = checker.getParameterType(candidate, argumentInfo.argumentIndex);
        isNewIdentifier = isNewIdentifier || !!(type.flags & ts.TypeFlags.String);
        return getStringLiteralTypes(type, uniques);
    });
    return { kind: StringLiteralCompletionKind.Types, types, isNewIdentifier };
}
/* @internal */
function stringLiteralCompletionsFromProperties(type: ts.Type | undefined): StringLiteralCompletionsFromProperties | undefined {
    return type && { kind: StringLiteralCompletionKind.Properties, symbols: type.getApparentProperties(), hasIndexSignature: ts.hasIndexSignature(type) };
}
/* @internal */
function getStringLiteralTypes(type: ts.Type | undefined, uniques = ts.createMap<true>()): readonly ts.StringLiteralType[] {
    if (!type)
        return ts.emptyArray;
    type = ts.skipConstraint(type);
    return type.isUnion() ? ts.flatMap(type.types, t => getStringLiteralTypes(t, uniques)) :
        type.isStringLiteral() && !(type.flags & ts.TypeFlags.EnumLiteral) && ts.addToSeen(uniques, type.value) ? [type] : ts.emptyArray;
}
/* @internal */
interface NameAndKind {
    readonly name: string;
    readonly kind: ts.ScriptElementKind.scriptElement | ts.ScriptElementKind.directory | ts.ScriptElementKind.externalModuleName;
    readonly extension: ts.Extension | undefined;
}
/* @internal */
interface PathCompletion extends NameAndKind {
    readonly span: ts.TextSpan | undefined;
}
/* @internal */
function nameAndKind(name: string, kind: NameAndKind["kind"], extension: ts.Extension | undefined): NameAndKind {
    return { name, kind, extension };
}
/* @internal */
function directoryResult(name: string): NameAndKind {
    return nameAndKind(name, ts.ScriptElementKind.directory, /*extension*/ undefined);
}
/* @internal */
function addReplacementSpans(text: string, textStart: number, names: readonly NameAndKind[]): readonly PathCompletion[] {
    const span = getDirectoryFragmentTextSpan(text, textStart);
    return names.map(({ name, kind, extension }): PathCompletion => ({ name, kind, extension, span }));
}
/* @internal */
function getStringLiteralCompletionsFromModuleNames(sourceFile: ts.SourceFile, node: ts.LiteralExpression, compilerOptions: ts.CompilerOptions, host: ts.LanguageServiceHost, typeChecker: ts.TypeChecker): readonly PathCompletion[] {
    return addReplacementSpans(node.text, node.getStart(sourceFile) + 1, getStringLiteralCompletionsFromModuleNamesWorker(sourceFile, node, compilerOptions, host, typeChecker));
}
/* @internal */
function getStringLiteralCompletionsFromModuleNamesWorker(sourceFile: ts.SourceFile, node: ts.LiteralExpression, compilerOptions: ts.CompilerOptions, host: ts.LanguageServiceHost, typeChecker: ts.TypeChecker): readonly NameAndKind[] {
    const literalValue = ts.normalizeSlashes(node.text);
    const scriptPath = sourceFile.path;
    const scriptDirectory = ts.getDirectoryPath(scriptPath);
    return isPathRelativeToScript(literalValue) || !compilerOptions.baseUrl && (ts.isRootedDiskPath(literalValue) || ts.isUrl(literalValue))
        ? getCompletionEntriesForRelativeModules(literalValue, scriptDirectory, compilerOptions, host, scriptPath)
        : getCompletionEntriesForNonRelativeModules(literalValue, scriptDirectory, compilerOptions, host, typeChecker);
}
/* @internal */
interface ExtensionOptions {
    readonly extensions: readonly ts.Extension[];
    readonly includeExtensions: boolean;
}
/* @internal */
function getExtensionOptions(compilerOptions: ts.CompilerOptions, includeExtensions = false): ExtensionOptions {
    return { extensions: getSupportedExtensionsForModuleResolution(compilerOptions), includeExtensions };
}
/* @internal */
function getCompletionEntriesForRelativeModules(literalValue: string, scriptDirectory: string, compilerOptions: ts.CompilerOptions, host: ts.LanguageServiceHost, scriptPath: ts.Path) {
    const extensionOptions = getExtensionOptions(compilerOptions);
    if (compilerOptions.rootDirs) {
        return getCompletionEntriesForDirectoryFragmentWithRootDirs(compilerOptions.rootDirs, literalValue, scriptDirectory, extensionOptions, compilerOptions, host, scriptPath);
    }
    else {
        return getCompletionEntriesForDirectoryFragment(literalValue, scriptDirectory, extensionOptions, host, scriptPath);
    }
}
/* @internal */
function getSupportedExtensionsForModuleResolution(compilerOptions: ts.CompilerOptions): readonly ts.Extension[] {
    const extensions = ts.getSupportedExtensions(compilerOptions);
    return compilerOptions.resolveJsonModule && ts.getEmitModuleResolutionKind(compilerOptions) === ts.ModuleResolutionKind.NodeJs ?
        extensions.concat(ts.Extension.Json) :
        extensions;
}
/**
 * Takes a script path and returns paths for all potential folders that could be merged with its
 * containing folder via the "rootDirs" compiler option
 */
/* @internal */
function getBaseDirectoriesFromRootDirs(rootDirs: string[], basePath: string, scriptDirectory: string, ignoreCase: boolean): readonly string[] {
    // Make all paths absolute/normalized if they are not already
    rootDirs = rootDirs.map(rootDirectory => ts.normalizePath(ts.isRootedDiskPath(rootDirectory) ? rootDirectory : ts.combinePaths(basePath, rootDirectory)));
    // Determine the path to the directory containing the script relative to the root directory it is contained within
    const relativeDirectory = (ts.firstDefined(rootDirs, rootDirectory => ts.containsPath(rootDirectory, scriptDirectory, basePath, ignoreCase) ? scriptDirectory.substr(rootDirectory.length) : undefined)!); // TODO: GH#18217
    // Now find a path for each potential directory that is to be merged with the one containing the script
    return ts.deduplicate<string>([...rootDirs.map(rootDirectory => ts.combinePaths(rootDirectory, relativeDirectory)), scriptDirectory], ts.equateStringsCaseSensitive, ts.compareStringsCaseSensitive);
}
/* @internal */
function getCompletionEntriesForDirectoryFragmentWithRootDirs(rootDirs: string[], fragment: string, scriptDirectory: string, extensionOptions: ExtensionOptions, compilerOptions: ts.CompilerOptions, host: ts.LanguageServiceHost, exclude: string): readonly NameAndKind[] {
    const basePath = compilerOptions.project || host.getCurrentDirectory();
    const ignoreCase = !(host.useCaseSensitiveFileNames && host.useCaseSensitiveFileNames());
    const baseDirectories = getBaseDirectoriesFromRootDirs(rootDirs, basePath, scriptDirectory, ignoreCase);
    return ts.flatMap(baseDirectories, baseDirectory => getCompletionEntriesForDirectoryFragment(fragment, baseDirectory, extensionOptions, host, exclude));
}
/**
 * Given a path ending at a directory, gets the completions for the path, and filters for those entries containing the basename.
 */
/* @internal */
function getCompletionEntriesForDirectoryFragment(fragment: string, scriptPath: string, { extensions, includeExtensions }: ExtensionOptions, host: ts.LanguageServiceHost, exclude?: string, result: NameAndKind[] = []): NameAndKind[] {
    if (fragment === undefined) {
        fragment = "";
    }
    fragment = ts.normalizeSlashes(fragment);
    /**
     * Remove the basename from the path. Note that we don't use the basename to filter completions;
     * the client is responsible for refining completions.
     */
    if (!ts.hasTrailingDirectorySeparator(fragment)) {
        fragment = ts.getDirectoryPath(fragment);
    }
    if (fragment === "") {
        fragment = "." + ts.directorySeparator;
    }
    fragment = ts.ensureTrailingDirectorySeparator(fragment);
    // const absolutePath = normalizeAndPreserveTrailingSlash(isRootedDiskPath(fragment) ? fragment : combinePaths(scriptPath, fragment)); // TODO(rbuckton): should use resolvePaths
    const absolutePath = ts.resolvePath(scriptPath, fragment);
    const baseDirectory = ts.hasTrailingDirectorySeparator(absolutePath) ? absolutePath : ts.getDirectoryPath(absolutePath);
    const ignoreCase = !(host.useCaseSensitiveFileNames && host.useCaseSensitiveFileNames());
    if (!ts.tryDirectoryExists(host, baseDirectory))
        return result;
    // Enumerate the available files if possible
    const files = ts.tryReadDirectory(host, baseDirectory, extensions, /*exclude*/ undefined, /*include*/ ["./*"]);
    if (files) {
        /**
         * Multiple file entries might map to the same truncated name once we remove extensions
         * (happens iff includeExtensions === false)so we use a set-like data structure. Eg:
         *
         * both foo.ts and foo.tsx become foo
         */
        const foundFiles = ts.createMap<ts.Extension | undefined>(); // maps file to its extension
        for (let filePath of files) {
            filePath = ts.normalizePath(filePath);
            if (exclude && ts.comparePaths(filePath, exclude, scriptPath, ignoreCase) === ts.Comparison.EqualTo) {
                continue;
            }
            const foundFileName = includeExtensions || ts.fileExtensionIs(filePath, ts.Extension.Json) ? ts.getBaseFileName(filePath) : ts.removeFileExtension(ts.getBaseFileName(filePath));
            foundFiles.set(foundFileName, ts.tryGetExtensionFromPath(filePath));
        }
        foundFiles.forEach((ext, foundFile) => {
            result.push(nameAndKind(foundFile, ts.ScriptElementKind.scriptElement, ext));
        });
    }
    // If possible, get folder completion as well
    const directories = ts.tryGetDirectories(host, baseDirectory);
    if (directories) {
        for (const directory of directories) {
            const directoryName = ts.getBaseFileName(ts.normalizePath(directory));
            if (directoryName !== "@types") {
                result.push(directoryResult(directoryName));
            }
        }
    }
    // check for a version redirect
    const packageJsonPath = ts.findPackageJson(baseDirectory, host);
    if (packageJsonPath) {
        const packageJson = ts.readJson(packageJsonPath, (host as {
            readFile: (filename: string) => string | undefined;
        }));
        const typesVersions = (packageJson as any).typesVersions;
        if (typeof typesVersions === "object") {
            const versionResult = ts.getPackageJsonTypesVersionsPaths(typesVersions);
            const versionPaths = versionResult && versionResult.paths;
            const rest = absolutePath.slice(ts.ensureTrailingDirectorySeparator(baseDirectory).length);
            if (versionPaths) {
                addCompletionEntriesFromPaths(result, rest, baseDirectory, extensions, versionPaths, host);
            }
        }
    }
    return result;
}
/* @internal */
function addCompletionEntriesFromPaths(result: NameAndKind[], fragment: string, baseDirectory: string, fileExtensions: readonly string[], paths: ts.MapLike<string[]>, host: ts.LanguageServiceHost) {
    for (const path in paths) {
        if (!ts.hasProperty(paths, path))
            continue;
        const patterns = paths[path];
        if (patterns) {
            for (const { name, kind, extension } of getCompletionsForPathMapping(path, patterns, fragment, baseDirectory, fileExtensions, host)) {
                // Path mappings may provide a duplicate way to get to something we've already added, so don't add again.
                if (!result.some(entry => entry.name === name)) {
                    result.push(nameAndKind(name, kind, extension));
                }
            }
        }
    }
}
/**
 * Check all of the declared modules and those in node modules. Possible sources of modules:
 *      Modules that are found by the type checker
 *      Modules found relative to "baseUrl" compliler options (including patterns from "paths" compiler option)
 *      Modules from node_modules (i.e. those listed in package.json)
 *          This includes all files that are found in node_modules/moduleName/ with acceptable file extensions
 */
/* @internal */
function getCompletionEntriesForNonRelativeModules(fragment: string, scriptPath: string, compilerOptions: ts.CompilerOptions, host: ts.LanguageServiceHost, typeChecker: ts.TypeChecker): readonly NameAndKind[] {
    const { baseUrl, paths } = compilerOptions;
    const result: NameAndKind[] = [];
    const extensionOptions = getExtensionOptions(compilerOptions);
    if (baseUrl) {
        const projectDir = compilerOptions.project || host.getCurrentDirectory();
        const absolute = ts.normalizePath(ts.combinePaths(projectDir, baseUrl));
        getCompletionEntriesForDirectoryFragment(fragment, absolute, extensionOptions, host, /*exclude*/ undefined, result);
        if (paths) {
            addCompletionEntriesFromPaths(result, fragment, absolute, extensionOptions.extensions, paths, host);
        }
    }
    const fragmentDirectory = getFragmentDirectory(fragment);
    for (const ambientName of getAmbientModuleCompletions(fragment, fragmentDirectory, typeChecker)) {
        result.push(nameAndKind(ambientName, ts.ScriptElementKind.externalModuleName, /*extension*/ undefined));
    }
    getCompletionEntriesFromTypings(host, compilerOptions, scriptPath, fragmentDirectory, extensionOptions, result);
    if (ts.getEmitModuleResolutionKind(compilerOptions) === ts.ModuleResolutionKind.NodeJs) {
        // If looking for a global package name, don't just include everything in `node_modules` because that includes dependencies' own dependencies.
        // (But do if we didn't find anything, e.g. 'package.json' missing.)
        let foundGlobal = false;
        if (fragmentDirectory === undefined) {
            for (const moduleName of enumerateNodeModulesVisibleToScript(host, scriptPath)) {
                if (!result.some(entry => entry.name === moduleName)) {
                    foundGlobal = true;
                    result.push(nameAndKind(moduleName, ts.ScriptElementKind.externalModuleName, /*extension*/ undefined));
                }
            }
        }
        if (!foundGlobal) {
            ts.forEachAncestorDirectory(scriptPath, ancestor => {
                const nodeModules = ts.combinePaths(ancestor, "node_modules");
                if (ts.tryDirectoryExists(host, nodeModules)) {
                    getCompletionEntriesForDirectoryFragment(fragment, nodeModules, extensionOptions, host, /*exclude*/ undefined, result);
                }
            });
        }
    }
    return result;
}
/* @internal */
function getFragmentDirectory(fragment: string): string | undefined {
    return containsSlash(fragment) ? ts.hasTrailingDirectorySeparator(fragment) ? fragment : ts.getDirectoryPath(fragment) : undefined;
}
/* @internal */
function getCompletionsForPathMapping(path: string, patterns: readonly string[], fragment: string, baseUrl: string, fileExtensions: readonly string[], host: ts.LanguageServiceHost): readonly NameAndKind[] {
    if (!ts.endsWith(path, "*")) {
        // For a path mapping "foo": ["/x/y/z.ts"], add "foo" itself as a completion.
        return !ts.stringContains(path, "*") ? justPathMappingName(path) : ts.emptyArray;
    }
    const pathPrefix = path.slice(0, path.length - 1);
    const remainingFragment = ts.tryRemovePrefix(fragment, pathPrefix);
    return remainingFragment === undefined ? justPathMappingName(pathPrefix) : ts.flatMap(patterns, pattern => getModulesForPathsPattern(remainingFragment, baseUrl, pattern, fileExtensions, host));
    function justPathMappingName(name: string): readonly NameAndKind[] {
        return ts.startsWith(name, fragment) ? [directoryResult(name)] : ts.emptyArray;
    }
}
/* @internal */
function getModulesForPathsPattern(fragment: string, baseUrl: string, pattern: string, fileExtensions: readonly string[], host: ts.LanguageServiceHost): readonly NameAndKind[] | undefined {
    if (!host.readDirectory) {
        return undefined;
    }
    const parsed = ts.hasZeroOrOneAsteriskCharacter(pattern) ? ts.tryParsePattern(pattern) : undefined;
    if (!parsed) {
        return undefined;
    }
    // The prefix has two effective parts: the directory path and the base component after the filepath that is not a
    // full directory component. For example: directory/path/of/prefix/base*
    const normalizedPrefix = ts.resolvePath(parsed.prefix);
    const normalizedPrefixDirectory = ts.hasTrailingDirectorySeparator(parsed.prefix) ? normalizedPrefix : ts.getDirectoryPath(normalizedPrefix);
    const normalizedPrefixBase = ts.hasTrailingDirectorySeparator(parsed.prefix) ? "" : ts.getBaseFileName(normalizedPrefix);
    const fragmentHasPath = containsSlash(fragment);
    const fragmentDirectory = fragmentHasPath ? ts.hasTrailingDirectorySeparator(fragment) ? fragment : ts.getDirectoryPath(fragment) : undefined;
    // Try and expand the prefix to include any path from the fragment so that we can limit the readDirectory call
    const expandedPrefixDirectory = fragmentHasPath ? ts.combinePaths(normalizedPrefixDirectory, normalizedPrefixBase + fragmentDirectory) : normalizedPrefixDirectory;
    const normalizedSuffix = ts.normalizePath(parsed.suffix);
    // Need to normalize after combining: If we combinePaths("a", "../b"), we want "b" and not "a/../b".
    const baseDirectory = ts.normalizePath(ts.combinePaths(baseUrl, expandedPrefixDirectory));
    const completePrefix = fragmentHasPath ? baseDirectory : ts.ensureTrailingDirectorySeparator(baseDirectory) + normalizedPrefixBase;
    // If we have a suffix, then we need to read the directory all the way down. We could create a glob
    // that encodes the suffix, but we would have to escape the character "?" which readDirectory
    // doesn't support. For now, this is safer but slower
    const includeGlob = normalizedSuffix ? "**/*" : "./*";
    const matches = ts.mapDefined(ts.tryReadDirectory(host, baseDirectory, fileExtensions, /*exclude*/ undefined, [includeGlob]), match => {
        const extension = ts.tryGetExtensionFromPath(match);
        const name = trimPrefixAndSuffix(match);
        return name === undefined ? undefined : nameAndKind(ts.removeFileExtension(name), ts.ScriptElementKind.scriptElement, extension);
    });
    const directories = ts.mapDefined(ts.tryGetDirectories(host, baseDirectory).map(d => ts.combinePaths(baseDirectory, d)), dir => {
        const name = trimPrefixAndSuffix(dir);
        return name === undefined ? undefined : directoryResult(name);
    });
    return [...matches, ...directories];
    function trimPrefixAndSuffix(path: string): string | undefined {
        const inner = withoutStartAndEnd(ts.normalizePath(path), completePrefix, normalizedSuffix);
        return inner === undefined ? undefined : removeLeadingDirectorySeparator(inner);
    }
}
/* @internal */
function withoutStartAndEnd(s: string, start: string, end: string): string | undefined {
    return ts.startsWith(s, start) && ts.endsWith(s, end) ? s.slice(start.length, s.length - end.length) : undefined;
}
/* @internal */
function removeLeadingDirectorySeparator(path: string): string {
    return path[0] === ts.directorySeparator ? path.slice(1) : path;
}
/* @internal */
function getAmbientModuleCompletions(fragment: string, fragmentDirectory: string | undefined, checker: ts.TypeChecker): readonly string[] {
    // Get modules that the type checker picked up
    const ambientModules = checker.getAmbientModules().map(sym => ts.stripQuotes(sym.name));
    const nonRelativeModuleNames = ambientModules.filter(moduleName => ts.startsWith(moduleName, fragment));
    // Nested modules of the form "module-name/sub" need to be adjusted to only return the string
    // after the last '/' that appears in the fragment because that's where the replacement span
    // starts
    if (fragmentDirectory !== undefined) {
        const moduleNameWithSeparator = ts.ensureTrailingDirectorySeparator(fragmentDirectory);
        return nonRelativeModuleNames.map(nonRelativeModuleName => ts.removePrefix(nonRelativeModuleName, moduleNameWithSeparator));
    }
    return nonRelativeModuleNames;
}
/* @internal */
function getTripleSlashReferenceCompletion(sourceFile: ts.SourceFile, position: number, compilerOptions: ts.CompilerOptions, host: ts.LanguageServiceHost): readonly PathCompletion[] | undefined {
    const token = ts.getTokenAtPosition(sourceFile, position);
    const commentRanges = ts.getLeadingCommentRanges(sourceFile.text, token.pos);
    const range = commentRanges && ts.find(commentRanges, commentRange => position >= commentRange.pos && position <= commentRange.end);
    if (!range) {
        return undefined;
    }
    const text = sourceFile.text.slice(range.pos, position);
    const match = tripleSlashDirectiveFragmentRegex.exec(text);
    if (!match) {
        return undefined;
    }
    const [, prefix, kind, toComplete] = match;
    const scriptPath = ts.getDirectoryPath(sourceFile.path);
    const names = kind === "path" ? getCompletionEntriesForDirectoryFragment(toComplete, scriptPath, getExtensionOptions(compilerOptions, /*includeExtensions*/ true), host, sourceFile.path)
        : kind === "types" ? getCompletionEntriesFromTypings(host, compilerOptions, scriptPath, getFragmentDirectory(toComplete), getExtensionOptions(compilerOptions))
            : ts.Debug.fail();
    return addReplacementSpans(toComplete, range.pos + prefix.length, names);
}
/* @internal */
function getCompletionEntriesFromTypings(host: ts.LanguageServiceHost, options: ts.CompilerOptions, scriptPath: string, fragmentDirectory: string | undefined, extensionOptions: ExtensionOptions, result: NameAndKind[] = []): readonly NameAndKind[] {
    // Check for typings specified in compiler options
    const seen = ts.createMap<true>();
    const typeRoots = ts.tryAndIgnoreErrors(() => ts.getEffectiveTypeRoots(options, host)) || ts.emptyArray;
    for (const root of typeRoots) {
        getCompletionEntriesFromDirectories(root);
    }
    // Also get all @types typings installed in visible node_modules directories
    for (const packageJson of ts.findPackageJsons(scriptPath, host)) {
        const typesDir = ts.combinePaths(ts.getDirectoryPath(packageJson), "node_modules/@types");
        getCompletionEntriesFromDirectories(typesDir);
    }
    return result;
    function getCompletionEntriesFromDirectories(directory: string): void {
        if (!ts.tryDirectoryExists(host, directory))
            return;
        for (const typeDirectoryName of ts.tryGetDirectories(host, directory)) {
            const packageName = ts.unmangleScopedPackageName(typeDirectoryName);
            if (options.types && !ts.contains(options.types, packageName))
                continue;
            if (fragmentDirectory === undefined) {
                if (!seen.has(packageName)) {
                    result.push(nameAndKind(packageName, ts.ScriptElementKind.externalModuleName, /*extension*/ undefined));
                    seen.set(packageName, true);
                }
            }
            else {
                const baseDirectory = ts.combinePaths(directory, typeDirectoryName);
                const remainingFragment = ts.tryRemoveDirectoryPrefix(fragmentDirectory, packageName, ts.hostGetCanonicalFileName(host));
                if (remainingFragment !== undefined) {
                    getCompletionEntriesForDirectoryFragment(remainingFragment, baseDirectory, extensionOptions, host, /*exclude*/ undefined, result);
                }
            }
        }
    }
}
/* @internal */
function enumerateNodeModulesVisibleToScript(host: ts.LanguageServiceHost, scriptPath: string): readonly string[] {
    if (!host.readFile || !host.fileExists)
        return ts.emptyArray;
    const result: string[] = [];
    for (const packageJson of ts.findPackageJsons(scriptPath, host)) {
        const contents = ts.readJson(packageJson, (host as {
            readFile: (filename: string) => string | undefined;
        })); // Cast to assert that readFile is defined
        // Provide completions for all non @types dependencies
        for (const key of nodeModulesDependencyKeys) {
            const dependencies: object | undefined = (contents as any)[key];
            if (!dependencies)
                continue;
            for (const dep in dependencies) {
                if (dependencies.hasOwnProperty(dep) && !ts.startsWith(dep, "@types/")) {
                    result.push(dep);
                }
            }
        }
    }
    return result;
}
// Replace everything after the last directory separator that appears
/* @internal */
function getDirectoryFragmentTextSpan(text: string, textStart: number): ts.TextSpan | undefined {
    const index = Math.max(text.lastIndexOf(ts.directorySeparator), text.lastIndexOf("\\"));
    const offset = index !== -1 ? index + 1 : 0;
    // If the range is an identifier, span is unnecessary.
    const length = text.length - offset;
    return length === 0 || ts.isIdentifierText(text.substr(offset, length), ts.ScriptTarget.ESNext) ? undefined : ts.createTextSpan(textStart + offset, length);
}
// Returns true if the path is explicitly relative to the script (i.e. relative to . or ..)
/* @internal */
function isPathRelativeToScript(path: string) {
    if (path && path.length >= 2 && path.charCodeAt(0) === ts.CharacterCodes.dot) {
        const slashIndex = path.length >= 3 && path.charCodeAt(1) === ts.CharacterCodes.dot ? 2 : 1;
        const slashCharCode = path.charCodeAt(slashIndex);
        return slashCharCode === ts.CharacterCodes.slash || slashCharCode === ts.CharacterCodes.backslash;
    }
    return false;
}
/**
 * Matches a triple slash reference directive with an incomplete string literal for its path. Used
 * to determine if the caret is currently within the string literal and capture the literal fragment
 * for completions.
 * For example, this matches
 *
 * /// <reference path="fragment
 *
 * but not
 *
 * /// <reference path="fragment"
 */
/* @internal */
const tripleSlashDirectiveFragmentRegex = /^(\/\/\/\s*<reference\s+(path|types)\s*=\s*(?:'|"))([^\3"]*)$/;
/* @internal */
const nodeModulesDependencyKeys: readonly string[] = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
/* @internal */
function containsSlash(fragment: string) {
    return ts.stringContains(fragment, ts.directorySeparator);
}
