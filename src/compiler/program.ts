namespace ts {
    const ignoreDiagnosticCommentRegEx = /(^\s*$)|(^\s*\/\/\/?\s*(@ts-ignore)?)/;
    export function findConfigFile(searchPath: string, fileExists: (fileName: string) => boolean, configName = "tsconfig.json"): string | undefined {
        return ts.forEachAncestorDirectory(searchPath, ancestor => {
            const fileName = ts.combinePaths(ancestor, configName);
            return fileExists(fileName) ? fileName : undefined;
        });
    }
    export function resolveTripleslashReference(moduleName: string, containingFile: string): string {
        const basePath = ts.getDirectoryPath(containingFile);
        const referencedFileName = ts.isRootedDiskPath(moduleName) ? moduleName : ts.combinePaths(basePath, moduleName);
        return ts.normalizePath(referencedFileName);
    }
    /* @internal */
    export function computeCommonSourceDirectoryOfFilenames(fileNames: string[], currentDirectory: string, getCanonicalFileName: ts.GetCanonicalFileName): string {
        let commonPathComponents: string[] | undefined;
        const failed = ts.forEach(fileNames, sourceFile => {
            // Each file contributes into common source file path
            const sourcePathComponents = ts.getNormalizedPathComponents(sourceFile, currentDirectory);
            sourcePathComponents.pop(); // The base file name is not part of the common directory path
            if (!commonPathComponents) {
                // first file
                commonPathComponents = sourcePathComponents;
                return;
            }
            const n = Math.min(commonPathComponents.length, sourcePathComponents.length);
            for (let i = 0; i < n; i++) {
                if (getCanonicalFileName(commonPathComponents[i]) !== getCanonicalFileName(sourcePathComponents[i])) {
                    if (i === 0) {
                        // Failed to find any common path component
                        return true;
                    }
                    // New common path found that is 0 -> i-1
                    commonPathComponents.length = i;
                    break;
                }
            }
            // If the sourcePathComponents was shorter than the commonPathComponents, truncate to the sourcePathComponents
            if (sourcePathComponents.length < commonPathComponents.length) {
                commonPathComponents.length = sourcePathComponents.length;
            }
        });
        // A common path can not be found when paths span multiple drives on windows, for example
        if (failed) {
            return "";
        }
        if (!commonPathComponents) { // Can happen when all input files are .d.ts files
            return currentDirectory;
        }
        return ts.getPathFromPathComponents(commonPathComponents);
    }
    interface OutputFingerprint {
        hash: string;
        byteOrderMark: boolean;
        mtime: Date;
    }
    export function createCompilerHost(options: ts.CompilerOptions, setParentNodes?: boolean): ts.CompilerHost {
        return createCompilerHostWorker(options, setParentNodes);
    }
    /*@internal*/
    // TODO(shkamat): update this after reworking ts build API
    export function createCompilerHostWorker(options: ts.CompilerOptions, setParentNodes?: boolean, system = ts.sys): ts.CompilerHost {
        const existingDirectories = ts.createMap<boolean>();
        const getCanonicalFileName = ts.createGetCanonicalFileName(system.useCaseSensitiveFileNames);
        function getSourceFile(fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void): ts.SourceFile | undefined {
            let text: string | undefined;
            try {
                ts.performance.mark("beforeIORead");
                text = compilerHost.readFile(fileName);
                ts.performance.mark("afterIORead");
                ts.performance.measure("I/O Read", "beforeIORead", "afterIORead");
            }
            catch (e) {
                if (onError) {
                    onError(e.message);
                }
                text = "";
            }
            return text !== undefined ? ts.createSourceFile(fileName, text, languageVersion, setParentNodes) : undefined;
        }
        function directoryExists(directoryPath: string): boolean {
            if (existingDirectories.has(directoryPath)) {
                return true;
            }
            if ((compilerHost.directoryExists || system.directoryExists)(directoryPath)) {
                existingDirectories.set(directoryPath, true);
                return true;
            }
            return false;
        }
        function writeFile(fileName: string, data: string, writeByteOrderMark: boolean, onError?: (message: string) => void) {
            try {
                ts.performance.mark("beforeIOWrite");
                // NOTE: If patchWriteFileEnsuringDirectory has been called,
                // the system.writeFile will do its own directory creation and
                // the ensureDirectoriesExist call will always be redundant.
                ts.writeFileEnsuringDirectories(fileName, data, writeByteOrderMark, (path, data, writeByteOrderMark) => writeFileWorker(path, data, writeByteOrderMark), path => (compilerHost.createDirectory || system.createDirectory)(path), path => directoryExists(path));
                ts.performance.mark("afterIOWrite");
                ts.performance.measure("I/O Write", "beforeIOWrite", "afterIOWrite");
            }
            catch (e) {
                if (onError) {
                    onError(e.message);
                }
            }
        }
        let outputFingerprints: ts.Map<OutputFingerprint>;
        function writeFileWorker(fileName: string, data: string, writeByteOrderMark: boolean) {
            if (!ts.isWatchSet(options) || !system.createHash || !system.getModifiedTime) {
                system.writeFile(fileName, data, writeByteOrderMark);
                return;
            }
            if (!outputFingerprints) {
                outputFingerprints = ts.createMap<OutputFingerprint>();
            }
            const hash = system.createHash(data);
            const mtimeBefore = system.getModifiedTime(fileName);
            if (mtimeBefore) {
                const fingerprint = outputFingerprints.get(fileName);
                // If output has not been changed, and the file has no external modification
                if (fingerprint &&
                    fingerprint.byteOrderMark === writeByteOrderMark &&
                    fingerprint.hash === hash &&
                    fingerprint.mtime.getTime() === mtimeBefore.getTime()) {
                    return;
                }
            }
            system.writeFile(fileName, data, writeByteOrderMark);
            const mtimeAfter = system.getModifiedTime(fileName) || ts.missingFileModifiedTime;
            outputFingerprints.set(fileName, {
                hash,
                byteOrderMark: writeByteOrderMark,
                mtime: mtimeAfter
            });
        }
        function getDefaultLibLocation(): string {
            return ts.getDirectoryPath(ts.normalizePath(system.getExecutingFilePath()));
        }
        const newLine = ts.getNewLineCharacter(options, () => system.newLine);
        const realpath = system.realpath && ((path: string) => system.realpath!(path));
        const compilerHost: ts.CompilerHost = {
            getSourceFile,
            getDefaultLibLocation,
            getDefaultLibFileName: options => ts.combinePaths(getDefaultLibLocation(), ts.getDefaultLibFileName(options)),
            writeFile,
            getCurrentDirectory: ts.memoize(() => system.getCurrentDirectory()),
            useCaseSensitiveFileNames: () => system.useCaseSensitiveFileNames,
            getCanonicalFileName,
            getNewLine: () => newLine,
            fileExists: fileName => system.fileExists(fileName),
            readFile: fileName => system.readFile(fileName),
            trace: (s: string) => system.write(s + newLine),
            directoryExists: directoryName => system.directoryExists(directoryName),
            getEnvironmentVariable: name => system.getEnvironmentVariable ? system.getEnvironmentVariable(name) : "",
            getDirectories: (path: string) => system.getDirectories(path),
            realpath,
            readDirectory: (path, extensions, include, exclude, depth) => system.readDirectory(path, extensions, include, exclude, depth),
            createDirectory: d => system.createDirectory(d),
            createHash: ts.maybeBind(system, system.createHash)
        };
        return compilerHost;
    }
    /*@internal*/
    interface CompilerHostLikeForCache {
        fileExists(fileName: string): boolean;
        readFile(fileName: string, encoding?: string): string | undefined;
        directoryExists?(directory: string): boolean;
        createDirectory?(directory: string): void;
        writeFile?: ts.WriteFileCallback;
    }
    /*@internal*/
    export function changeCompilerHostLikeToUseCache(host: CompilerHostLikeForCache, toPath: (fileName: string) => ts.Path, getSourceFile?: ts.CompilerHost["getSourceFile"]) {
        const originalReadFile = host.readFile;
        const originalFileExists = host.fileExists;
        const originalDirectoryExists = host.directoryExists;
        const originalCreateDirectory = host.createDirectory;
        const originalWriteFile = host.writeFile;
        const readFileCache = ts.createMap<string | false>();
        const fileExistsCache = ts.createMap<boolean>();
        const directoryExistsCache = ts.createMap<boolean>();
        const sourceFileCache = ts.createMap<ts.SourceFile>();
        const readFileWithCache = (fileName: string): string | undefined => {
            const key = toPath(fileName);
            const value = readFileCache.get(key);
            if (value !== undefined)
                return value !== false ? value : undefined;
            return setReadFileCache(key, fileName);
        };
        const setReadFileCache = (key: ts.Path, fileName: string) => {
            const newValue = originalReadFile.call(host, fileName);
            readFileCache.set(key, newValue !== undefined ? newValue : false);
            return newValue;
        };
        host.readFile = fileName => {
            const key = toPath(fileName);
            const value = readFileCache.get(key);
            if (value !== undefined)
                return value !== false ? value : undefined; // could be .d.ts from output
            // Cache json or buildInfo
            if (!ts.fileExtensionIs(fileName, ts.Extension.Json) && !ts.isBuildInfoFile(fileName)) {
                return originalReadFile.call(host, fileName);
            }
            return setReadFileCache(key, fileName);
        };
        const getSourceFileWithCache: ts.CompilerHost["getSourceFile"] | undefined = getSourceFile ? (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
            const key = toPath(fileName);
            const value = sourceFileCache.get(key);
            if (value)
                return value;
            const sourceFile = getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
            if (sourceFile && (ts.isDeclarationFileName(fileName) || ts.fileExtensionIs(fileName, ts.Extension.Json))) {
                sourceFileCache.set(key, sourceFile);
            }
            return sourceFile;
        } : undefined;
        // fileExists for any kind of extension
        host.fileExists = fileName => {
            const key = toPath(fileName);
            const value = fileExistsCache.get(key);
            if (value !== undefined)
                return value;
            const newValue = originalFileExists.call(host, fileName);
            fileExistsCache.set(key, !!newValue);
            return newValue;
        };
        if (originalWriteFile) {
            host.writeFile = (fileName, data, writeByteOrderMark, onError, sourceFiles) => {
                const key = toPath(fileName);
                fileExistsCache.delete(key);
                const value = readFileCache.get(key);
                if (value !== undefined && value !== data) {
                    readFileCache.delete(key);
                    sourceFileCache.delete(key);
                }
                else if (getSourceFileWithCache) {
                    const sourceFile = sourceFileCache.get(key);
                    if (sourceFile && sourceFile.text !== data) {
                        sourceFileCache.delete(key);
                    }
                }
                originalWriteFile.call(host, fileName, data, writeByteOrderMark, onError, sourceFiles);
            };
        }
        // directoryExists
        if (originalDirectoryExists && originalCreateDirectory) {
            host.directoryExists = directory => {
                const key = toPath(directory);
                const value = directoryExistsCache.get(key);
                if (value !== undefined)
                    return value;
                const newValue = originalDirectoryExists.call(host, directory);
                directoryExistsCache.set(key, !!newValue);
                return newValue;
            };
            host.createDirectory = directory => {
                const key = toPath(directory);
                directoryExistsCache.delete(key);
                originalCreateDirectory.call(host, directory);
            };
        }
        return {
            originalReadFile,
            originalFileExists,
            originalDirectoryExists,
            originalCreateDirectory,
            originalWriteFile,
            getSourceFileWithCache,
            readFileWithCache
        };
    }
    export function getPreEmitDiagnostics(program: ts.Program, sourceFile?: ts.SourceFile, cancellationToken?: ts.CancellationToken): readonly ts.Diagnostic[];
    /*@internal*/ export function getPreEmitDiagnostics(program: ts.BuilderProgram, sourceFile?: ts.SourceFile, cancellationToken?: ts.CancellationToken): readonly ts.Diagnostic[]; // eslint-disable-line @typescript-eslint/unified-signatures
    export function getPreEmitDiagnostics(program: ts.Program | ts.BuilderProgram, sourceFile?: ts.SourceFile, cancellationToken?: ts.CancellationToken): readonly ts.Diagnostic[] {
        let diagnostics: ts.Diagnostic[] | undefined;
        diagnostics = ts.addRange(diagnostics, program.getConfigFileParsingDiagnostics());
        diagnostics = ts.addRange(diagnostics, program.getOptionsDiagnostics(cancellationToken));
        diagnostics = ts.addRange(diagnostics, program.getSyntacticDiagnostics(sourceFile, cancellationToken));
        diagnostics = ts.addRange(diagnostics, program.getGlobalDiagnostics(cancellationToken));
        diagnostics = ts.addRange(diagnostics, program.getSemanticDiagnostics(sourceFile, cancellationToken));
        if (ts.getEmitDeclarations(program.getCompilerOptions())) {
            diagnostics = ts.addRange(diagnostics, program.getDeclarationDiagnostics(sourceFile, cancellationToken));
        }
        return ts.sortAndDeduplicateDiagnostics(diagnostics || ts.emptyArray);
    }
    export interface FormatDiagnosticsHost {
        getCurrentDirectory(): string;
        getCanonicalFileName(fileName: string): string;
        getNewLine(): string;
    }
    export function formatDiagnostics(diagnostics: readonly ts.Diagnostic[], host: FormatDiagnosticsHost): string {
        let output = "";
        for (const diagnostic of diagnostics) {
            output += formatDiagnostic(diagnostic, host);
        }
        return output;
    }
    export function formatDiagnostic(diagnostic: ts.Diagnostic, host: FormatDiagnosticsHost): string {
        const errorMessage = `${ts.diagnosticCategoryName(diagnostic)} TS${diagnostic.code}: ${flattenDiagnosticMessageText(diagnostic.messageText, host.getNewLine())}${host.getNewLine()}`;
        if (diagnostic.file) {
            const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, (diagnostic.start!)); // TODO: GH#18217
            const fileName = diagnostic.file.fileName;
            const relativeFileName = ts.convertToRelativePath(fileName, host.getCurrentDirectory(), fileName => host.getCanonicalFileName(fileName));
            return `${relativeFileName}(${line + 1},${character + 1}): ` + errorMessage;
        }
        return errorMessage;
    }
    /** @internal */
    export enum ForegroundColorEscapeSequences {
        Grey = "\u001b[90m",
        Red = "\u001b[91m",
        Yellow = "\u001b[93m",
        Blue = "\u001b[94m",
        Cyan = "\u001b[96m"
    }
    const gutterStyleSequence = "\u001b[7m";
    const gutterSeparator = " ";
    const resetEscapeSequence = "\u001b[0m";
    const ellipsis = "...";
    const halfIndent = "  ";
    const indent = "    ";
    function getCategoryFormat(category: ts.DiagnosticCategory): ForegroundColorEscapeSequences {
        switch (category) {
            case ts.DiagnosticCategory.Error: return ForegroundColorEscapeSequences.Red;
            case ts.DiagnosticCategory.Warning: return ForegroundColorEscapeSequences.Yellow;
            case ts.DiagnosticCategory.Suggestion: return ts.Debug.fail("Should never get an Info diagnostic on the command line.");
            case ts.DiagnosticCategory.Message: return ForegroundColorEscapeSequences.Blue;
        }
    }
    /** @internal */
    export function formatColorAndReset(text: string, formatStyle: string) {
        return formatStyle + text + resetEscapeSequence;
    }
    function padLeft(s: string, length: number) {
        while (s.length < length) {
            s = " " + s;
        }
        return s;
    }
    function formatCodeSpan(file: ts.SourceFile, start: number, length: number, indent: string, squiggleColor: ForegroundColorEscapeSequences, host: FormatDiagnosticsHost) {
        const { line: firstLine, character: firstLineChar } = ts.getLineAndCharacterOfPosition(file, start);
        const { line: lastLine, character: lastLineChar } = ts.getLineAndCharacterOfPosition(file, start + length);
        const lastLineInFile = ts.getLineAndCharacterOfPosition(file, file.text.length).line;
        const hasMoreThanFiveLines = (lastLine - firstLine) >= 4;
        let gutterWidth = (lastLine + 1 + "").length;
        if (hasMoreThanFiveLines) {
            gutterWidth = Math.max(ellipsis.length, gutterWidth);
        }
        let context = "";
        for (let i = firstLine; i <= lastLine; i++) {
            context += host.getNewLine();
            // If the error spans over 5 lines, we'll only show the first 2 and last 2 lines,
            // so we'll skip ahead to the second-to-last line.
            if (hasMoreThanFiveLines && firstLine + 1 < i && i < lastLine - 1) {
                context += indent + formatColorAndReset(padLeft(ellipsis, gutterWidth), gutterStyleSequence) + gutterSeparator + host.getNewLine();
                i = lastLine - 1;
            }
            const lineStart = ts.getPositionOfLineAndCharacter(file, i, 0);
            const lineEnd = i < lastLineInFile ? ts.getPositionOfLineAndCharacter(file, i + 1, 0) : file.text.length;
            let lineContent = file.text.slice(lineStart, lineEnd);
            lineContent = lineContent.replace(/\s+$/g, ""); // trim from end
            lineContent = lineContent.replace("\t", " "); // convert tabs to single spaces
            // Output the gutter and the actual contents of the line.
            context += indent + formatColorAndReset(padLeft(i + 1 + "", gutterWidth), gutterStyleSequence) + gutterSeparator;
            context += lineContent + host.getNewLine();
            // Output the gutter and the error span for the line using tildes.
            context += indent + formatColorAndReset(padLeft("", gutterWidth), gutterStyleSequence) + gutterSeparator;
            context += squiggleColor;
            if (i === firstLine) {
                // If we're on the last line, then limit it to the last character of the last line.
                // Otherwise, we'll just squiggle the rest of the line, giving 'slice' no end position.
                const lastCharForLine = i === lastLine ? lastLineChar : undefined;
                context += lineContent.slice(0, firstLineChar).replace(/\S/g, " ");
                context += lineContent.slice(firstLineChar, lastCharForLine).replace(/./g, "~");
            }
            else if (i === lastLine) {
                context += lineContent.slice(0, lastLineChar).replace(/./g, "~");
            }
            else {
                // Squiggle the entire line.
                context += lineContent.replace(/./g, "~");
            }
            context += resetEscapeSequence;
        }
        return context;
    }
    /* @internal */
    export function formatLocation(file: ts.SourceFile, start: number, host: FormatDiagnosticsHost, color = formatColorAndReset) {
        const { line: firstLine, character: firstLineChar } = ts.getLineAndCharacterOfPosition(file, start); // TODO: GH#18217
        const relativeFileName = host ? ts.convertToRelativePath(file.fileName, host.getCurrentDirectory(), fileName => host.getCanonicalFileName(fileName)) : file.fileName;
        let output = "";
        output += color(relativeFileName, ForegroundColorEscapeSequences.Cyan);
        output += ":";
        output += color(`${firstLine + 1}`, ForegroundColorEscapeSequences.Yellow);
        output += ":";
        output += color(`${firstLineChar + 1}`, ForegroundColorEscapeSequences.Yellow);
        return output;
    }
    export function formatDiagnosticsWithColorAndContext(diagnostics: readonly ts.Diagnostic[], host: FormatDiagnosticsHost): string {
        let output = "";
        for (const diagnostic of diagnostics) {
            if (diagnostic.file) {
                const { file, start } = diagnostic;
                output += formatLocation(file, start!, host); // TODO: GH#18217
                output += " - ";
            }
            output += formatColorAndReset(ts.diagnosticCategoryName(diagnostic), getCategoryFormat(diagnostic.category));
            output += formatColorAndReset(` TS${diagnostic.code}: `, ForegroundColorEscapeSequences.Grey);
            output += flattenDiagnosticMessageText(diagnostic.messageText, host.getNewLine());
            if (diagnostic.file) {
                output += host.getNewLine();
                output += formatCodeSpan(diagnostic.file, diagnostic.start!, diagnostic.length!, "", getCategoryFormat(diagnostic.category), host); // TODO: GH#18217
                if (diagnostic.relatedInformation) {
                    output += host.getNewLine();
                    for (const { file, start, length, messageText } of diagnostic.relatedInformation) {
                        if (file) {
                            output += host.getNewLine();
                            output += halfIndent + formatLocation(file, start!, host); // TODO: GH#18217
                            output += formatCodeSpan(file, start!, length!, indent, ForegroundColorEscapeSequences.Cyan, host); // TODO: GH#18217
                        }
                        output += host.getNewLine();
                        output += indent + flattenDiagnosticMessageText(messageText, host.getNewLine());
                    }
                }
            }
            output += host.getNewLine();
        }
        return output;
    }
    export function flattenDiagnosticMessageText(diag: string | ts.DiagnosticMessageChain | undefined, newLine: string, indent = 0): string {
        if (ts.isString(diag)) {
            return diag;
        }
        else if (diag === undefined) {
            return "";
        }
        let result = "";
        if (indent) {
            result += newLine;
            for (let i = 0; i < indent; i++) {
                result += "  ";
            }
        }
        result += diag.messageText;
        indent++;
        if (diag.next) {
            for (const kid of diag.next) {
                result += flattenDiagnosticMessageText(kid, newLine, indent);
            }
        }
        return result;
    }
    /* @internal */
    export function loadWithLocalCache<T>(names: string[], containingFile: string, redirectedReference: ts.ResolvedProjectReference | undefined, loader: (name: string, containingFile: string, redirectedReference: ts.ResolvedProjectReference | undefined) => T): T[] {
        if (names.length === 0) {
            return [];
        }
        const resolutions: T[] = [];
        const cache = ts.createMap<T>();
        for (const name of names) {
            let result: T;
            if (cache.has(name)) {
                result = cache.get(name)!;
            }
            else {
                cache.set(name, result = loader(name, containingFile, redirectedReference));
            }
            resolutions.push(result);
        }
        return resolutions;
    }
    /* @internal */
    export const inferredTypesContainingFile = "__inferred type names__.ts";
    interface DiagnosticCache<T extends ts.Diagnostic> {
        perFile?: ts.Map<readonly T[]>;
        allDiagnostics?: readonly T[];
    }
    interface RefFile extends ts.TextRange {
        kind: ts.RefFileKind;
        index: number;
        file: ts.SourceFile;
    }
    /**
     * Determines if program structure is upto date or needs to be recreated
     */
    /* @internal */
    export function isProgramUptoDate(program: ts.Program | undefined, rootFileNames: string[], newOptions: ts.CompilerOptions, getSourceVersion: (path: ts.Path) => string | undefined, fileExists: (fileName: string) => boolean, hasInvalidatedResolution: ts.HasInvalidatedResolution, hasChangedAutomaticTypeDirectiveNames: boolean, projectReferences: readonly ts.ProjectReference[] | undefined): boolean {
        // If we haven't created a program yet or have changed automatic type directives, then it is not up-to-date
        if (!program || hasChangedAutomaticTypeDirectiveNames) {
            return false;
        }
        // If number of files in the program do not match, it is not up-to-date
        if (program.getRootFileNames().length !== rootFileNames.length) {
            return false;
        }
        let seenResolvedRefs: ts.ResolvedProjectReference[] | undefined;
        // If project references dont match
        if (!ts.arrayIsEqualTo(program.getProjectReferences(), projectReferences, projectReferenceUptoDate)) {
            return false;
        }
        // If any file is not up-to-date, then the whole program is not up-to-date
        if (program.getSourceFiles().some(sourceFileNotUptoDate)) {
            return false;
        }
        // If any of the missing file paths are now created
        if (program.getMissingFilePaths().some(fileExists)) {
            return false;
        }
        const currentOptions = program.getCompilerOptions();
        // If the compilation settings do no match, then the program is not up-to-date
        if (!ts.compareDataObjects(currentOptions, newOptions)) {
            return false;
        }
        // If everything matches but the text of config file is changed,
        // error locations can change for program options, so update the program
        if (currentOptions.configFile && newOptions.configFile) {
            return currentOptions.configFile.text === newOptions.configFile.text;
        }
        return true;
        function sourceFileNotUptoDate(sourceFile: ts.SourceFile) {
            return !sourceFileVersionUptoDate(sourceFile) ||
                hasInvalidatedResolution(sourceFile.path);
        }
        function sourceFileVersionUptoDate(sourceFile: ts.SourceFile) {
            return sourceFile.version === getSourceVersion(sourceFile.resolvedPath);
        }
        function projectReferenceUptoDate(oldRef: ts.ProjectReference, newRef: ts.ProjectReference, index: number) {
            if (!ts.projectReferenceIsEqualTo(oldRef, newRef)) {
                return false;
            }
            return resolvedProjectReferenceUptoDate(program!.getResolvedProjectReferences()![index], oldRef);
        }
        function resolvedProjectReferenceUptoDate(oldResolvedRef: ts.ResolvedProjectReference | undefined, oldRef: ts.ProjectReference): boolean {
            if (oldResolvedRef) {
                if (ts.contains(seenResolvedRefs, oldResolvedRef)) {
                    // Assume true
                    return true;
                }
                // If sourceFile for the oldResolvedRef existed, check the version for uptodate
                if (!sourceFileVersionUptoDate(oldResolvedRef.sourceFile)) {
                    return false;
                }
                // Add to seen before checking the referenced paths of this config file
                (seenResolvedRefs || (seenResolvedRefs = [])).push(oldResolvedRef);
                // If child project references are upto date, this project reference is uptodate
                return !ts.forEach(oldResolvedRef.references, (childResolvedRef, index) => !resolvedProjectReferenceUptoDate(childResolvedRef, oldResolvedRef.commandLine.projectReferences![index]));
            }
            // In old program, not able to resolve project reference path,
            // so if config file doesnt exist, it is uptodate.
            return !fileExists(resolveProjectReferencePath(oldRef));
        }
    }
    export function getConfigFileParsingDiagnostics(configFileParseResult: ts.ParsedCommandLine): readonly ts.Diagnostic[] {
        return configFileParseResult.options.configFile ?
            [...configFileParseResult.options.configFile.parseDiagnostics, ...configFileParseResult.errors] :
            configFileParseResult.errors;
    }
    /**
     * Determine if source file needs to be re-created even if its text hasn't changed
     */
    function shouldProgramCreateNewSourceFiles(program: ts.Program | undefined, newOptions: ts.CompilerOptions): boolean {
        if (!program)
            return false;
        // If any compiler options change, we can't reuse old source file even if version match
        // The change in options like these could result in change in syntax tree or `sourceFile.bindDiagnostics`.
        const oldOptions = program.getCompilerOptions();
        return !!ts.sourceFileAffectingCompilerOptions.some(option => !ts.isJsonEqual(ts.getCompilerOptionValue(oldOptions, option), ts.getCompilerOptionValue(newOptions, option)));
    }
    function createCreateProgramOptions(rootNames: readonly string[], options: ts.CompilerOptions, host?: ts.CompilerHost, oldProgram?: ts.Program, configFileParsingDiagnostics?: readonly ts.Diagnostic[]): ts.CreateProgramOptions {
        return {
            rootNames,
            options,
            host,
            oldProgram,
            configFileParsingDiagnostics
        };
    }
    /**
     * Create a new 'Program' instance. A Program is an immutable collection of 'SourceFile's and a 'CompilerOptions'
     * that represent a compilation unit.
     *
     * Creating a program proceeds from a set of root files, expanding the set of inputs by following imports and
     * triple-slash-reference-path directives transitively. '@types' and triple-slash-reference-types are also pulled in.
     *
     * @param createProgramOptions - The options for creating a program.
     * @returns A 'Program' object.
     */
    export function createProgram(createProgramOptions: ts.CreateProgramOptions): ts.Program;
    /**
     * Create a new 'Program' instance. A Program is an immutable collection of 'SourceFile's and a 'CompilerOptions'
     * that represent a compilation unit.
     *
     * Creating a program proceeds from a set of root files, expanding the set of inputs by following imports and
     * triple-slash-reference-path directives transitively. '@types' and triple-slash-reference-types are also pulled in.
     *
     * @param rootNames - A set of root files.
     * @param options - The compiler options which should be used.
     * @param host - The host interacts with the underlying file system.
     * @param oldProgram - Reuses an old program structure.
     * @param configFileParsingDiagnostics - error during config file parsing
     * @returns A 'Program' object.
     */
    export function createProgram(rootNames: readonly string[], options: ts.CompilerOptions, host?: ts.CompilerHost, oldProgram?: ts.Program, configFileParsingDiagnostics?: readonly ts.Diagnostic[]): ts.Program;
    export function createProgram(rootNamesOrOptions: readonly string[] | ts.CreateProgramOptions, _options?: ts.CompilerOptions, _host?: ts.CompilerHost, _oldProgram?: ts.Program, _configFileParsingDiagnostics?: readonly ts.Diagnostic[]): ts.Program {
        const createProgramOptions = ts.isArray(rootNamesOrOptions) ? createCreateProgramOptions(rootNamesOrOptions, _options!, _host, _oldProgram, _configFileParsingDiagnostics) : rootNamesOrOptions; // TODO: GH#18217
        const { rootNames, options, configFileParsingDiagnostics, projectReferences } = createProgramOptions;
        let { oldProgram } = createProgramOptions;
        let processingDefaultLibFiles: ts.SourceFile[] | undefined;
        let processingOtherFiles: ts.SourceFile[] | undefined;
        let files: ts.SourceFile[];
        let symlinks: ts.ReadonlyMap<string> | undefined;
        let commonSourceDirectory: string;
        let diagnosticsProducingTypeChecker: ts.TypeChecker;
        let noDiagnosticsTypeChecker: ts.TypeChecker;
        let classifiableNames: ts.UnderscoreEscapedMap<true>;
        const ambientModuleNameToUnmodifiedFileName = ts.createMap<string>();
        // Todo:: Use this to report why file was included in --extendedDiagnostics
        let refFileMap: ts.MultiMap<ts.RefFile> | undefined;
        const cachedBindAndCheckDiagnosticsForFile: DiagnosticCache<ts.Diagnostic> = {};
        const cachedDeclarationDiagnosticsForFile: DiagnosticCache<ts.DiagnosticWithLocation> = {};
        let resolvedTypeReferenceDirectives = ts.createMap<ts.ResolvedTypeReferenceDirective | undefined>();
        let fileProcessingDiagnostics = ts.createDiagnosticCollection();
        // The below settings are to track if a .js file should be add to the program if loaded via searching under node_modules.
        // This works as imported modules are discovered recursively in a depth first manner, specifically:
        // - For each root file, findSourceFile is called.
        // - This calls processImportedModules for each module imported in the source file.
        // - This calls resolveModuleNames, and then calls findSourceFile for each resolved module.
        // As all these operations happen - and are nested - within the createProgram call, they close over the below variables.
        // The current resolution depth is tracked by incrementing/decrementing as the depth first search progresses.
        const maxNodeModuleJsDepth = typeof options.maxNodeModuleJsDepth === "number" ? options.maxNodeModuleJsDepth : 0;
        let currentNodeModulesDepth = 0;
        // If a module has some of its imports skipped due to being at the depth limit under node_modules, then track
        // this, as it may be imported at a shallower depth later, and then it will need its skipped imports processed.
        const modulesWithElidedImports = ts.createMap<boolean>();
        // Track source files that are source files found by searching under node_modules, as these shouldn't be compiled.
        const sourceFilesFoundSearchingNodeModules = ts.createMap<boolean>();
        ts.performance.mark("beforeProgram");
        const host = createProgramOptions.host || createCompilerHost(options);
        const configParsingHost = parseConfigHostFromCompilerHostLike(host);
        let skipDefaultLib = options.noLib;
        const getDefaultLibraryFileName = ts.memoize(() => host.getDefaultLibFileName(options));
        const defaultLibraryPath = host.getDefaultLibLocation ? host.getDefaultLibLocation() : ts.getDirectoryPath(getDefaultLibraryFileName());
        const programDiagnostics = ts.createDiagnosticCollection();
        const currentDirectory = host.getCurrentDirectory();
        const supportedExtensions = ts.getSupportedExtensions(options);
        const supportedExtensionsWithJsonIfResolveJsonModule = ts.getSuppoertedExtensionsWithJsonIfResolveJsonModule(options, supportedExtensions);
        // Map storing if there is emit blocking diagnostics for given input
        const hasEmitBlockingDiagnostics = ts.createMap<boolean>();
        let _compilerOptionsObjectLiteralSyntax: ts.ObjectLiteralExpression | null | undefined;
        let moduleResolutionCache: ts.ModuleResolutionCache | undefined;
        let resolveModuleNamesWorker: (moduleNames: string[], containingFile: string, reusedNames?: string[], redirectedReference?: ts.ResolvedProjectReference) => ts.ResolvedModuleFull[];
        const hasInvalidatedResolution = host.hasInvalidatedResolution || ts.returnFalse;
        if (host.resolveModuleNames) {
            resolveModuleNamesWorker = (moduleNames, containingFile, reusedNames, redirectedReference) => host.resolveModuleNames!(ts.Debug.assertEachDefined(moduleNames), containingFile, reusedNames, redirectedReference, options).map(resolved => {
                // An older host may have omitted extension, in which case we should infer it from the file extension of resolvedFileName.
                if (!resolved || (resolved as ts.ResolvedModuleFull).extension !== undefined) {
                    return resolved as ts.ResolvedModuleFull;
                }
                const withExtension = (ts.clone(resolved) as ts.ResolvedModuleFull);
                withExtension.extension = ts.extensionFromPath(resolved.resolvedFileName);
                return withExtension;
            });
        }
        else {
            moduleResolutionCache = ts.createModuleResolutionCache(currentDirectory, x => host.getCanonicalFileName(x), options);
            const loader = (moduleName: string, containingFile: string, redirectedReference: ts.ResolvedProjectReference | undefined) => ts.resolveModuleName(moduleName, containingFile, options, host, moduleResolutionCache, redirectedReference).resolvedModule!; // TODO: GH#18217
            resolveModuleNamesWorker = (moduleNames, containingFile, _reusedNames, redirectedReference) => loadWithLocalCache<ts.ResolvedModuleFull>(ts.Debug.assertEachDefined(moduleNames), containingFile, redirectedReference, loader);
        }
        let resolveTypeReferenceDirectiveNamesWorker: (typeDirectiveNames: string[], containingFile: string, redirectedReference?: ts.ResolvedProjectReference) => (ts.ResolvedTypeReferenceDirective | undefined)[];
        if (host.resolveTypeReferenceDirectives) {
            resolveTypeReferenceDirectiveNamesWorker = (typeDirectiveNames, containingFile, redirectedReference) => host.resolveTypeReferenceDirectives!(ts.Debug.assertEachDefined(typeDirectiveNames), containingFile, redirectedReference, options);
        }
        else {
            const loader = (typesRef: string, containingFile: string, redirectedReference: ts.ResolvedProjectReference | undefined) => ts.resolveTypeReferenceDirective(typesRef, containingFile, options, host, redirectedReference).resolvedTypeReferenceDirective!; // TODO: GH#18217
            resolveTypeReferenceDirectiveNamesWorker = (typeReferenceDirectiveNames, containingFile, redirectedReference) => loadWithLocalCache<ts.ResolvedTypeReferenceDirective>(ts.Debug.assertEachDefined(typeReferenceDirectiveNames), containingFile, redirectedReference, loader);
        }
        // Map from a stringified PackageId to the source file with that id.
        // Only one source file may have a given packageId. Others become redirects (see createRedirectSourceFile).
        // `packageIdToSourceFile` is only used while building the program, while `sourceFileToPackageName` and `isSourceFileTargetOfRedirect` are kept around.
        const packageIdToSourceFile = ts.createMap<ts.SourceFile>();
        // Maps from a SourceFile's `.path` to the name of the package it was imported with.
        let sourceFileToPackageName = ts.createMap<string>();
        // Key is a file name. Value is the (non-empty, or undefined) list of files that redirect to it.
        let redirectTargetsMap = ts.createMultiMap<string>();
        /**
         * map with
         * - SourceFile if present
         * - false if sourceFile missing for source of project reference redirect
         * - undefined otherwise
         */
        const filesByName = ts.createMap<ts.SourceFile | false | undefined>();
        let missingFilePaths: readonly ts.Path[] | undefined;
        // stores 'filename -> file association' ignoring case
        // used to track cases when two file names differ only in casing
        const filesByNameIgnoreCase = host.useCaseSensitiveFileNames() ? ts.createMap<ts.SourceFile>() : undefined;
        // A parallel array to projectReferences storing the results of reading in the referenced tsconfig files
        let resolvedProjectReferences: readonly (ts.ResolvedProjectReference | undefined)[] | undefined;
        let projectReferenceRedirects: ts.Map<ts.ResolvedProjectReference | false> | undefined;
        let mapFromFileToProjectReferenceRedirects: ts.Map<ts.Path> | undefined;
        let mapFromToProjectReferenceRedirectSource: ts.Map<ts.SourceOfProjectReferenceRedirect> | undefined;
        const useSourceOfProjectReferenceRedirect = !!host.useSourceOfProjectReferenceRedirect && host.useSourceOfProjectReferenceRedirect();
        const shouldCreateNewSourceFile = shouldProgramCreateNewSourceFiles(oldProgram, options);
        // We set `structuralIsReused` to `undefined` because `tryReuseStructureFromOldProgram` calls `tryReuseStructureFromOldProgram` which checks
        // `structuralIsReused`, which would be a TDZ violation if it was not set in advance to `undefined`.
        let structuralIsReused: ts.StructureIsReused | undefined;
        structuralIsReused = tryReuseStructureFromOldProgram(); // eslint-disable-line prefer-const
        if (structuralIsReused !== ts.StructureIsReused.Completely) {
            processingDefaultLibFiles = [];
            processingOtherFiles = [];
            if (projectReferences) {
                if (!resolvedProjectReferences) {
                    resolvedProjectReferences = projectReferences.map(parseProjectReferenceConfigFile);
                }
                if (host.setResolvedProjectReferenceCallbacks) {
                    host.setResolvedProjectReferenceCallbacks({
                        getSourceOfProjectReferenceRedirect,
                        forEachResolvedProjectReference
                    });
                }
                if (rootNames.length) {
                    for (const parsedRef of resolvedProjectReferences) {
                        if (!parsedRef)
                            continue;
                        const out = parsedRef.commandLine.options.outFile || parsedRef.commandLine.options.out;
                        if (useSourceOfProjectReferenceRedirect) {
                            if (out || ts.getEmitModuleKind(parsedRef.commandLine.options) === ts.ModuleKind.None) {
                                for (const fileName of parsedRef.commandLine.fileNames) {
                                    processSourceFile(fileName, /*isDefaultLib*/ false, /*ignoreNoDefaultLib*/ false, /*packageId*/ undefined);
                                }
                            }
                        }
                        else {
                            if (out) {
                                processSourceFile(ts.changeExtension(out, ".d.ts"), /*isDefaultLib*/ false, /*ignoreNoDefaultLib*/ false, /*packageId*/ undefined);
                            }
                            else if (ts.getEmitModuleKind(parsedRef.commandLine.options) === ts.ModuleKind.None) {
                                for (const fileName of parsedRef.commandLine.fileNames) {
                                    if (!ts.fileExtensionIs(fileName, ts.Extension.Dts)) {
                                        processSourceFile(ts.getOutputDeclarationFileName(fileName, parsedRef.commandLine, !host.useCaseSensitiveFileNames()), /*isDefaultLib*/ false, /*ignoreNoDefaultLib*/ false, /*packageId*/ undefined);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            ts.forEach(rootNames, name => processRootFile(name, /*isDefaultLib*/ false, /*ignoreNoDefaultLib*/ false));
            // load type declarations specified via 'types' argument or implicitly from types/ and node_modules/@types folders
            const typeReferences: string[] = rootNames.length ? ts.getAutomaticTypeDirectiveNames(options, host) : ts.emptyArray;
            if (typeReferences.length) {
                // This containingFilename needs to match with the one used in managed-side
                const containingDirectory = options.configFilePath ? ts.getDirectoryPath(options.configFilePath) : host.getCurrentDirectory();
                const containingFilename = ts.combinePaths(containingDirectory, inferredTypesContainingFile);
                const resolutions = resolveTypeReferenceDirectiveNamesWorker(typeReferences, containingFilename);
                for (let i = 0; i < typeReferences.length; i++) {
                    processTypeReferenceDirective(typeReferences[i], resolutions[i]);
                }
            }
            // Do not process the default library if:
            //  - The '--noLib' flag is used.
            //  - A 'no-default-lib' reference comment is encountered in
            //      processing the root files.
            if (rootNames.length && !skipDefaultLib) {
                // If '--lib' is not specified, include default library file according to '--target'
                // otherwise, using options specified in '--lib' instead of '--target' default library file
                const defaultLibraryFileName = getDefaultLibraryFileName();
                if (!options.lib && defaultLibraryFileName) {
                    processRootFile(defaultLibraryFileName, /*isDefaultLib*/ true, /*ignoreNoDefaultLib*/ false);
                }
                else {
                    ts.forEach(options.lib, libFileName => {
                        processRootFile(ts.combinePaths(defaultLibraryPath, libFileName), /*isDefaultLib*/ true, /*ignoreNoDefaultLib*/ false);
                    });
                }
            }
            missingFilePaths = ts.arrayFrom(ts.mapDefinedIterator(filesByName.entries(), ([path, file]) => file === undefined ? path as ts.Path : undefined));
            files = ts.stableSort(processingDefaultLibFiles, compareDefaultLibFiles).concat(processingOtherFiles);
            processingDefaultLibFiles = undefined;
            processingOtherFiles = undefined;
        }
        ts.Debug.assert(!!missingFilePaths);
        // Release any files we have acquired in the old program but are
        // not part of the new program.
        if (oldProgram && host.onReleaseOldSourceFile) {
            const oldSourceFiles = oldProgram.getSourceFiles();
            for (const oldSourceFile of oldSourceFiles) {
                const newFile = getSourceFileByPath(oldSourceFile.resolvedPath);
                if (shouldCreateNewSourceFile || !newFile ||
                    // old file wasnt redirect but new file is
                    (oldSourceFile.resolvedPath === oldSourceFile.path && newFile.resolvedPath !== oldSourceFile.path)) {
                    host.onReleaseOldSourceFile(oldSourceFile, oldProgram.getCompilerOptions(), !!getSourceFileByPath(oldSourceFile.path));
                }
            }
            oldProgram.forEachResolvedProjectReference((resolvedProjectReference, resolvedProjectReferencePath) => {
                if (resolvedProjectReference && !getResolvedProjectReferenceByPath(resolvedProjectReferencePath)) {
                    host.onReleaseOldSourceFile!(resolvedProjectReference.sourceFile, oldProgram!.getCompilerOptions(), /*hasSourceFileByPath*/ false);
                }
            });
        }
        // unconditionally set oldProgram to undefined to prevent it from being captured in closure
        oldProgram = undefined;
        const program: ts.Program = {
            getRootFileNames: () => rootNames,
            getSourceFile,
            getSourceFileByPath,
            getSourceFiles: () => files,
            getMissingFilePaths: () => missingFilePaths!,
            getRefFileMap: () => refFileMap,
            getCompilerOptions: () => options,
            getSyntacticDiagnostics,
            getOptionsDiagnostics,
            getGlobalDiagnostics,
            getSemanticDiagnostics,
            getSuggestionDiagnostics,
            getDeclarationDiagnostics,
            getBindAndCheckDiagnostics,
            getProgramDiagnostics,
            getTypeChecker,
            getClassifiableNames,
            getDiagnosticsProducingTypeChecker,
            getCommonSourceDirectory,
            emit,
            getCurrentDirectory: () => currentDirectory,
            getNodeCount: () => getDiagnosticsProducingTypeChecker().getNodeCount(),
            getIdentifierCount: () => getDiagnosticsProducingTypeChecker().getIdentifierCount(),
            getSymbolCount: () => getDiagnosticsProducingTypeChecker().getSymbolCount(),
            getTypeCount: () => getDiagnosticsProducingTypeChecker().getTypeCount(),
            getRelationCacheSizes: () => getDiagnosticsProducingTypeChecker().getRelationCacheSizes(),
            getFileProcessingDiagnostics: () => fileProcessingDiagnostics,
            getResolvedTypeReferenceDirectives: () => resolvedTypeReferenceDirectives,
            isSourceFileFromExternalLibrary,
            isSourceFileDefaultLibrary,
            dropDiagnosticsProducingTypeChecker,
            getSourceFileFromReference,
            getLibFileFromReference,
            sourceFileToPackageName,
            redirectTargetsMap,
            isEmittedFile,
            getConfigFileParsingDiagnostics,
            getResolvedModuleWithFailedLookupLocationsFromCache,
            getProjectReferences,
            getResolvedProjectReferences,
            getProjectReferenceRedirect,
            getResolvedProjectReferenceToRedirect,
            getResolvedProjectReferenceByPath,
            forEachResolvedProjectReference,
            isSourceOfProjectReferenceRedirect,
            emitBuildInfo,
            getProbableSymlinks
        };
        verifyCompilerOptions();
        ts.performance.mark("afterProgram");
        ts.performance.measure("Program", "beforeProgram", "afterProgram");
        return program;
        function compareDefaultLibFiles(a: ts.SourceFile, b: ts.SourceFile) {
            return ts.compareValues(getDefaultLibFilePriority(a), getDefaultLibFilePriority(b));
        }
        function getDefaultLibFilePriority(a: ts.SourceFile) {
            if (ts.containsPath(defaultLibraryPath, a.fileName, /*ignoreCase*/ false)) {
                const basename = ts.getBaseFileName(a.fileName);
                if (basename === "lib.d.ts" || basename === "lib.es6.d.ts")
                    return 0;
                const name = ts.removeSuffix(ts.removePrefix(basename, "lib."), ".d.ts");
                const index = ts.libs.indexOf(name);
                if (index !== -1)
                    return index + 1;
            }
            return ts.libs.length + 2;
        }
        function getResolvedModuleWithFailedLookupLocationsFromCache(moduleName: string, containingFile: string): ts.ResolvedModuleWithFailedLookupLocations | undefined {
            return moduleResolutionCache && ts.resolveModuleNameFromCache(moduleName, containingFile, moduleResolutionCache);
        }
        function toPath(fileName: string): ts.Path {
            return ts.toPath(fileName, currentDirectory, getCanonicalFileName);
        }
        function getCommonSourceDirectory() {
            if (commonSourceDirectory === undefined) {
                const emittedFiles = ts.filter(files, file => ts.sourceFileMayBeEmitted(file, program));
                if (options.rootDir && checkSourceFilesBelongToPath(emittedFiles, options.rootDir)) {
                    // If a rootDir is specified use it as the commonSourceDirectory
                    commonSourceDirectory = ts.getNormalizedAbsolutePath(options.rootDir, currentDirectory);
                }
                else if (options.composite && options.configFilePath) {
                    // Project compilations never infer their root from the input source paths
                    commonSourceDirectory = ts.getDirectoryPath(ts.normalizeSlashes(options.configFilePath));
                    checkSourceFilesBelongToPath(emittedFiles, commonSourceDirectory);
                }
                else {
                    commonSourceDirectory = computeCommonSourceDirectory(emittedFiles);
                }
                if (commonSourceDirectory && commonSourceDirectory[commonSourceDirectory.length - 1] !== ts.directorySeparator) {
                    // Make sure directory path ends with directory separator so this string can directly
                    // used to replace with "" to get the relative path of the source file and the relative path doesn't
                    // start with / making it rooted path
                    commonSourceDirectory += ts.directorySeparator;
                }
            }
            return commonSourceDirectory;
        }
        function getClassifiableNames() {
            if (!classifiableNames) {
                // Initialize a checker so that all our files are bound.
                getTypeChecker();
                classifiableNames = ts.createUnderscoreEscapedMap<true>();
                for (const sourceFile of files) {
                    ts.copyEntries((sourceFile.classifiableNames!), classifiableNames);
                }
            }
            return classifiableNames;
        }
        function resolveModuleNamesReusingOldState(moduleNames: string[], containingFile: string, file: ts.SourceFile) {
            if (structuralIsReused === ts.StructureIsReused.Not && !file.ambientModuleNames.length) {
                // If the old program state does not permit reusing resolutions and `file` does not contain locally defined ambient modules,
                // the best we can do is fallback to the default logic.
                return resolveModuleNamesWorker(moduleNames, containingFile, /*reusedNames*/ undefined, getResolvedProjectReferenceToRedirect(file.originalFileName));
            }
            const oldSourceFile = oldProgram && oldProgram.getSourceFile(containingFile);
            if (oldSourceFile !== file && file.resolvedModules) {
                // `file` was created for the new program.
                //
                // We only set `file.resolvedModules` via work from the current function,
                // so it is defined iff we already called the current function on `file`.
                // That call happened no later than the creation of the `file` object,
                // which per above occurred during the current program creation.
                // Since we assume the filesystem does not change during program creation,
                // it is safe to reuse resolutions from the earlier call.
                const result: ts.ResolvedModuleFull[] = [];
                for (const moduleName of moduleNames) {
                    const resolvedModule = file.resolvedModules.get(moduleName)!;
                    result.push(resolvedModule);
                }
                return result;
            }
            // At this point, we know at least one of the following hold:
            // - file has local declarations for ambient modules
            // - old program state is available
            // With this information, we can infer some module resolutions without performing resolution.
            /** An ordered list of module names for which we cannot recover the resolution. */
            let unknownModuleNames: string[] | undefined;
            /**
             * The indexing of elements in this list matches that of `moduleNames`.
             *
             * Before combining results, result[i] is in one of the following states:
             * * undefined: needs to be recomputed,
             * * predictedToResolveToAmbientModuleMarker: known to be an ambient module.
             * Needs to be reset to undefined before returning,
             * * ResolvedModuleFull instance: can be reused.
             */
            let result: ts.ResolvedModuleFull[] | undefined;
            let reusedNames: string[] | undefined;
            /** A transient placeholder used to mark predicted resolution in the result list. */
            const predictedToResolveToAmbientModuleMarker: ts.ResolvedModuleFull = (<any>{});
            for (let i = 0; i < moduleNames.length; i++) {
                const moduleName = moduleNames[i];
                // If the source file is unchanged and doesnt have invalidated resolution, reuse the module resolutions
                if (file === oldSourceFile && !hasInvalidatedResolution(oldSourceFile.path)) {
                    const oldResolvedModule = oldSourceFile && oldSourceFile.resolvedModules!.get(moduleName);
                    if (oldResolvedModule) {
                        if (ts.isTraceEnabled(options, host)) {
                            ts.trace(host, ts.Diagnostics.Reusing_resolution_of_module_0_to_file_1_from_old_program, moduleName, containingFile);
                        }
                        (result || (result = new Array(moduleNames.length)))[i] = oldResolvedModule;
                        (reusedNames || (reusedNames = [])).push(moduleName);
                        continue;
                    }
                }
                // We know moduleName resolves to an ambient module provided that moduleName:
                // - is in the list of ambient modules locally declared in the current source file.
                // - resolved to an ambient module in the old program whose declaration is in an unmodified file
                //   (so the same module declaration will land in the new program)
                let resolvesToAmbientModuleInNonModifiedFile = false;
                if (ts.contains(file.ambientModuleNames, moduleName)) {
                    resolvesToAmbientModuleInNonModifiedFile = true;
                    if (ts.isTraceEnabled(options, host)) {
                        ts.trace(host, ts.Diagnostics.Module_0_was_resolved_as_locally_declared_ambient_module_in_file_1, moduleName, containingFile);
                    }
                }
                else {
                    resolvesToAmbientModuleInNonModifiedFile = moduleNameResolvesToAmbientModuleInNonModifiedFile(moduleName);
                }
                if (resolvesToAmbientModuleInNonModifiedFile) {
                    (result || (result = new Array(moduleNames.length)))[i] = predictedToResolveToAmbientModuleMarker;
                }
                else {
                    // Resolution failed in the old program, or resolved to an ambient module for which we can't reuse the result.
                    (unknownModuleNames || (unknownModuleNames = [])).push(moduleName);
                }
            }
            const resolutions = unknownModuleNames && unknownModuleNames.length
                ? resolveModuleNamesWorker(unknownModuleNames, containingFile, reusedNames, getResolvedProjectReferenceToRedirect(file.originalFileName))
                : ts.emptyArray;
            // Combine results of resolutions and predicted results
            if (!result) {
                // There were no unresolved/ambient resolutions.
                ts.Debug.assert(resolutions.length === moduleNames.length);
                return resolutions;
            }
            let j = 0;
            for (let i = 0; i < result.length; i++) {
                if (result[i]) {
                    // `result[i]` is either a `ResolvedModuleFull` or a marker.
                    // If it is the former, we can leave it as is.
                    if (result[i] === predictedToResolveToAmbientModuleMarker) {
                        result[i] = undefined!; // TODO: GH#18217
                    }
                }
                else {
                    result[i] = resolutions[j];
                    j++;
                }
            }
            ts.Debug.assert(j === resolutions.length);
            return result;
            // If we change our policy of rechecking failed lookups on each program create,
            // we should adjust the value returned here.
            function moduleNameResolvesToAmbientModuleInNonModifiedFile(moduleName: string): boolean {
                const resolutionToFile = ts.getResolvedModule(oldSourceFile, moduleName);
                const resolvedFile = resolutionToFile && oldProgram!.getSourceFile(resolutionToFile.resolvedFileName);
                if (resolutionToFile && resolvedFile) {
                    // In the old program, we resolved to an ambient module that was in the same
                    //   place as we expected to find an actual module file.
                    // We actually need to return 'false' here even though this seems like a 'true' case
                    //   because the normal module resolution algorithm will find this anyway.
                    return false;
                }
                // at least one of declarations should come from non-modified source file
                const unmodifiedFile = ambientModuleNameToUnmodifiedFileName.get(moduleName);
                if (!unmodifiedFile) {
                    return false;
                }
                if (ts.isTraceEnabled(options, host)) {
                    ts.trace(host, ts.Diagnostics.Module_0_was_resolved_as_ambient_module_declared_in_1_since_this_file_was_not_modified, moduleName, unmodifiedFile);
                }
                return true;
            }
        }
        function canReuseProjectReferences(): boolean {
            return !forEachProjectReference(oldProgram!.getProjectReferences(), oldProgram!.getResolvedProjectReferences(), (oldResolvedRef, index, parent) => {
                const newRef = (parent ? parent.commandLine.projectReferences : projectReferences)![index];
                const newResolvedRef = parseProjectReferenceConfigFile(newRef);
                if (oldResolvedRef) {
                    // Resolved project reference has gone missing or changed
                    return !newResolvedRef || newResolvedRef.sourceFile !== oldResolvedRef.sourceFile;
                }
                else {
                    // A previously-unresolved reference may be resolved now
                    return newResolvedRef !== undefined;
                }
            }, (oldProjectReferences, parent) => {
                // If array of references is changed, we cant resue old program
                const newReferences = parent ? getResolvedProjectReferenceByPath(parent.sourceFile.path)!.commandLine.projectReferences : projectReferences;
                return !ts.arrayIsEqualTo(oldProjectReferences, newReferences, ts.projectReferenceIsEqualTo);
            });
        }
        function tryReuseStructureFromOldProgram(): ts.StructureIsReused {
            if (!oldProgram) {
                return ts.StructureIsReused.Not;
            }
            // check properties that can affect structure of the program or module resolution strategy
            // if any of these properties has changed - structure cannot be reused
            const oldOptions = oldProgram.getCompilerOptions();
            if (ts.changesAffectModuleResolution(oldOptions, options)) {
                return oldProgram.structureIsReused = ts.StructureIsReused.Not;
            }
            ts.Debug.assert(!((oldProgram.structureIsReused!) & (ts.StructureIsReused.Completely | ts.StructureIsReused.SafeModules)));
            // there is an old program, check if we can reuse its structure
            const oldRootNames = oldProgram.getRootFileNames();
            if (!ts.arrayIsEqualTo(oldRootNames, rootNames)) {
                return oldProgram.structureIsReused = ts.StructureIsReused.Not;
            }
            if (!ts.arrayIsEqualTo(options.types, oldOptions.types)) {
                return oldProgram.structureIsReused = ts.StructureIsReused.Not;
            }
            // Check if any referenced project tsconfig files are different
            if (!canReuseProjectReferences()) {
                return oldProgram.structureIsReused = ts.StructureIsReused.Not;
            }
            if (projectReferences) {
                resolvedProjectReferences = projectReferences.map(parseProjectReferenceConfigFile);
                if (host.setResolvedProjectReferenceCallbacks) {
                    host.setResolvedProjectReferenceCallbacks({
                        getSourceOfProjectReferenceRedirect,
                        forEachResolvedProjectReference
                    });
                }
            }
            // check if program source files has changed in the way that can affect structure of the program
            const newSourceFiles: ts.SourceFile[] = [];
            const modifiedSourceFiles: {
                oldFile: ts.SourceFile;
                newFile: ts.SourceFile;
            }[] = [];
            oldProgram.structureIsReused = ts.StructureIsReused.Completely;
            // If the missing file paths are now present, it can change the progam structure,
            // and hence cant reuse the structure.
            // This is same as how we dont reuse the structure if one of the file from old program is now missing
            if (oldProgram.getMissingFilePaths().some(missingFilePath => host.fileExists(missingFilePath))) {
                return oldProgram.structureIsReused = ts.StructureIsReused.Not;
            }
            const oldSourceFiles = oldProgram.getSourceFiles();
            const enum SeenPackageName {
                Exists,
                Modified
            }
            const seenPackageNames = ts.createMap<SeenPackageName>();
            for (const oldSourceFile of oldSourceFiles) {
                let newSourceFile = host.getSourceFileByPath
                    ? host.getSourceFileByPath(oldSourceFile.fileName, oldSourceFile.resolvedPath, options.target!, /*onError*/ undefined, shouldCreateNewSourceFile)
                    : host.getSourceFile(oldSourceFile.fileName, options.target!, /*onError*/ undefined, shouldCreateNewSourceFile); // TODO: GH#18217
                if (!newSourceFile) {
                    return oldProgram.structureIsReused = ts.StructureIsReused.Not;
                }
                ts.Debug.assert(!newSourceFile.redirectInfo, "Host should not return a redirect source file from `getSourceFile`");
                let fileChanged: boolean;
                if (oldSourceFile.redirectInfo) {
                    // We got `newSourceFile` by path, so it is actually for the unredirected file.
                    // This lets us know if the unredirected file has changed. If it has we should break the redirect.
                    if (newSourceFile !== oldSourceFile.redirectInfo.unredirected) {
                        // Underlying file has changed. Might not redirect anymore. Must rebuild program.
                        return oldProgram.structureIsReused = ts.StructureIsReused.Not;
                    }
                    fileChanged = false;
                    newSourceFile = oldSourceFile; // Use the redirect.
                }
                else if (oldProgram.redirectTargetsMap.has(oldSourceFile.path)) {
                    // If a redirected-to source file changes, the redirect may be broken.
                    if (newSourceFile !== oldSourceFile) {
                        return oldProgram.structureIsReused = ts.StructureIsReused.Not;
                    }
                    fileChanged = false;
                }
                else {
                    fileChanged = newSourceFile !== oldSourceFile;
                }
                // Since the project references havent changed, its right to set originalFileName and resolvedPath here
                newSourceFile.path = oldSourceFile.path;
                newSourceFile.originalFileName = oldSourceFile.originalFileName;
                newSourceFile.resolvedPath = oldSourceFile.resolvedPath;
                newSourceFile.fileName = oldSourceFile.fileName;
                const packageName = oldProgram.sourceFileToPackageName.get(oldSourceFile.path);
                if (packageName !== undefined) {
                    // If there are 2 different source files for the same package name and at least one of them changes,
                    // they might become redirects. So we must rebuild the program.
                    const prevKind = seenPackageNames.get(packageName);
                    const newKind = fileChanged ? SeenPackageName.Modified : SeenPackageName.Exists;
                    if ((prevKind !== undefined && newKind === SeenPackageName.Modified) || prevKind === SeenPackageName.Modified) {
                        return oldProgram.structureIsReused = ts.StructureIsReused.Not;
                    }
                    seenPackageNames.set(packageName, newKind);
                }
                if (fileChanged) {
                    // The `newSourceFile` object was created for the new program.
                    if (!ts.arrayIsEqualTo(oldSourceFile.libReferenceDirectives, newSourceFile.libReferenceDirectives, fileReferenceIsEqualTo)) {
                        // 'lib' references has changed. Matches behavior in changesAffectModuleResolution
                        return oldProgram.structureIsReused = ts.StructureIsReused.Not;
                    }
                    if (oldSourceFile.hasNoDefaultLib !== newSourceFile.hasNoDefaultLib) {
                        // value of no-default-lib has changed
                        // this will affect if default library is injected into the list of files
                        oldProgram.structureIsReused = ts.StructureIsReused.SafeModules;
                    }
                    // check tripleslash references
                    if (!ts.arrayIsEqualTo(oldSourceFile.referencedFiles, newSourceFile.referencedFiles, fileReferenceIsEqualTo)) {
                        // tripleslash references has changed
                        oldProgram.structureIsReused = ts.StructureIsReused.SafeModules;
                    }
                    // check imports and module augmentations
                    collectExternalModuleReferences(newSourceFile);
                    if (!ts.arrayIsEqualTo(oldSourceFile.imports, newSourceFile.imports, moduleNameIsEqualTo)) {
                        // imports has changed
                        oldProgram.structureIsReused = ts.StructureIsReused.SafeModules;
                    }
                    if (!ts.arrayIsEqualTo(oldSourceFile.moduleAugmentations, newSourceFile.moduleAugmentations, moduleNameIsEqualTo)) {
                        // moduleAugmentations has changed
                        oldProgram.structureIsReused = ts.StructureIsReused.SafeModules;
                    }
                    if ((oldSourceFile.flags & ts.NodeFlags.PermanentlySetIncrementalFlags) !== (newSourceFile.flags & ts.NodeFlags.PermanentlySetIncrementalFlags)) {
                        // dynamicImport has changed
                        oldProgram.structureIsReused = ts.StructureIsReused.SafeModules;
                    }
                    if (!ts.arrayIsEqualTo(oldSourceFile.typeReferenceDirectives, newSourceFile.typeReferenceDirectives, fileReferenceIsEqualTo)) {
                        // 'types' references has changed
                        oldProgram.structureIsReused = ts.StructureIsReused.SafeModules;
                    }
                    // tentatively approve the file
                    modifiedSourceFiles.push({ oldFile: oldSourceFile, newFile: newSourceFile });
                }
                else if (hasInvalidatedResolution(oldSourceFile.path)) {
                    // 'module/types' references could have changed
                    oldProgram.structureIsReused = ts.StructureIsReused.SafeModules;
                    // add file to the modified list so that we will resolve it later
                    modifiedSourceFiles.push({ oldFile: oldSourceFile, newFile: newSourceFile });
                }
                // if file has passed all checks it should be safe to reuse it
                newSourceFiles.push(newSourceFile);
            }
            if (oldProgram.structureIsReused !== ts.StructureIsReused.Completely) {
                return oldProgram.structureIsReused;
            }
            const modifiedFiles = modifiedSourceFiles.map(f => f.oldFile);
            for (const oldFile of oldSourceFiles) {
                if (!ts.contains(modifiedFiles, oldFile)) {
                    for (const moduleName of oldFile.ambientModuleNames) {
                        ambientModuleNameToUnmodifiedFileName.set(moduleName, oldFile.fileName);
                    }
                }
            }
            // try to verify results of module resolution
            for (const { oldFile: oldSourceFile, newFile: newSourceFile } of modifiedSourceFiles) {
                const newSourceFilePath = ts.getNormalizedAbsolutePath(newSourceFile.originalFileName, currentDirectory);
                const moduleNames = getModuleNames(newSourceFile);
                const resolutions = resolveModuleNamesReusingOldState(moduleNames, newSourceFilePath, newSourceFile);
                // ensure that module resolution results are still correct
                const resolutionsChanged = ts.hasChangesInResolutions(moduleNames, resolutions, oldSourceFile.resolvedModules, ts.moduleResolutionIsEqualTo);
                if (resolutionsChanged) {
                    oldProgram.structureIsReused = ts.StructureIsReused.SafeModules;
                    newSourceFile.resolvedModules = ts.zipToMap(moduleNames, resolutions);
                }
                else {
                    newSourceFile.resolvedModules = oldSourceFile.resolvedModules;
                }
                if (resolveTypeReferenceDirectiveNamesWorker) {
                    // We lower-case all type references because npm automatically lowercases all packages. See GH#9824.
                    const typesReferenceDirectives = ts.map(newSourceFile.typeReferenceDirectives, ref => ref.fileName.toLocaleLowerCase());
                    const resolutions = resolveTypeReferenceDirectiveNamesWorker(typesReferenceDirectives, newSourceFilePath, getResolvedProjectReferenceToRedirect(newSourceFile.originalFileName));
                    // ensure that types resolutions are still correct
                    const resolutionsChanged = ts.hasChangesInResolutions(typesReferenceDirectives, resolutions, oldSourceFile.resolvedTypeReferenceDirectiveNames, ts.typeDirectiveIsEqualTo);
                    if (resolutionsChanged) {
                        oldProgram.structureIsReused = ts.StructureIsReused.SafeModules;
                        newSourceFile.resolvedTypeReferenceDirectiveNames = ts.zipToMap(typesReferenceDirectives, resolutions);
                    }
                    else {
                        newSourceFile.resolvedTypeReferenceDirectiveNames = oldSourceFile.resolvedTypeReferenceDirectiveNames;
                    }
                }
            }
            if (oldProgram.structureIsReused !== ts.StructureIsReused.Completely) {
                return oldProgram.structureIsReused;
            }
            if (host.hasChangedAutomaticTypeDirectiveNames) {
                return oldProgram.structureIsReused = ts.StructureIsReused.SafeModules;
            }
            missingFilePaths = oldProgram.getMissingFilePaths();
            refFileMap = oldProgram.getRefFileMap();
            // update fileName -> file mapping
            for (const newSourceFile of newSourceFiles) {
                const filePath = newSourceFile.path;
                addFileToFilesByName(newSourceFile, filePath, newSourceFile.resolvedPath);
                if (useSourceOfProjectReferenceRedirect) {
                    const redirectProject = getProjectReferenceRedirectProject(newSourceFile.fileName);
                    if (redirectProject && !(redirectProject.commandLine.options.outFile || redirectProject.commandLine.options.out)) {
                        const redirect = getProjectReferenceOutputName(redirectProject, newSourceFile.fileName);
                        addFileToFilesByName(newSourceFile, toPath(redirect), /*redirectedPath*/ undefined);
                    }
                }
                // Set the file as found during node modules search if it was found that way in old progra,
                if (oldProgram.isSourceFileFromExternalLibrary(oldProgram.getSourceFileByPath(newSourceFile.resolvedPath)!)) {
                    sourceFilesFoundSearchingNodeModules.set(filePath, true);
                }
            }
            files = newSourceFiles;
            fileProcessingDiagnostics = oldProgram.getFileProcessingDiagnostics();
            for (const modifiedFile of modifiedSourceFiles) {
                fileProcessingDiagnostics.reattachFileDiagnostics(modifiedFile.newFile);
            }
            resolvedTypeReferenceDirectives = oldProgram.getResolvedTypeReferenceDirectives();
            sourceFileToPackageName = oldProgram.sourceFileToPackageName;
            redirectTargetsMap = oldProgram.redirectTargetsMap;
            return oldProgram.structureIsReused = ts.StructureIsReused.Completely;
        }
        function getEmitHost(writeFileCallback?: ts.WriteFileCallback): ts.EmitHost {
            return {
                getPrependNodes,
                getCanonicalFileName,
                getCommonSourceDirectory: program.getCommonSourceDirectory,
                getCompilerOptions: program.getCompilerOptions,
                getCurrentDirectory: () => currentDirectory,
                getNewLine: () => host.getNewLine(),
                getSourceFile: program.getSourceFile,
                getSourceFileByPath: program.getSourceFileByPath,
                getSourceFiles: program.getSourceFiles,
                getLibFileFromReference: program.getLibFileFromReference,
                isSourceFileFromExternalLibrary,
                getResolvedProjectReferenceToRedirect,
                isSourceOfProjectReferenceRedirect,
                getProbableSymlinks,
                writeFile: writeFileCallback || ((fileName, data, writeByteOrderMark, onError, sourceFiles) => host.writeFile(fileName, data, writeByteOrderMark, onError, sourceFiles)),
                isEmitBlocked,
                readFile: f => host.readFile(f),
                fileExists: f => {
                    // Use local caches
                    const path = toPath(f);
                    if (getSourceFileByPath(path))
                        return true;
                    if (ts.contains(missingFilePaths, path))
                        return false;
                    // Before falling back to the host
                    return host.fileExists(f);
                },
                ...(host.directoryExists ? { directoryExists: f => host.directoryExists!(f) } : {}),
                useCaseSensitiveFileNames: () => host.useCaseSensitiveFileNames(),
                getProgramBuildInfo: () => program.getProgramBuildInfo && program.getProgramBuildInfo(),
                getSourceFileFromReference: (file, ref) => program.getSourceFileFromReference(file, ref),
                redirectTargetsMap,
            };
        }
        function emitBuildInfo(writeFileCallback?: ts.WriteFileCallback): ts.EmitResult {
            ts.Debug.assert(!options.out && !options.outFile);
            ts.performance.mark("beforeEmit");
            const emitResult = ts.emitFiles(ts.notImplementedResolver, getEmitHost(writeFileCallback), 
            /*targetSourceFile*/ undefined, ts.noTransformers, 
            /*emitOnlyDtsFiles*/ false, 
            /*onlyBuildInfo*/ true);
            ts.performance.mark("afterEmit");
            ts.performance.measure("Emit", "beforeEmit", "afterEmit");
            return emitResult;
        }
        function getResolvedProjectReferences() {
            return resolvedProjectReferences;
        }
        function getProjectReferences() {
            return projectReferences;
        }
        function getPrependNodes() {
            return createPrependNodes(projectReferences, (_ref, index) => resolvedProjectReferences![index]!.commandLine, fileName => {
                const path = toPath(fileName);
                const sourceFile = getSourceFileByPath(path);
                return sourceFile ? sourceFile.text : filesByName.has(path) ? undefined : host.readFile(path);
            });
        }
        function isSourceFileFromExternalLibrary(file: ts.SourceFile): boolean {
            return !!sourceFilesFoundSearchingNodeModules.get(file.path);
        }
        function isSourceFileDefaultLibrary(file: ts.SourceFile): boolean {
            if (file.hasNoDefaultLib) {
                return true;
            }
            if (!options.noLib) {
                return false;
            }
            // If '--lib' is not specified, include default library file according to '--target'
            // otherwise, using options specified in '--lib' instead of '--target' default library file
            const equalityComparer = host.useCaseSensitiveFileNames() ? ts.equateStringsCaseSensitive : ts.equateStringsCaseInsensitive;
            if (!options.lib) {
                return equalityComparer(file.fileName, getDefaultLibraryFileName());
            }
            else {
                return ts.some(options.lib, libFileName => equalityComparer(file.fileName, ts.combinePaths(defaultLibraryPath, libFileName)));
            }
        }
        function getDiagnosticsProducingTypeChecker() {
            return diagnosticsProducingTypeChecker || (diagnosticsProducingTypeChecker = ts.createTypeChecker(program, /*produceDiagnostics:*/ true));
        }
        function dropDiagnosticsProducingTypeChecker() {
            diagnosticsProducingTypeChecker = undefined!;
        }
        function getTypeChecker() {
            return noDiagnosticsTypeChecker || (noDiagnosticsTypeChecker = ts.createTypeChecker(program, /*produceDiagnostics:*/ false));
        }
        function emit(sourceFile?: ts.SourceFile, writeFileCallback?: ts.WriteFileCallback, cancellationToken?: ts.CancellationToken, emitOnlyDtsFiles?: boolean, transformers?: ts.CustomTransformers, forceDtsEmit?: boolean): ts.EmitResult {
            return runWithCancellationToken(() => emitWorker(program, sourceFile, writeFileCallback, cancellationToken, emitOnlyDtsFiles, transformers, forceDtsEmit));
        }
        function isEmitBlocked(emitFileName: string): boolean {
            return hasEmitBlockingDiagnostics.has(toPath(emitFileName));
        }
        function emitWorker(program: ts.Program, sourceFile: ts.SourceFile | undefined, writeFileCallback: ts.WriteFileCallback | undefined, cancellationToken: ts.CancellationToken | undefined, emitOnlyDtsFiles?: boolean, customTransformers?: ts.CustomTransformers, forceDtsEmit?: boolean): ts.EmitResult {
            if (!forceDtsEmit) {
                const result = handleNoEmitOptions(program, sourceFile, cancellationToken);
                if (result)
                    return result;
            }
            // Create the emit resolver outside of the "emitTime" tracking code below.  That way
            // any cost associated with it (like type checking) are appropriate associated with
            // the type-checking counter.
            //
            // If the -out option is specified, we should not pass the source file to getEmitResolver.
            // This is because in the -out scenario all files need to be emitted, and therefore all
            // files need to be type checked. And the way to specify that all files need to be type
            // checked is to not pass the file to getEmitResolver.
            const emitResolver = getDiagnosticsProducingTypeChecker().getEmitResolver((options.outFile || options.out) ? undefined : sourceFile, cancellationToken);
            ts.performance.mark("beforeEmit");
            const emitResult = ts.emitFiles(emitResolver, getEmitHost(writeFileCallback), sourceFile, ts.getTransformers(options, customTransformers, emitOnlyDtsFiles), emitOnlyDtsFiles, 
            /*onlyBuildInfo*/ false, forceDtsEmit);
            ts.performance.mark("afterEmit");
            ts.performance.measure("Emit", "beforeEmit", "afterEmit");
            return emitResult;
        }
        function getSourceFile(fileName: string): ts.SourceFile | undefined {
            return getSourceFileByPath(toPath(fileName));
        }
        function getSourceFileByPath(path: ts.Path): ts.SourceFile | undefined {
            return filesByName.get(path) || undefined;
        }
        function getDiagnosticsHelper<T extends ts.Diagnostic>(sourceFile: ts.SourceFile | undefined, getDiagnostics: (sourceFile: ts.SourceFile, cancellationToken: ts.CancellationToken | undefined) => readonly T[], cancellationToken: ts.CancellationToken | undefined): readonly T[] {
            if (sourceFile) {
                return getDiagnostics(sourceFile, cancellationToken);
            }
            return ts.sortAndDeduplicateDiagnostics(ts.flatMap(program.getSourceFiles(), sourceFile => {
                if (cancellationToken) {
                    cancellationToken.throwIfCancellationRequested();
                }
                return getDiagnostics(sourceFile, cancellationToken);
            }));
        }
        function getSyntacticDiagnostics(sourceFile?: ts.SourceFile, cancellationToken?: ts.CancellationToken): readonly ts.DiagnosticWithLocation[] {
            return getDiagnosticsHelper(sourceFile, getSyntacticDiagnosticsForFile, cancellationToken);
        }
        function getSemanticDiagnostics(sourceFile?: ts.SourceFile, cancellationToken?: ts.CancellationToken): readonly ts.Diagnostic[] {
            return getDiagnosticsHelper(sourceFile, getSemanticDiagnosticsForFile, cancellationToken);
        }
        function getBindAndCheckDiagnostics(sourceFile: ts.SourceFile, cancellationToken?: ts.CancellationToken): readonly ts.Diagnostic[] {
            return getBindAndCheckDiagnosticsForFile(sourceFile, cancellationToken);
        }
        function getProgramDiagnostics(sourceFile: ts.SourceFile): readonly ts.Diagnostic[] {
            if (ts.skipTypeChecking(sourceFile, options, program)) {
                return ts.emptyArray;
            }
            const fileProcessingDiagnosticsInFile = fileProcessingDiagnostics.getDiagnostics(sourceFile.fileName);
            const programDiagnosticsInFile = programDiagnostics.getDiagnostics(sourceFile.fileName);
            let diagnostics: ts.Diagnostic[] | undefined;
            for (const diags of [fileProcessingDiagnosticsInFile, programDiagnosticsInFile]) {
                if (diags) {
                    for (const diag of diags) {
                        if (shouldReportDiagnostic(diag)) {
                            diagnostics = ts.append(diagnostics, diag);
                        }
                    }
                }
            }
            return diagnostics || ts.emptyArray;
        }
        function getDeclarationDiagnostics(sourceFile?: ts.SourceFile, cancellationToken?: ts.CancellationToken): readonly ts.DiagnosticWithLocation[] {
            const options = program.getCompilerOptions();
            // collect diagnostics from the program only once if either no source file was specified or out/outFile is set (bundled emit)
            if (!sourceFile || options.out || options.outFile) {
                return getDeclarationDiagnosticsWorker(sourceFile, cancellationToken);
            }
            else {
                return getDiagnosticsHelper(sourceFile, getDeclarationDiagnosticsForFile, cancellationToken);
            }
        }
        function getSyntacticDiagnosticsForFile(sourceFile: ts.SourceFile): readonly ts.DiagnosticWithLocation[] {
            // For JavaScript files, we report semantic errors for using TypeScript-only
            // constructs from within a JavaScript file as syntactic errors.
            if (ts.isSourceFileJS(sourceFile)) {
                if (!sourceFile.additionalSyntacticDiagnostics) {
                    sourceFile.additionalSyntacticDiagnostics = getJSSyntacticDiagnosticsForFile(sourceFile);
                }
                return ts.concatenate(sourceFile.additionalSyntacticDiagnostics, sourceFile.parseDiagnostics);
            }
            return sourceFile.parseDiagnostics;
        }
        function runWithCancellationToken<T>(func: () => T): T {
            try {
                return func();
            }
            catch (e) {
                if (e instanceof ts.OperationCanceledException) {
                    // We were canceled while performing the operation.  Because our type checker
                    // might be a bad state, we need to throw it away.
                    //
                    // Note: we are overly aggressive here.  We do not actually *have* to throw away
                    // the "noDiagnosticsTypeChecker".  However, for simplicity, i'd like to keep
                    // the lifetimes of these two TypeCheckers the same.  Also, we generally only
                    // cancel when the user has made a change anyways.  And, in that case, we (the
                    // program instance) will get thrown away anyways.  So trying to keep one of
                    // these type checkers alive doesn't serve much purpose.
                    noDiagnosticsTypeChecker = undefined!;
                    diagnosticsProducingTypeChecker = undefined!;
                }
                throw e;
            }
        }
        function getSemanticDiagnosticsForFile(sourceFile: ts.SourceFile, cancellationToken: ts.CancellationToken | undefined): readonly ts.Diagnostic[] {
            return ts.concatenate(getBindAndCheckDiagnosticsForFile(sourceFile, cancellationToken), getProgramDiagnostics(sourceFile));
        }
        function getBindAndCheckDiagnosticsForFile(sourceFile: ts.SourceFile, cancellationToken: ts.CancellationToken | undefined): readonly ts.Diagnostic[] {
            return getAndCacheDiagnostics(sourceFile, cancellationToken, cachedBindAndCheckDiagnosticsForFile, getBindAndCheckDiagnosticsForFileNoCache);
        }
        function getBindAndCheckDiagnosticsForFileNoCache(sourceFile: ts.SourceFile, cancellationToken: ts.CancellationToken | undefined): readonly ts.Diagnostic[] {
            return runWithCancellationToken(() => {
                if (ts.skipTypeChecking(sourceFile, options, program)) {
                    return ts.emptyArray;
                }
                const typeChecker = getDiagnosticsProducingTypeChecker();
                ts.Debug.assert(!!sourceFile.bindDiagnostics);
                const isCheckJs = ts.isCheckJsEnabledForFile(sourceFile, options);
                const isTsNoCheck = !!sourceFile.checkJsDirective && sourceFile.checkJsDirective.enabled === false;
                // By default, only type-check .ts, .tsx, 'Deferred' and 'External' files (external files are added by plugins)
                const includeBindAndCheckDiagnostics = !isTsNoCheck && (sourceFile.scriptKind === ts.ScriptKind.TS || sourceFile.scriptKind === ts.ScriptKind.TSX ||
                    sourceFile.scriptKind === ts.ScriptKind.External || isCheckJs || sourceFile.scriptKind === ts.ScriptKind.Deferred);
                const bindDiagnostics: readonly ts.Diagnostic[] = includeBindAndCheckDiagnostics ? sourceFile.bindDiagnostics : ts.emptyArray;
                const checkDiagnostics = includeBindAndCheckDiagnostics ? typeChecker.getDiagnostics(sourceFile, cancellationToken) : ts.emptyArray;
                let diagnostics: ts.Diagnostic[] | undefined;
                for (const diags of [bindDiagnostics, checkDiagnostics, isCheckJs ? sourceFile.jsDocDiagnostics : undefined]) {
                    if (diags) {
                        for (const diag of diags) {
                            if (shouldReportDiagnostic(diag)) {
                                diagnostics = ts.append(diagnostics, diag);
                            }
                        }
                    }
                }
                return diagnostics || ts.emptyArray;
            });
        }
        function getSuggestionDiagnostics(sourceFile: ts.SourceFile, cancellationToken: ts.CancellationToken): readonly ts.DiagnosticWithLocation[] {
            return runWithCancellationToken(() => {
                return getDiagnosticsProducingTypeChecker().getSuggestionDiagnostics(sourceFile, cancellationToken);
            });
        }
        /**
         * Skip errors if previous line start with '// @ts-ignore' comment, not counting non-empty non-comment lines
         */
        function shouldReportDiagnostic(diagnostic: ts.Diagnostic) {
            const { file, start } = diagnostic;
            if (file) {
                const lineStarts = ts.getLineStarts(file);
                let { line } = ts.computeLineAndCharacterOfPosition(lineStarts, (start!)); // TODO: GH#18217
                while (line > 0) {
                    const previousLineText = file.text.slice(lineStarts[line - 1], lineStarts[line]);
                    const result = ignoreDiagnosticCommentRegEx.exec(previousLineText);
                    if (!result) {
                        // non-empty line
                        return true;
                    }
                    if (result[3]) {
                        // @ts-ignore
                        return false;
                    }
                    line--;
                }
            }
            return true;
        }
        function getJSSyntacticDiagnosticsForFile(sourceFile: ts.SourceFile): ts.DiagnosticWithLocation[] {
            return runWithCancellationToken(() => {
                const diagnostics: ts.DiagnosticWithLocation[] = [];
                let parent: ts.Node = sourceFile;
                walk(sourceFile);
                return diagnostics;
                function walk(node: ts.Node) {
                    // Return directly from the case if the given node doesnt want to visit each child
                    // Otherwise break to visit each child
                    switch (parent.kind) {
                        case ts.SyntaxKind.Parameter:
                        case ts.SyntaxKind.PropertyDeclaration:
                        case ts.SyntaxKind.MethodDeclaration:
                            if ((<ts.ParameterDeclaration | ts.PropertyDeclaration | ts.MethodDeclaration>parent).questionToken === node) {
                                diagnostics.push(createDiagnosticForNode(node, ts.Diagnostics.The_0_modifier_can_only_be_used_in_TypeScript_files, "?"));
                                return;
                            }
                        // falls through
                        case ts.SyntaxKind.MethodSignature:
                        case ts.SyntaxKind.Constructor:
                        case ts.SyntaxKind.GetAccessor:
                        case ts.SyntaxKind.SetAccessor:
                        case ts.SyntaxKind.FunctionExpression:
                        case ts.SyntaxKind.FunctionDeclaration:
                        case ts.SyntaxKind.ArrowFunction:
                        case ts.SyntaxKind.VariableDeclaration:
                            // type annotation
                            if ((<ts.FunctionLikeDeclaration | ts.VariableDeclaration | ts.ParameterDeclaration | ts.PropertyDeclaration>parent).type === node) {
                                diagnostics.push(createDiagnosticForNode(node, ts.Diagnostics.Type_annotations_can_only_be_used_in_TypeScript_files));
                                return;
                            }
                    }
                    switch (node.kind) {
                        case ts.SyntaxKind.ImportEqualsDeclaration:
                            diagnostics.push(createDiagnosticForNode(node, ts.Diagnostics.import_can_only_be_used_in_TypeScript_files));
                            return;
                        case ts.SyntaxKind.ExportAssignment:
                            if ((<ts.ExportAssignment>node).isExportEquals) {
                                diagnostics.push(createDiagnosticForNode(node, ts.Diagnostics.export_can_only_be_used_in_TypeScript_files));
                                return;
                            }
                            break;
                        case ts.SyntaxKind.HeritageClause:
                            const heritageClause = (<ts.HeritageClause>node);
                            if (heritageClause.token === ts.SyntaxKind.ImplementsKeyword) {
                                diagnostics.push(createDiagnosticForNode(node, ts.Diagnostics.implements_clauses_can_only_be_used_in_TypeScript_files));
                                return;
                            }
                            break;
                        case ts.SyntaxKind.InterfaceDeclaration:
                            diagnostics.push(createDiagnosticForNode(node, ts.Diagnostics.Interface_declaration_cannot_have_implements_clause));
                            return;
                        case ts.SyntaxKind.ModuleDeclaration:
                            const moduleKeyword = node.flags & ts.NodeFlags.Namespace ? ts.tokenToString(ts.SyntaxKind.NamespaceKeyword) : ts.tokenToString(ts.SyntaxKind.ModuleKeyword);
                            ts.Debug.assertDefined(moduleKeyword);
                            diagnostics.push(createDiagnosticForNode(node, ts.Diagnostics._0_declarations_can_only_be_used_in_TypeScript_files, moduleKeyword));
                            return;
                        case ts.SyntaxKind.TypeAliasDeclaration:
                            diagnostics.push(createDiagnosticForNode(node, ts.Diagnostics.Type_aliases_can_only_be_used_in_TypeScript_files));
                            return;
                        case ts.SyntaxKind.EnumDeclaration:
                            const enumKeyword = ts.Debug.assertDefined(ts.tokenToString(ts.SyntaxKind.EnumKeyword));
                            diagnostics.push(createDiagnosticForNode(node, ts.Diagnostics._0_declarations_can_only_be_used_in_TypeScript_files, enumKeyword));
                            return;
                        case ts.SyntaxKind.NonNullExpression:
                            diagnostics.push(createDiagnosticForNode(node, ts.Diagnostics.Non_null_assertions_can_only_be_used_in_TypeScript_files));
                            return;
                        case ts.SyntaxKind.AsExpression:
                            diagnostics.push(createDiagnosticForNode((node as ts.AsExpression).type, ts.Diagnostics.Type_assertion_expressions_can_only_be_used_in_TypeScript_files));
                            return;
                        case ts.SyntaxKind.TypeAssertionExpression:
                            ts.Debug.fail(); // Won't parse these in a JS file anyway, as they are interpreted as JSX.
                    }
                    const prevParent = parent;
                    parent = node;
                    ts.forEachChild(node, walk, walkArray);
                    parent = prevParent;
                }
                function walkArray(nodes: ts.NodeArray<ts.Node>) {
                    if (parent.decorators === nodes && !options.experimentalDecorators) {
                        diagnostics.push(createDiagnosticForNode(parent, ts.Diagnostics.Experimental_support_for_decorators_is_a_feature_that_is_subject_to_change_in_a_future_release_Set_the_experimentalDecorators_option_in_your_tsconfig_or_jsconfig_to_remove_this_warning));
                    }
                    switch (parent.kind) {
                        case ts.SyntaxKind.ClassDeclaration:
                        case ts.SyntaxKind.ClassExpression:
                        case ts.SyntaxKind.MethodDeclaration:
                        case ts.SyntaxKind.Constructor:
                        case ts.SyntaxKind.GetAccessor:
                        case ts.SyntaxKind.SetAccessor:
                        case ts.SyntaxKind.FunctionExpression:
                        case ts.SyntaxKind.FunctionDeclaration:
                        case ts.SyntaxKind.ArrowFunction:
                            // Check type parameters
                            if (nodes === (<ts.DeclarationWithTypeParameterChildren>parent).typeParameters) {
                                diagnostics.push(createDiagnosticForNodeArray(nodes, ts.Diagnostics.Type_parameter_declarations_can_only_be_used_in_TypeScript_files));
                                return;
                            }
                        // falls through
                        case ts.SyntaxKind.VariableStatement:
                            // Check modifiers
                            if (nodes === parent.modifiers) {
                                return checkModifiers(parent.modifiers, parent.kind === ts.SyntaxKind.VariableStatement);
                            }
                            break;
                        case ts.SyntaxKind.PropertyDeclaration:
                            // Check modifiers of property declaration
                            if (nodes === (<ts.PropertyDeclaration>parent).modifiers) {
                                for (const modifier of <ts.NodeArray<ts.Modifier>>nodes) {
                                    if (modifier.kind !== ts.SyntaxKind.StaticKeyword) {
                                        diagnostics.push(createDiagnosticForNode(modifier, ts.Diagnostics.The_0_modifier_can_only_be_used_in_TypeScript_files, ts.tokenToString(modifier.kind)));
                                    }
                                }
                                return;
                            }
                            break;
                        case ts.SyntaxKind.Parameter:
                            // Check modifiers of parameter declaration
                            if (nodes === (<ts.ParameterDeclaration>parent).modifiers) {
                                diagnostics.push(createDiagnosticForNodeArray(nodes, ts.Diagnostics.Parameter_modifiers_can_only_be_used_in_TypeScript_files));
                                return;
                            }
                            break;
                        case ts.SyntaxKind.CallExpression:
                        case ts.SyntaxKind.NewExpression:
                        case ts.SyntaxKind.ExpressionWithTypeArguments:
                        case ts.SyntaxKind.JsxSelfClosingElement:
                        case ts.SyntaxKind.JsxOpeningElement:
                        case ts.SyntaxKind.TaggedTemplateExpression:
                            // Check type arguments
                            if (nodes === (<ts.NodeWithTypeArguments>parent).typeArguments) {
                                diagnostics.push(createDiagnosticForNodeArray(nodes, ts.Diagnostics.Type_arguments_can_only_be_used_in_TypeScript_files));
                                return;
                            }
                            break;
                    }
                    for (const node of nodes) {
                        walk(node);
                    }
                }
                function checkModifiers(modifiers: ts.NodeArray<ts.Modifier>, isConstValid: boolean) {
                    for (const modifier of modifiers) {
                        switch (modifier.kind) {
                            case ts.SyntaxKind.ConstKeyword:
                                if (isConstValid) {
                                    continue;
                                }
                            // to report error,
                            // falls through
                            case ts.SyntaxKind.PublicKeyword:
                            case ts.SyntaxKind.PrivateKeyword:
                            case ts.SyntaxKind.ProtectedKeyword:
                            case ts.SyntaxKind.ReadonlyKeyword:
                            case ts.SyntaxKind.DeclareKeyword:
                            case ts.SyntaxKind.AbstractKeyword:
                                diagnostics.push(createDiagnosticForNode(modifier, ts.Diagnostics.The_0_modifier_can_only_be_used_in_TypeScript_files, ts.tokenToString(modifier.kind)));
                                break;
                            // These are all legal modifiers.
                            case ts.SyntaxKind.StaticKeyword:
                            case ts.SyntaxKind.ExportKeyword:
                            case ts.SyntaxKind.DefaultKeyword:
                        }
                    }
                }
                function createDiagnosticForNodeArray(nodes: ts.NodeArray<ts.Node>, message: ts.DiagnosticMessage, arg0?: string | number, arg1?: string | number, arg2?: string | number): ts.DiagnosticWithLocation {
                    const start = nodes.pos;
                    return ts.createFileDiagnostic(sourceFile, start, nodes.end - start, message, arg0, arg1, arg2);
                }
                // Since these are syntactic diagnostics, parent might not have been set
                // this means the sourceFile cannot be infered from the node
                function createDiagnosticForNode(node: ts.Node, message: ts.DiagnosticMessage, arg0?: string | number, arg1?: string | number, arg2?: string | number): ts.DiagnosticWithLocation {
                    return ts.createDiagnosticForNodeInSourceFile(sourceFile, node, message, arg0, arg1, arg2);
                }
            });
        }
        function getDeclarationDiagnosticsWorker(sourceFile: ts.SourceFile | undefined, cancellationToken: ts.CancellationToken | undefined): readonly ts.DiagnosticWithLocation[] {
            return getAndCacheDiagnostics(sourceFile, cancellationToken, cachedDeclarationDiagnosticsForFile, getDeclarationDiagnosticsForFileNoCache);
        }
        function getDeclarationDiagnosticsForFileNoCache(sourceFile: ts.SourceFile | undefined, cancellationToken: ts.CancellationToken | undefined): readonly ts.DiagnosticWithLocation[] {
            return runWithCancellationToken(() => {
                const resolver = getDiagnosticsProducingTypeChecker().getEmitResolver(sourceFile, cancellationToken);
                // Don't actually write any files since we're just getting diagnostics.
                return ts.getDeclarationDiagnostics(getEmitHost(ts.noop), resolver, sourceFile) || ts.emptyArray;
            });
        }
        function getAndCacheDiagnostics<T extends ts.SourceFile | undefined, U extends ts.Diagnostic>(sourceFile: T, cancellationToken: ts.CancellationToken | undefined, cache: DiagnosticCache<U>, getDiagnostics: (sourceFile: T, cancellationToken: ts.CancellationToken | undefined) => readonly U[]): readonly U[] {
            const cachedResult = sourceFile
                ? cache.perFile && cache.perFile.get(sourceFile.path)
                : cache.allDiagnostics;
            if (cachedResult) {
                return cachedResult;
            }
            const result = getDiagnostics(sourceFile, cancellationToken);
            if (sourceFile) {
                if (!cache.perFile) {
                    cache.perFile = ts.createMap();
                }
                cache.perFile.set(sourceFile.path, result);
            }
            else {
                cache.allDiagnostics = result;
            }
            return result;
        }
        function getDeclarationDiagnosticsForFile(sourceFile: ts.SourceFile, cancellationToken: ts.CancellationToken): readonly ts.DiagnosticWithLocation[] {
            return sourceFile.isDeclarationFile ? [] : getDeclarationDiagnosticsWorker(sourceFile, cancellationToken);
        }
        function getOptionsDiagnostics(): ts.SortedReadonlyArray<ts.Diagnostic> {
            return ts.sortAndDeduplicateDiagnostics(ts.concatenate(fileProcessingDiagnostics.getGlobalDiagnostics(), ts.concatenate(programDiagnostics.getGlobalDiagnostics(), getOptionsDiagnosticsOfConfigFile())));
        }
        function getOptionsDiagnosticsOfConfigFile() {
            if (!options.configFile) {
                return ts.emptyArray;
            }
            let diagnostics = programDiagnostics.getDiagnostics(options.configFile.fileName);
            forEachResolvedProjectReference(resolvedRef => {
                if (resolvedRef) {
                    diagnostics = ts.concatenate(diagnostics, programDiagnostics.getDiagnostics(resolvedRef.sourceFile.fileName));
                }
            });
            return diagnostics;
        }
        function getGlobalDiagnostics(): ts.SortedReadonlyArray<ts.Diagnostic> {
            return rootNames.length ? ts.sortAndDeduplicateDiagnostics(getDiagnosticsProducingTypeChecker().getGlobalDiagnostics().slice()) : ts.emptyArray as any as ts.SortedReadonlyArray<ts.Diagnostic>;
        }
        function getConfigFileParsingDiagnostics(): readonly ts.Diagnostic[] {
            return configFileParsingDiagnostics || ts.emptyArray;
        }
        function processRootFile(fileName: string, isDefaultLib: boolean, ignoreNoDefaultLib: boolean) {
            processSourceFile(ts.normalizePath(fileName), isDefaultLib, ignoreNoDefaultLib, /*packageId*/ undefined);
        }
        function fileReferenceIsEqualTo(a: ts.FileReference, b: ts.FileReference): boolean {
            return a.fileName === b.fileName;
        }
        function moduleNameIsEqualTo(a: ts.StringLiteralLike | ts.Identifier, b: ts.StringLiteralLike | ts.Identifier): boolean {
            return a.kind === ts.SyntaxKind.Identifier
                ? b.kind === ts.SyntaxKind.Identifier && a.escapedText === b.escapedText
                : b.kind === ts.SyntaxKind.StringLiteral && a.text === b.text;
        }
        function collectExternalModuleReferences(file: ts.SourceFile): void {
            if (file.imports) {
                return;
            }
            const isJavaScriptFile = ts.isSourceFileJS(file);
            const isExternalModuleFile = ts.isExternalModule(file);
            // file.imports may not be undefined if there exists dynamic import
            let imports: ts.StringLiteralLike[] | undefined;
            let moduleAugmentations: (ts.StringLiteral | ts.Identifier)[] | undefined;
            let ambientModules: string[] | undefined;
            // If we are importing helpers, we need to add a synthetic reference to resolve the
            // helpers library.
            if (options.importHelpers
                && (options.isolatedModules || isExternalModuleFile)
                && !file.isDeclarationFile) {
                // synthesize 'import "tslib"' declaration
                const externalHelpersModuleReference = ts.createLiteral(ts.externalHelpersModuleNameText);
                const importDecl = ts.createImportDeclaration(/*decorators*/ undefined, /*modifiers*/ undefined, /*importClause*/ undefined, externalHelpersModuleReference);
                ts.addEmitFlags(importDecl, ts.EmitFlags.NeverApplyImportHelper);
                externalHelpersModuleReference.parent = importDecl;
                importDecl.parent = file;
                imports = [externalHelpersModuleReference];
            }
            for (const node of file.statements) {
                collectModuleReferences(node, /*inAmbientModule*/ false);
            }
            if ((file.flags & ts.NodeFlags.PossiblyContainsDynamicImport) || isJavaScriptFile) {
                collectDynamicImportOrRequireCalls(file);
            }
            file.imports = imports || ts.emptyArray;
            file.moduleAugmentations = moduleAugmentations || ts.emptyArray;
            file.ambientModuleNames = ambientModules || ts.emptyArray;
            return;
            function collectModuleReferences(node: ts.Statement, inAmbientModule: boolean): void {
                if (ts.isAnyImportOrReExport(node)) {
                    const moduleNameExpr = ts.getExternalModuleName(node);
                    // TypeScript 1.0 spec (April 2014): 12.1.6
                    // An ExternalImportDeclaration in an AmbientExternalModuleDeclaration may reference other external modules
                    // only through top - level external module names. Relative external module names are not permitted.
                    if (moduleNameExpr && ts.isStringLiteral(moduleNameExpr) && moduleNameExpr.text && (!inAmbientModule || !ts.isExternalModuleNameRelative(moduleNameExpr.text))) {
                        imports = ts.append(imports, moduleNameExpr);
                    }
                }
                else if (ts.isModuleDeclaration(node)) {
                    if (ts.isAmbientModule(node) && (inAmbientModule || ts.hasModifier(node, ts.ModifierFlags.Ambient) || file.isDeclarationFile)) {
                        const nameText = ts.getTextOfIdentifierOrLiteral(node.name);
                        // Ambient module declarations can be interpreted as augmentations for some existing external modules.
                        // This will happen in two cases:
                        // - if current file is external module then module augmentation is a ambient module declaration defined in the top level scope
                        // - if current file is not external module then module augmentation is an ambient module declaration with non-relative module name
                        //   immediately nested in top level ambient module declaration .
                        if (isExternalModuleFile || (inAmbientModule && !ts.isExternalModuleNameRelative(nameText))) {
                            (moduleAugmentations || (moduleAugmentations = [])).push(node.name);
                        }
                        else if (!inAmbientModule) {
                            if (file.isDeclarationFile) {
                                // for global .d.ts files record name of ambient module
                                (ambientModules || (ambientModules = [])).push(nameText);
                            }
                            // An AmbientExternalModuleDeclaration declares an external module.
                            // This type of declaration is permitted only in the global module.
                            // The StringLiteral must specify a top - level external module name.
                            // Relative external module names are not permitted
                            // NOTE: body of ambient module is always a module block, if it exists
                            const body = (<ts.ModuleBlock>(<ts.ModuleDeclaration>node).body);
                            if (body) {
                                for (const statement of body.statements) {
                                    collectModuleReferences(statement, /*inAmbientModule*/ true);
                                }
                            }
                        }
                    }
                }
            }
            function collectDynamicImportOrRequireCalls(file: ts.SourceFile) {
                const r = /import|require/g;
                while (r.exec(file.text) !== null) { // eslint-disable-line no-null/no-null
                    const node = getNodeAtPosition(file, r.lastIndex);
                    if (ts.isRequireCall(node, /*checkArgumentIsStringLiteralLike*/ true)) {
                        imports = ts.append(imports, node.arguments[0]);
                    }
                    // we have to check the argument list has length of 1. We will still have to process these even though we have parsing error.
                    else if (ts.isImportCall(node) && node.arguments.length === 1 && ts.isStringLiteralLike(node.arguments[0])) {
                        imports = ts.append(imports, (node.arguments[0] as ts.StringLiteralLike));
                    }
                    else if (ts.isLiteralImportTypeNode(node)) {
                        imports = ts.append(imports, node.argument.literal);
                    }
                }
            }
            /** Returns a token if position is in [start-of-leading-trivia, end), includes JSDoc only in JS files */
            function getNodeAtPosition(sourceFile: ts.SourceFile, position: number): ts.Node {
                let current: ts.Node = sourceFile;
                const getContainingChild = (child: ts.Node) => {
                    if (child.pos <= position && (position < child.end || (position === child.end && (child.kind === ts.SyntaxKind.EndOfFileToken)))) {
                        return child;
                    }
                };
                while (true) {
                    const child = isJavaScriptFile && ts.hasJSDocNodes(current) && ts.forEach(current.jsDoc, getContainingChild) || ts.forEachChild(current, getContainingChild);
                    if (!child) {
                        return current;
                    }
                    current = child;
                }
            }
        }
        function getLibFileFromReference(ref: ts.FileReference) {
            const libName = ref.fileName.toLocaleLowerCase();
            const libFileName = ts.libMap.get(libName);
            if (libFileName) {
                return getSourceFile(ts.combinePaths(defaultLibraryPath, libFileName));
            }
        }
        /** This should have similar behavior to 'processSourceFile' without diagnostics or mutation. */
        function getSourceFileFromReference(referencingFile: ts.SourceFile | ts.UnparsedSource, ref: ts.FileReference): ts.SourceFile | undefined {
            return getSourceFileFromReferenceWorker(resolveTripleslashReference(ref.fileName, referencingFile.fileName), fileName => filesByName.get(toPath(fileName)) || undefined);
        }
        function getSourceFileFromReferenceWorker(fileName: string, getSourceFile: (fileName: string) => ts.SourceFile | undefined, fail?: (diagnostic: ts.DiagnosticMessage, ...argument: string[]) => void, refFile?: ts.SourceFile): ts.SourceFile | undefined {
            if (ts.hasExtension(fileName)) {
                const canonicalFileName = host.getCanonicalFileName(fileName);
                if (!options.allowNonTsExtensions && !ts.forEach(supportedExtensionsWithJsonIfResolveJsonModule, extension => ts.fileExtensionIs(canonicalFileName, extension))) {
                    if (fail) {
                        if (ts.hasJSFileExtension(canonicalFileName)) {
                            fail(ts.Diagnostics.File_0_is_a_JavaScript_file_Did_you_mean_to_enable_the_allowJs_option, fileName);
                        }
                        else {
                            fail(ts.Diagnostics.File_0_has_an_unsupported_extension_The_only_supported_extensions_are_1, fileName, "'" + supportedExtensions.join("', '") + "'");
                        }
                    }
                    return undefined;
                }
                const sourceFile = getSourceFile(fileName);
                if (fail) {
                    if (!sourceFile) {
                        const redirect = getProjectReferenceRedirect(fileName);
                        if (redirect) {
                            fail(ts.Diagnostics.Output_file_0_has_not_been_built_from_source_file_1, redirect, fileName);
                        }
                        else {
                            fail(ts.Diagnostics.File_0_not_found, fileName);
                        }
                    }
                    else if (refFile && canonicalFileName === host.getCanonicalFileName(refFile.fileName)) {
                        fail(ts.Diagnostics.A_file_cannot_have_a_reference_to_itself);
                    }
                }
                return sourceFile;
            }
            else {
                const sourceFileNoExtension = options.allowNonTsExtensions && getSourceFile(fileName);
                if (sourceFileNoExtension)
                    return sourceFileNoExtension;
                if (fail && options.allowNonTsExtensions) {
                    fail(ts.Diagnostics.File_0_not_found, fileName);
                    return undefined;
                }
                const sourceFileWithAddedExtension = ts.forEach(supportedExtensions, extension => getSourceFile(fileName + extension));
                if (fail && !sourceFileWithAddedExtension)
                    fail(ts.Diagnostics.File_0_not_found, fileName + ts.Extension.Ts);
                return sourceFileWithAddedExtension;
            }
        }
        /** This has side effects through `findSourceFile`. */
        function processSourceFile(fileName: string, isDefaultLib: boolean, ignoreNoDefaultLib: boolean, packageId: ts.PackageId | undefined, refFile?: RefFile): void {
            getSourceFileFromReferenceWorker(fileName, fileName => findSourceFile(fileName, toPath(fileName), isDefaultLib, ignoreNoDefaultLib, refFile, packageId), // TODO: GH#18217
            (diagnostic, ...args) => fileProcessingDiagnostics.add(createRefFileDiagnostic(refFile, diagnostic, ...args)), refFile && refFile.file);
        }
        function reportFileNamesDifferOnlyInCasingError(fileName: string, existingFile: ts.SourceFile, refFile: RefFile | undefined): void {
            const refs = !refFile ? refFileMap && refFileMap.get(existingFile.path) : undefined;
            const refToReportErrorOn = refs && ts.find(refs, ref => ref.referencedFileName === existingFile.fileName);
            fileProcessingDiagnostics.add(refToReportErrorOn ?
                createFileDiagnosticAtReference(refToReportErrorOn, ts.Diagnostics.Already_included_file_name_0_differs_from_file_name_1_only_in_casing, existingFile.fileName, fileName) :
                createRefFileDiagnostic(refFile, ts.Diagnostics.File_name_0_differs_from_already_included_file_name_1_only_in_casing, fileName, existingFile.fileName));
        }
        function createRedirectSourceFile(redirectTarget: ts.SourceFile, unredirected: ts.SourceFile, fileName: string, path: ts.Path, resolvedPath: ts.Path, originalFileName: string): ts.SourceFile {
            const redirect: ts.SourceFile = Object.create(redirectTarget);
            redirect.fileName = fileName;
            redirect.path = path;
            redirect.resolvedPath = resolvedPath;
            redirect.originalFileName = originalFileName;
            redirect.redirectInfo = { redirectTarget, unredirected };
            sourceFilesFoundSearchingNodeModules.set(path, currentNodeModulesDepth > 0);
            Object.defineProperties(redirect, {
                id: {
                    get(this: ts.SourceFile) { return this.redirectInfo!.redirectTarget.id; },
                    set(this: ts.SourceFile, value: ts.SourceFile["id"]) { this.redirectInfo!.redirectTarget.id = value; },
                },
                symbol: {
                    get(this: ts.SourceFile) { return this.redirectInfo!.redirectTarget.symbol; },
                    set(this: ts.SourceFile, value: ts.SourceFile["symbol"]) { this.redirectInfo!.redirectTarget.symbol = value; },
                },
            });
            return redirect;
        }
        // Get source file from normalized fileName
        function findSourceFile(fileName: string, path: ts.Path, isDefaultLib: boolean, ignoreNoDefaultLib: boolean, refFile: RefFile | undefined, packageId: ts.PackageId | undefined): ts.SourceFile | undefined {
            if (useSourceOfProjectReferenceRedirect) {
                let source = getSourceOfProjectReferenceRedirect(fileName);
                // If preserveSymlinks is true, module resolution wont jump the symlink
                // but the resolved real path may be the .d.ts from project reference
                // Note:: Currently we try the real path only if the
                // file is from node_modules to avoid having to run real path on all file paths
                if (!source &&
                    host.realpath &&
                    options.preserveSymlinks &&
                    ts.isDeclarationFileName(fileName) &&
                    ts.stringContains(fileName, ts.nodeModulesPathPart)) {
                    const realPath = host.realpath(fileName);
                    if (realPath !== fileName)
                        source = getSourceOfProjectReferenceRedirect(realPath);
                }
                if (source) {
                    const file = ts.isString(source) ?
                        findSourceFile(source, toPath(source), isDefaultLib, ignoreNoDefaultLib, refFile, packageId) :
                        undefined;
                    if (file)
                        addFileToFilesByName(file, path, /*redirectedPath*/ undefined);
                    return file;
                }
            }
            const originalFileName = fileName;
            if (filesByName.has(path)) {
                const file = filesByName.get(path);
                addFileToRefFileMap(fileName, file || undefined, refFile);
                // try to check if we've already seen this file but with a different casing in path
                // NOTE: this only makes sense for case-insensitive file systems, and only on files which are not redirected
                if (file && options.forceConsistentCasingInFileNames) {
                    const checkedName = file.fileName;
                    const isRedirect = toPath(checkedName) !== toPath(fileName);
                    if (isRedirect) {
                        fileName = getProjectReferenceRedirect(fileName) || fileName;
                    }
                    // Check if it differs only in drive letters its ok to ignore that error:
                    const checkedAbsolutePath = ts.getNormalizedAbsolutePathWithoutRoot(checkedName, currentDirectory);
                    const inputAbsolutePath = ts.getNormalizedAbsolutePathWithoutRoot(fileName, currentDirectory);
                    if (checkedAbsolutePath !== inputAbsolutePath) {
                        reportFileNamesDifferOnlyInCasingError(fileName, file, refFile);
                    }
                }
                // If the file was previously found via a node_modules search, but is now being processed as a root file,
                // then everything it sucks in may also be marked incorrectly, and needs to be checked again.
                if (file && sourceFilesFoundSearchingNodeModules.get(file.path) && currentNodeModulesDepth === 0) {
                    sourceFilesFoundSearchingNodeModules.set(file.path, false);
                    if (!options.noResolve) {
                        processReferencedFiles(file, isDefaultLib);
                        processTypeReferenceDirectives(file);
                    }
                    if (!options.noLib) {
                        processLibReferenceDirectives(file);
                    }
                    modulesWithElidedImports.set(file.path, false);
                    processImportedModules(file);
                }
                // See if we need to reprocess the imports due to prior skipped imports
                else if (file && modulesWithElidedImports.get(file.path)) {
                    if (currentNodeModulesDepth < maxNodeModuleJsDepth) {
                        modulesWithElidedImports.set(file.path, false);
                        processImportedModules(file);
                    }
                }
                return file || undefined;
            }
            let redirectedPath: ts.Path | undefined;
            if (refFile && !useSourceOfProjectReferenceRedirect) {
                const redirectProject = getProjectReferenceRedirectProject(fileName);
                if (redirectProject) {
                    if (redirectProject.commandLine.options.outFile || redirectProject.commandLine.options.out) {
                        // Shouldnt create many to 1 mapping file in --out scenario
                        return undefined;
                    }
                    const redirect = getProjectReferenceOutputName(redirectProject, fileName);
                    fileName = redirect;
                    // Once we start redirecting to a file, we can potentially come back to it
                    // via a back-reference from another file in the .d.ts folder. If that happens we'll
                    // end up trying to add it to the program *again* because we were tracking it via its
                    // original (un-redirected) name. So we have to map both the original path and the redirected path
                    // to the source file we're about to find/create
                    redirectedPath = toPath(redirect);
                }
            }
            // We haven't looked for this file, do so now and cache result
            const file = host.getSourceFile(fileName, (options.target!), hostErrorMessage => fileProcessingDiagnostics.add(createRefFileDiagnostic(refFile, ts.Diagnostics.Cannot_read_file_0_Colon_1, fileName, hostErrorMessage)), shouldCreateNewSourceFile);
            if (packageId) {
                const packageIdKey = ts.packageIdToString(packageId);
                const fileFromPackageId = packageIdToSourceFile.get(packageIdKey);
                if (fileFromPackageId) {
                    // Some other SourceFile already exists with this package name and version.
                    // Instead of creating a duplicate, just redirect to the existing one.
                    const dupFile = createRedirectSourceFile(fileFromPackageId, file!, fileName, path, toPath(fileName), originalFileName); // TODO: GH#18217
                    redirectTargetsMap.add(fileFromPackageId.path, fileName);
                    addFileToFilesByName(dupFile, path, redirectedPath);
                    sourceFileToPackageName.set(path, packageId.name);
                    processingOtherFiles!.push(dupFile);
                    return dupFile;
                }
                else if (file) {
                    // This is the first source file to have this packageId.
                    packageIdToSourceFile.set(packageIdKey, file);
                    sourceFileToPackageName.set(path, packageId.name);
                }
            }
            addFileToFilesByName(file, path, redirectedPath);
            if (file) {
                sourceFilesFoundSearchingNodeModules.set(path, currentNodeModulesDepth > 0);
                file.fileName = fileName; // Ensure that source file has same name as what we were looking for
                file.path = path;
                file.resolvedPath = toPath(fileName);
                file.originalFileName = originalFileName;
                addFileToRefFileMap(fileName, file, refFile);
                if (host.useCaseSensitiveFileNames()) {
                    const pathLowerCase = path.toLowerCase();
                    // for case-sensitive file systems check if we've already seen some file with similar filename ignoring case
                    const existingFile = filesByNameIgnoreCase!.get(pathLowerCase);
                    if (existingFile) {
                        reportFileNamesDifferOnlyInCasingError(fileName, existingFile, refFile);
                    }
                    else {
                        filesByNameIgnoreCase!.set(pathLowerCase, file);
                    }
                }
                skipDefaultLib = skipDefaultLib || (file.hasNoDefaultLib && !ignoreNoDefaultLib);
                if (!options.noResolve) {
                    processReferencedFiles(file, isDefaultLib);
                    processTypeReferenceDirectives(file);
                }
                if (!options.noLib) {
                    processLibReferenceDirectives(file);
                }
                // always process imported modules to record module name resolutions
                processImportedModules(file);
                if (isDefaultLib) {
                    processingDefaultLibFiles!.push(file);
                }
                else {
                    processingOtherFiles!.push(file);
                }
            }
            return file;
        }
        function addFileToRefFileMap(referencedFileName: string, file: ts.SourceFile | undefined, refFile: RefFile | undefined) {
            if (refFile && file) {
                (refFileMap || (refFileMap = ts.createMultiMap())).add(file.path, {
                    referencedFileName,
                    kind: refFile.kind,
                    index: refFile.index,
                    file: refFile.file.path
                });
            }
        }
        function addFileToFilesByName(file: ts.SourceFile | undefined, path: ts.Path, redirectedPath: ts.Path | undefined) {
            if (redirectedPath) {
                filesByName.set(redirectedPath, file);
                filesByName.set(path, file || false);
            }
            else {
                filesByName.set(path, file);
            }
        }
        function getProjectReferenceRedirect(fileName: string): string | undefined {
            const referencedProject = getProjectReferenceRedirectProject(fileName);
            return referencedProject && getProjectReferenceOutputName(referencedProject, fileName);
        }
        function getProjectReferenceRedirectProject(fileName: string) {
            // Ignore dts
            if (!resolvedProjectReferences || !resolvedProjectReferences.length || ts.fileExtensionIs(fileName, ts.Extension.Dts)) {
                return undefined;
            }
            // If this file is produced by a referenced project, we need to rewrite it to
            // look in the output folder of the referenced project rather than the input
            return getResolvedProjectReferenceToRedirect(fileName);
        }
        function getProjectReferenceOutputName(referencedProject: ts.ResolvedProjectReference, fileName: string) {
            const out = referencedProject.commandLine.options.outFile || referencedProject.commandLine.options.out;
            return out ?
                ts.changeExtension(out, ts.Extension.Dts) :
                ts.getOutputDeclarationFileName(fileName, referencedProject.commandLine, !host.useCaseSensitiveFileNames());
        }
        /**
         * Get the referenced project if the file is input file from that reference project
         */
        function getResolvedProjectReferenceToRedirect(fileName: string) {
            if (mapFromFileToProjectReferenceRedirects === undefined) {
                mapFromFileToProjectReferenceRedirects = ts.createMap();
                forEachResolvedProjectReference((referencedProject, referenceProjectPath) => {
                    // not input file from the referenced project, ignore
                    if (referencedProject &&
                        toPath(options.configFilePath!) !== referenceProjectPath) {
                        referencedProject.commandLine.fileNames.forEach(f => mapFromFileToProjectReferenceRedirects!.set(toPath(f), referenceProjectPath));
                    }
                });
            }
            const referencedProjectPath = mapFromFileToProjectReferenceRedirects.get(toPath(fileName));
            return referencedProjectPath && getResolvedProjectReferenceByPath(referencedProjectPath);
        }
        function forEachResolvedProjectReference<T>(cb: (resolvedProjectReference: ts.ResolvedProjectReference | undefined, resolvedProjectReferencePath: ts.Path) => T | undefined): T | undefined {
            return forEachProjectReference(projectReferences, resolvedProjectReferences, (resolvedRef, index, parent) => {
                const ref = (parent ? parent.commandLine.projectReferences : projectReferences)![index];
                const resolvedRefPath = toPath(resolveProjectReferencePath(ref));
                return cb(resolvedRef, resolvedRefPath);
            });
        }
        function getSourceOfProjectReferenceRedirect(file: string) {
            if (!ts.isDeclarationFileName(file))
                return undefined;
            if (mapFromToProjectReferenceRedirectSource === undefined) {
                mapFromToProjectReferenceRedirectSource = ts.createMap();
                forEachResolvedProjectReference(resolvedRef => {
                    if (resolvedRef) {
                        const out = resolvedRef.commandLine.options.outFile || resolvedRef.commandLine.options.out;
                        if (out) {
                            // Dont know which source file it means so return true?
                            const outputDts = ts.changeExtension(out, ts.Extension.Dts);
                            mapFromToProjectReferenceRedirectSource!.set(toPath(outputDts), true);
                        }
                        else {
                            ts.forEach(resolvedRef.commandLine.fileNames, fileName => {
                                if (!ts.fileExtensionIs(fileName, ts.Extension.Dts)) {
                                    const outputDts = ts.getOutputDeclarationFileName(fileName, resolvedRef.commandLine, host.useCaseSensitiveFileNames());
                                    mapFromToProjectReferenceRedirectSource!.set(toPath(outputDts), fileName);
                                }
                            });
                        }
                    }
                });
            }
            return mapFromToProjectReferenceRedirectSource.get(toPath(file));
        }
        function isSourceOfProjectReferenceRedirect(fileName: string) {
            return useSourceOfProjectReferenceRedirect && !!getResolvedProjectReferenceToRedirect(fileName);
        }
        function forEachProjectReference<T>(projectReferences: readonly ts.ProjectReference[] | undefined, resolvedProjectReferences: readonly (ts.ResolvedProjectReference | undefined)[] | undefined, cbResolvedRef: (resolvedRef: ts.ResolvedProjectReference | undefined, index: number, parent: ts.ResolvedProjectReference | undefined) => T | undefined, cbRef?: (projectReferences: readonly ts.ProjectReference[] | undefined, parent: ts.ResolvedProjectReference | undefined) => T | undefined): T | undefined {
            let seenResolvedRefs: ts.ResolvedProjectReference[] | undefined;
            return worker(projectReferences, resolvedProjectReferences, /*parent*/ undefined, cbResolvedRef, cbRef);
            function worker(projectReferences: readonly ts.ProjectReference[] | undefined, resolvedProjectReferences: readonly (ts.ResolvedProjectReference | undefined)[] | undefined, parent: ts.ResolvedProjectReference | undefined, cbResolvedRef: (resolvedRef: ts.ResolvedProjectReference | undefined, index: number, parent: ts.ResolvedProjectReference | undefined) => T | undefined, cbRef?: (projectReferences: readonly ts.ProjectReference[] | undefined, parent: ts.ResolvedProjectReference | undefined) => T | undefined): T | undefined {
                // Visit project references first
                if (cbRef) {
                    const result = cbRef(projectReferences, parent);
                    if (result) {
                        return result;
                    }
                }
                return ts.forEach(resolvedProjectReferences, (resolvedRef, index) => {
                    if (ts.contains(seenResolvedRefs, resolvedRef)) {
                        // ignore recursives
                        return undefined;
                    }
                    const result = cbResolvedRef(resolvedRef, index, parent);
                    if (result) {
                        return result;
                    }
                    if (!resolvedRef)
                        return undefined;
                    (seenResolvedRefs || (seenResolvedRefs = [])).push(resolvedRef);
                    return worker(resolvedRef.commandLine.projectReferences, resolvedRef.references, resolvedRef, cbResolvedRef, cbRef);
                });
            }
        }
        function getResolvedProjectReferenceByPath(projectReferencePath: ts.Path): ts.ResolvedProjectReference | undefined {
            if (!projectReferenceRedirects) {
                return undefined;
            }
            return projectReferenceRedirects.get(projectReferencePath) || undefined;
        }
        function processReferencedFiles(file: ts.SourceFile, isDefaultLib: boolean) {
            ts.forEach(file.referencedFiles, (ref, index) => {
                const referencedFileName = resolveTripleslashReference(ref.fileName, file.originalFileName);
                processSourceFile(referencedFileName, isDefaultLib, 
                /*ignoreNoDefaultLib*/ false, 
                /*packageId*/ undefined, {
                    kind: ts.RefFileKind.ReferenceFile,
                    index,
                    file,
                    pos: ref.pos,
                    end: ref.end
                });
            });
        }
        function processTypeReferenceDirectives(file: ts.SourceFile) {
            // We lower-case all type references because npm automatically lowercases all packages. See GH#9824.
            const typeDirectives = ts.map(file.typeReferenceDirectives, ref => ref.fileName.toLocaleLowerCase());
            if (!typeDirectives) {
                return;
            }
            const resolutions = resolveTypeReferenceDirectiveNamesWorker(typeDirectives, file.originalFileName, getResolvedProjectReferenceToRedirect(file.originalFileName));
            for (let i = 0; i < typeDirectives.length; i++) {
                const ref = file.typeReferenceDirectives[i];
                const resolvedTypeReferenceDirective = resolutions[i];
                // store resolved type directive on the file
                const fileName = ref.fileName.toLocaleLowerCase();
                ts.setResolvedTypeReferenceDirective(file, fileName, resolvedTypeReferenceDirective);
                processTypeReferenceDirective(fileName, resolvedTypeReferenceDirective, {
                    kind: ts.RefFileKind.TypeReferenceDirective,
                    index: i,
                    file,
                    pos: ref.pos,
                    end: ref.end
                });
            }
        }
        function processTypeReferenceDirective(typeReferenceDirective: string, resolvedTypeReferenceDirective?: ts.ResolvedTypeReferenceDirective, refFile?: RefFile): void {
            // If we already found this library as a primary reference - nothing to do
            const previousResolution = resolvedTypeReferenceDirectives.get(typeReferenceDirective);
            if (previousResolution && previousResolution.primary) {
                return;
            }
            let saveResolution = true;
            if (resolvedTypeReferenceDirective) {
                if (resolvedTypeReferenceDirective.isExternalLibraryImport)
                    currentNodeModulesDepth++;
                if (resolvedTypeReferenceDirective.primary) {
                    // resolved from the primary path
                    processSourceFile(resolvedTypeReferenceDirective.resolvedFileName!, /*isDefaultLib*/ false, /*ignoreNoDefaultLib*/ false, resolvedTypeReferenceDirective.packageId, refFile); // TODO: GH#18217
                }
                else {
                    // If we already resolved to this file, it must have been a secondary reference. Check file contents
                    // for sameness and possibly issue an error
                    if (previousResolution) {
                        // Don't bother reading the file again if it's the same file.
                        if (resolvedTypeReferenceDirective.resolvedFileName !== previousResolution.resolvedFileName) {
                            const otherFileText = host.readFile(resolvedTypeReferenceDirective.resolvedFileName!);
                            const existingFile = getSourceFile(previousResolution.resolvedFileName!)!;
                            if (otherFileText !== existingFile.text) {
                                // Try looking up ref for original file
                                const refs = !refFile ? refFileMap && refFileMap.get(existingFile.path) : undefined;
                                const refToReportErrorOn = refs && ts.find(refs, ref => ref.referencedFileName === existingFile.fileName);
                                fileProcessingDiagnostics.add(refToReportErrorOn ?
                                    createFileDiagnosticAtReference(refToReportErrorOn, ts.Diagnostics.Conflicting_definitions_for_0_found_at_1_and_2_Consider_installing_a_specific_version_of_this_library_to_resolve_the_conflict, typeReferenceDirective, resolvedTypeReferenceDirective.resolvedFileName, previousResolution.resolvedFileName) :
                                    createRefFileDiagnostic(refFile, ts.Diagnostics.Conflicting_definitions_for_0_found_at_1_and_2_Consider_installing_a_specific_version_of_this_library_to_resolve_the_conflict, typeReferenceDirective, resolvedTypeReferenceDirective.resolvedFileName, previousResolution.resolvedFileName));
                            }
                        }
                        // don't overwrite previous resolution result
                        saveResolution = false;
                    }
                    else {
                        // First resolution of this library
                        processSourceFile(resolvedTypeReferenceDirective.resolvedFileName!, /*isDefaultLib*/ false, /*ignoreNoDefaultLib*/ false, resolvedTypeReferenceDirective.packageId, refFile);
                    }
                }
                if (resolvedTypeReferenceDirective.isExternalLibraryImport)
                    currentNodeModulesDepth--;
            }
            else {
                fileProcessingDiagnostics.add(createRefFileDiagnostic(refFile, ts.Diagnostics.Cannot_find_type_definition_file_for_0, typeReferenceDirective));
            }
            if (saveResolution) {
                resolvedTypeReferenceDirectives.set(typeReferenceDirective, resolvedTypeReferenceDirective);
            }
        }
        function processLibReferenceDirectives(file: ts.SourceFile) {
            ts.forEach(file.libReferenceDirectives, libReference => {
                const libName = libReference.fileName.toLocaleLowerCase();
                const libFileName = ts.libMap.get(libName);
                if (libFileName) {
                    // we ignore any 'no-default-lib' reference set on this file.
                    processRootFile(ts.combinePaths(defaultLibraryPath, libFileName), /*isDefaultLib*/ true, /*ignoreNoDefaultLib*/ true);
                }
                else {
                    const unqualifiedLibName = ts.removeSuffix(ts.removePrefix(libName, "lib."), ".d.ts");
                    const suggestion = ts.getSpellingSuggestion(unqualifiedLibName, ts.libs, ts.identity);
                    const message = suggestion ? ts.Diagnostics.Cannot_find_lib_definition_for_0_Did_you_mean_1 : ts.Diagnostics.Cannot_find_lib_definition_for_0;
                    fileProcessingDiagnostics.add(ts.createFileDiagnostic(file, libReference.pos, libReference.end - libReference.pos, message, libName, suggestion));
                }
            });
        }
        function createRefFileDiagnostic(refFile: RefFile | undefined, message: ts.DiagnosticMessage, ...args: any[]): ts.Diagnostic {
            if (!refFile) {
                return ts.createCompilerDiagnostic(message, ...args);
            }
            else {
                return ts.createFileDiagnostic(refFile.file, refFile.pos, refFile.end - refFile.pos, message, ...args);
            }
        }
        function getCanonicalFileName(fileName: string): string {
            return host.getCanonicalFileName(fileName);
        }
        function processImportedModules(file: ts.SourceFile) {
            collectExternalModuleReferences(file);
            if (file.imports.length || file.moduleAugmentations.length) {
                // Because global augmentation doesn't have string literal name, we can check for global augmentation as such.
                const moduleNames = getModuleNames(file);
                const resolutions = resolveModuleNamesReusingOldState(moduleNames, ts.getNormalizedAbsolutePath(file.originalFileName, currentDirectory), file);
                ts.Debug.assert(resolutions.length === moduleNames.length);
                for (let i = 0; i < moduleNames.length; i++) {
                    const resolution = resolutions[i];
                    ts.setResolvedModule(file, moduleNames[i], resolution);
                    if (!resolution) {
                        continue;
                    }
                    const isFromNodeModulesSearch = resolution.isExternalLibraryImport;
                    const isJsFile = !ts.resolutionExtensionIsTSOrJson(resolution.extension);
                    const isJsFileFromNodeModules = isFromNodeModulesSearch && isJsFile;
                    const resolvedFileName = resolution.resolvedFileName;
                    if (isFromNodeModulesSearch) {
                        currentNodeModulesDepth++;
                    }
                    // add file to program only if:
                    // - resolution was successful
                    // - noResolve is falsy
                    // - module name comes from the list of imports
                    // - it's not a top level JavaScript module that exceeded the search max
                    const elideImport = isJsFileFromNodeModules && currentNodeModulesDepth > maxNodeModuleJsDepth;
                    // Don't add the file if it has a bad extension (e.g. 'tsx' if we don't have '--allowJs')
                    // This may still end up being an untyped module -- the file won't be included but imports will be allowed.
                    const shouldAddFile = resolvedFileName
                        && !getResolutionDiagnostic(options, resolution)
                        && !options.noResolve
                        && i < file.imports.length
                        && !elideImport
                        && !(isJsFile && !options.allowJs)
                        && (ts.isInJSFile(file.imports[i]) || !(file.imports[i].flags & ts.NodeFlags.JSDoc));
                    if (elideImport) {
                        modulesWithElidedImports.set(file.path, true);
                    }
                    else if (shouldAddFile) {
                        const path = toPath(resolvedFileName);
                        const pos = ts.skipTrivia(file.text, file.imports[i].pos);
                        findSourceFile(resolvedFileName, path, 
                        /*isDefaultLib*/ false, 
                        /*ignoreNoDefaultLib*/ false, {
                            kind: ts.RefFileKind.Import,
                            index: i,
                            file,
                            pos,
                            end: file.imports[i].end
                        }, resolution.packageId);
                    }
                    if (isFromNodeModulesSearch) {
                        currentNodeModulesDepth--;
                    }
                }
            }
            else {
                // no imports - drop cached module resolutions
                file.resolvedModules = undefined;
            }
        }
        function computeCommonSourceDirectory(sourceFiles: ts.SourceFile[]): string {
            const fileNames = ts.mapDefined(sourceFiles, file => file.isDeclarationFile ? undefined : file.fileName);
            return computeCommonSourceDirectoryOfFilenames(fileNames, currentDirectory, getCanonicalFileName);
        }
        function checkSourceFilesBelongToPath(sourceFiles: readonly ts.SourceFile[], rootDirectory: string): boolean {
            let allFilesBelongToPath = true;
            const absoluteRootDirectoryPath = host.getCanonicalFileName(ts.getNormalizedAbsolutePath(rootDirectory, currentDirectory));
            let rootPaths: ts.Map<true> | undefined;
            for (const sourceFile of sourceFiles) {
                if (!sourceFile.isDeclarationFile) {
                    const absoluteSourceFilePath = host.getCanonicalFileName(ts.getNormalizedAbsolutePath(sourceFile.fileName, currentDirectory));
                    if (absoluteSourceFilePath.indexOf(absoluteRootDirectoryPath) !== 0) {
                        if (!rootPaths)
                            rootPaths = ts.arrayToSet(rootNames, toPath);
                        addProgramDiagnosticAtRefPath(sourceFile, rootPaths, ts.Diagnostics.File_0_is_not_under_rootDir_1_rootDir_is_expected_to_contain_all_source_files, sourceFile.fileName, rootDirectory);
                        allFilesBelongToPath = false;
                    }
                }
            }
            return allFilesBelongToPath;
        }
        function parseProjectReferenceConfigFile(ref: ts.ProjectReference): ts.ResolvedProjectReference | undefined {
            if (!projectReferenceRedirects) {
                projectReferenceRedirects = ts.createMap<ts.ResolvedProjectReference | false>();
            }
            // The actual filename (i.e. add "/tsconfig.json" if necessary)
            const refPath = resolveProjectReferencePath(ref);
            const sourceFilePath = toPath(refPath);
            const fromCache = projectReferenceRedirects.get(sourceFilePath);
            if (fromCache !== undefined) {
                return fromCache || undefined;
            }
            let commandLine: ts.ParsedCommandLine | undefined;
            let sourceFile: ts.JsonSourceFile | undefined;
            if (host.getParsedCommandLine) {
                commandLine = host.getParsedCommandLine(refPath);
                if (!commandLine) {
                    addFileToFilesByName(/*sourceFile*/ undefined, sourceFilePath, /*redirectedPath*/ undefined);
                    projectReferenceRedirects.set(sourceFilePath, false);
                    return undefined;
                }
                sourceFile = ts.Debug.assertDefined(commandLine.options.configFile);
                ts.Debug.assert(!sourceFile.path || sourceFile.path === sourceFilePath);
                addFileToFilesByName(sourceFile, sourceFilePath, /*redirectedPath*/ undefined);
            }
            else {
                // An absolute path pointing to the containing directory of the config file
                const basePath = ts.getNormalizedAbsolutePath(ts.getDirectoryPath(refPath), host.getCurrentDirectory());
                sourceFile = (host.getSourceFile(refPath, ts.ScriptTarget.JSON) as ts.JsonSourceFile | undefined);
                addFileToFilesByName(sourceFile, sourceFilePath, /*redirectedPath*/ undefined);
                if (sourceFile === undefined) {
                    projectReferenceRedirects.set(sourceFilePath, false);
                    return undefined;
                }
                commandLine = ts.parseJsonSourceFileConfigFileContent(sourceFile, configParsingHost, basePath, /*existingOptions*/ undefined, refPath);
            }
            sourceFile.fileName = refPath;
            sourceFile.path = sourceFilePath;
            sourceFile.resolvedPath = sourceFilePath;
            sourceFile.originalFileName = refPath;
            const resolvedRef: ts.ResolvedProjectReference = { commandLine, sourceFile };
            projectReferenceRedirects.set(sourceFilePath, resolvedRef);
            if (commandLine.projectReferences) {
                resolvedRef.references = commandLine.projectReferences.map(parseProjectReferenceConfigFile);
            }
            return resolvedRef;
        }
        function verifyCompilerOptions() {
            if (options.strictPropertyInitialization && !ts.getStrictOptionValue(options, "strictNullChecks")) {
                createDiagnosticForOptionName(ts.Diagnostics.Option_0_cannot_be_specified_without_specifying_option_1, "strictPropertyInitialization", "strictNullChecks");
            }
            if (options.isolatedModules) {
                if (options.out) {
                    createDiagnosticForOptionName(ts.Diagnostics.Option_0_cannot_be_specified_with_option_1, "out", "isolatedModules");
                }
                if (options.outFile) {
                    createDiagnosticForOptionName(ts.Diagnostics.Option_0_cannot_be_specified_with_option_1, "outFile", "isolatedModules");
                }
            }
            if (options.inlineSourceMap) {
                if (options.sourceMap) {
                    createDiagnosticForOptionName(ts.Diagnostics.Option_0_cannot_be_specified_with_option_1, "sourceMap", "inlineSourceMap");
                }
                if (options.mapRoot) {
                    createDiagnosticForOptionName(ts.Diagnostics.Option_0_cannot_be_specified_with_option_1, "mapRoot", "inlineSourceMap");
                }
            }
            if (options.paths && options.baseUrl === undefined) {
                createDiagnosticForOptionName(ts.Diagnostics.Option_paths_cannot_be_used_without_specifying_baseUrl_option, "paths");
            }
            if (options.composite) {
                if (options.declaration === false) {
                    createDiagnosticForOptionName(ts.Diagnostics.Composite_projects_may_not_disable_declaration_emit, "declaration");
                }
                if (options.incremental === false) {
                    createDiagnosticForOptionName(ts.Diagnostics.Composite_projects_may_not_disable_incremental_compilation, "declaration");
                }
            }
            if (options.tsBuildInfoFile) {
                if (!ts.isIncrementalCompilation(options)) {
                    createDiagnosticForOptionName(ts.Diagnostics.Option_0_cannot_be_specified_without_specifying_option_1_or_option_2, "tsBuildInfoFile", "incremental", "composite");
                }
            }
            else if (options.incremental && !options.outFile && !options.out && !options.configFilePath) {
                programDiagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_incremental_can_only_be_specified_using_tsconfig_emitting_to_single_file_or_when_option_tsBuildInfoFile_is_specified));
            }
            verifyProjectReferences();
            // List of collected files is complete; validate exhautiveness if this is a project with a file list
            if (options.composite) {
                const rootPaths = ts.arrayToSet(rootNames, toPath);
                for (const file of files) {
                    // Ignore file that is not emitted
                    if (ts.sourceFileMayBeEmitted(file, program) && !rootPaths.has(file.path)) {
                        addProgramDiagnosticAtRefPath(file, rootPaths, ts.Diagnostics.File_0_is_not_listed_within_the_file_list_of_project_1_Projects_must_list_all_files_or_use_an_include_pattern, file.fileName, options.configFilePath || "");
                    }
                }
            }
            if (options.paths) {
                for (const key in options.paths) {
                    if (!ts.hasProperty(options.paths, key)) {
                        continue;
                    }
                    if (!ts.hasZeroOrOneAsteriskCharacter(key)) {
                        createDiagnosticForOptionPaths(/*onKey*/ true, key, ts.Diagnostics.Pattern_0_can_have_at_most_one_Asterisk_character, key);
                    }
                    if (ts.isArray(options.paths[key])) {
                        const len = options.paths[key].length;
                        if (len === 0) {
                            createDiagnosticForOptionPaths(/*onKey*/ false, key, ts.Diagnostics.Substitutions_for_pattern_0_shouldn_t_be_an_empty_array, key);
                        }
                        for (let i = 0; i < len; i++) {
                            const subst = options.paths[key][i];
                            const typeOfSubst = typeof subst;
                            if (typeOfSubst === "string") {
                                if (!ts.hasZeroOrOneAsteriskCharacter(subst)) {
                                    createDiagnosticForOptionPathKeyValue(key, i, ts.Diagnostics.Substitution_0_in_pattern_1_can_have_at_most_one_Asterisk_character, subst, key);
                                }
                            }
                            else {
                                createDiagnosticForOptionPathKeyValue(key, i, ts.Diagnostics.Substitution_0_for_pattern_1_has_incorrect_type_expected_string_got_2, subst, key, typeOfSubst);
                            }
                        }
                    }
                    else {
                        createDiagnosticForOptionPaths(/*onKey*/ false, key, ts.Diagnostics.Substitutions_for_pattern_0_should_be_an_array, key);
                    }
                }
            }
            if (!options.sourceMap && !options.inlineSourceMap) {
                if (options.inlineSources) {
                    createDiagnosticForOptionName(ts.Diagnostics.Option_0_can_only_be_used_when_either_option_inlineSourceMap_or_option_sourceMap_is_provided, "inlineSources");
                }
                if (options.sourceRoot) {
                    createDiagnosticForOptionName(ts.Diagnostics.Option_0_can_only_be_used_when_either_option_inlineSourceMap_or_option_sourceMap_is_provided, "sourceRoot");
                }
            }
            if (options.out && options.outFile) {
                createDiagnosticForOptionName(ts.Diagnostics.Option_0_cannot_be_specified_with_option_1, "out", "outFile");
            }
            if (options.mapRoot && !(options.sourceMap || options.declarationMap)) {
                // Error to specify --mapRoot without --sourcemap
                createDiagnosticForOptionName(ts.Diagnostics.Option_0_cannot_be_specified_without_specifying_option_1_or_option_2, "mapRoot", "sourceMap", "declarationMap");
            }
            if (options.declarationDir) {
                if (!ts.getEmitDeclarations(options)) {
                    createDiagnosticForOptionName(ts.Diagnostics.Option_0_cannot_be_specified_without_specifying_option_1_or_option_2, "declarationDir", "declaration", "composite");
                }
                if (options.out || options.outFile) {
                    createDiagnosticForOptionName(ts.Diagnostics.Option_0_cannot_be_specified_with_option_1, "declarationDir", options.out ? "out" : "outFile");
                }
            }
            if (options.declarationMap && !ts.getEmitDeclarations(options)) {
                createDiagnosticForOptionName(ts.Diagnostics.Option_0_cannot_be_specified_without_specifying_option_1_or_option_2, "declarationMap", "declaration", "composite");
            }
            if (options.lib && options.noLib) {
                createDiagnosticForOptionName(ts.Diagnostics.Option_0_cannot_be_specified_with_option_1, "lib", "noLib");
            }
            if (options.noImplicitUseStrict && ts.getStrictOptionValue(options, "alwaysStrict")) {
                createDiagnosticForOptionName(ts.Diagnostics.Option_0_cannot_be_specified_with_option_1, "noImplicitUseStrict", "alwaysStrict");
            }
            const languageVersion = options.target || ts.ScriptTarget.ES3;
            const outFile = options.outFile || options.out;
            const firstNonAmbientExternalModuleSourceFile = ts.find(files, f => ts.isExternalModule(f) && !f.isDeclarationFile);
            if (options.isolatedModules) {
                if (options.module === ts.ModuleKind.None && languageVersion < ts.ScriptTarget.ES2015) {
                    createDiagnosticForOptionName(ts.Diagnostics.Option_isolatedModules_can_only_be_used_when_either_option_module_is_provided_or_option_target_is_ES2015_or_higher, "isolatedModules", "target");
                }
                const firstNonExternalModuleSourceFile = ts.find(files, f => !ts.isExternalModule(f) && !ts.isSourceFileJS(f) && !f.isDeclarationFile && f.scriptKind !== ts.ScriptKind.JSON);
                if (firstNonExternalModuleSourceFile) {
                    const span = ts.getErrorSpanForNode(firstNonExternalModuleSourceFile, firstNonExternalModuleSourceFile);
                    programDiagnostics.add(ts.createFileDiagnostic(firstNonExternalModuleSourceFile, span.start, span.length, ts.Diagnostics.All_files_must_be_modules_when_the_isolatedModules_flag_is_provided));
                }
            }
            else if (firstNonAmbientExternalModuleSourceFile && languageVersion < ts.ScriptTarget.ES2015 && options.module === ts.ModuleKind.None) {
                // We cannot use createDiagnosticFromNode because nodes do not have parents yet
                const span = ts.getErrorSpanForNode(firstNonAmbientExternalModuleSourceFile, (firstNonAmbientExternalModuleSourceFile.externalModuleIndicator!));
                programDiagnostics.add(ts.createFileDiagnostic(firstNonAmbientExternalModuleSourceFile, span.start, span.length, ts.Diagnostics.Cannot_use_imports_exports_or_module_augmentations_when_module_is_none));
            }
            // Cannot specify module gen that isn't amd or system with --out
            if (outFile && !options.emitDeclarationOnly) {
                if (options.module && !(options.module === ts.ModuleKind.AMD || options.module === ts.ModuleKind.System)) {
                    createDiagnosticForOptionName(ts.Diagnostics.Only_amd_and_system_modules_are_supported_alongside_0, options.out ? "out" : "outFile", "module");
                }
                else if (options.module === undefined && firstNonAmbientExternalModuleSourceFile) {
                    const span = ts.getErrorSpanForNode(firstNonAmbientExternalModuleSourceFile, (firstNonAmbientExternalModuleSourceFile.externalModuleIndicator!));
                    programDiagnostics.add(ts.createFileDiagnostic(firstNonAmbientExternalModuleSourceFile, span.start, span.length, ts.Diagnostics.Cannot_compile_modules_using_option_0_unless_the_module_flag_is_amd_or_system, options.out ? "out" : "outFile"));
                }
            }
            if (options.resolveJsonModule) {
                if (ts.getEmitModuleResolutionKind(options) !== ts.ModuleResolutionKind.NodeJs) {
                    createDiagnosticForOptionName(ts.Diagnostics.Option_resolveJsonModule_cannot_be_specified_without_node_module_resolution_strategy, "resolveJsonModule");
                }
                // Any emit other than common js, amd, es2015 or esnext is error
                else if (!ts.hasJsonModuleEmitEnabled(options)) {
                    createDiagnosticForOptionName(ts.Diagnostics.Option_resolveJsonModule_can_only_be_specified_when_module_code_generation_is_commonjs_amd_es2015_or_esNext, "resolveJsonModule", "module");
                }
            }
            // there has to be common source directory if user specified --outdir || --sourceRoot
            // if user specified --mapRoot, there needs to be common source directory if there would be multiple files being emitted
            if (options.outDir || // there is --outDir specified
                options.sourceRoot || // there is --sourceRoot specified
                options.mapRoot) { // there is --mapRoot specified
                // Precalculate and cache the common source directory
                const dir = getCommonSourceDirectory();
                // If we failed to find a good common directory, but outDir is specified and at least one of our files is on a windows drive/URL/other resource, add a failure
                if (options.outDir && dir === "" && files.some(file => ts.getRootLength(file.fileName) > 1)) {
                    createDiagnosticForOptionName(ts.Diagnostics.Cannot_find_the_common_subdirectory_path_for_the_input_files, "outDir");
                }
            }
            if (options.useDefineForClassFields && languageVersion === ts.ScriptTarget.ES3) {
                createDiagnosticForOptionName(ts.Diagnostics.Option_0_cannot_be_specified_when_option_target_is_ES3, "useDefineForClassFields");
            }
            if (options.checkJs && !options.allowJs) {
                programDiagnostics.add(ts.createCompilerDiagnostic(ts.Diagnostics.Option_0_cannot_be_specified_without_specifying_option_1, "checkJs", "allowJs"));
            }
            if (options.emitDeclarationOnly) {
                if (!ts.getEmitDeclarations(options)) {
                    createDiagnosticForOptionName(ts.Diagnostics.Option_0_cannot_be_specified_without_specifying_option_1_or_option_2, "emitDeclarationOnly", "declaration", "composite");
                }
                if (options.noEmit) {
                    createDiagnosticForOptionName(ts.Diagnostics.Option_0_cannot_be_specified_with_option_1, "emitDeclarationOnly", "noEmit");
                }
            }
            if (options.emitDecoratorMetadata &&
                !options.experimentalDecorators) {
                createDiagnosticForOptionName(ts.Diagnostics.Option_0_cannot_be_specified_without_specifying_option_1, "emitDecoratorMetadata", "experimentalDecorators");
            }
            if (options.jsxFactory) {
                if (options.reactNamespace) {
                    createDiagnosticForOptionName(ts.Diagnostics.Option_0_cannot_be_specified_with_option_1, "reactNamespace", "jsxFactory");
                }
                if (!ts.parseIsolatedEntityName(options.jsxFactory, languageVersion)) {
                    createOptionValueDiagnostic("jsxFactory", ts.Diagnostics.Invalid_value_for_jsxFactory_0_is_not_a_valid_identifier_or_qualified_name, options.jsxFactory);
                }
            }
            else if (options.reactNamespace && !ts.isIdentifierText(options.reactNamespace, languageVersion)) {
                createOptionValueDiagnostic("reactNamespace", ts.Diagnostics.Invalid_value_for_reactNamespace_0_is_not_a_valid_identifier, options.reactNamespace);
            }
            // If the emit is enabled make sure that every output file is unique and not overwriting any of the input files
            if (!options.noEmit && !options.suppressOutputPathCheck) {
                const emitHost = getEmitHost();
                const emitFilesSeen = ts.createMap<true>();
                ts.forEachEmittedFile(emitHost, (emitFileNames) => {
                    if (!options.emitDeclarationOnly) {
                        verifyEmitFilePath(emitFileNames.jsFilePath, emitFilesSeen);
                    }
                    verifyEmitFilePath(emitFileNames.declarationFilePath, emitFilesSeen);
                });
            }
            // Verify that all the emit files are unique and don't overwrite input files
            function verifyEmitFilePath(emitFileName: string | undefined, emitFilesSeen: ts.Map<true>) {
                if (emitFileName) {
                    const emitFilePath = toPath(emitFileName);
                    // Report error if the output overwrites input file
                    if (filesByName.has(emitFilePath)) {
                        let chain: ts.DiagnosticMessageChain | undefined;
                        if (!options.configFilePath) {
                            // The program is from either an inferred project or an external project
                            chain = ts.chainDiagnosticMessages(/*details*/ undefined, ts.Diagnostics.Adding_a_tsconfig_json_file_will_help_organize_projects_that_contain_both_TypeScript_and_JavaScript_files_Learn_more_at_https_Colon_Slash_Slashaka_ms_Slashtsconfig);
                        }
                        chain = ts.chainDiagnosticMessages(chain, ts.Diagnostics.Cannot_write_file_0_because_it_would_overwrite_input_file, emitFileName);
                        blockEmittingOfFile(emitFileName, ts.createCompilerDiagnosticFromMessageChain(chain));
                    }
                    const emitFileKey = !host.useCaseSensitiveFileNames() ? emitFilePath.toLocaleLowerCase() : emitFilePath;
                    // Report error if multiple files write into same file
                    if (emitFilesSeen.has(emitFileKey)) {
                        // Already seen the same emit file - report error
                        blockEmittingOfFile(emitFileName, ts.createCompilerDiagnostic(ts.Diagnostics.Cannot_write_file_0_because_it_would_be_overwritten_by_multiple_input_files, emitFileName));
                    }
                    else {
                        emitFilesSeen.set(emitFileKey, true);
                    }
                }
            }
        }
        function createFileDiagnosticAtReference(refPathToReportErrorOn: ts.RefFile, message: ts.DiagnosticMessage, ...args: (string | number | undefined)[]) {
            const refFile = ts.Debug.assertDefined(getSourceFileByPath(refPathToReportErrorOn.file));
            const { kind, index } = refPathToReportErrorOn;
            let pos: number, end: number;
            switch (kind) {
                case ts.RefFileKind.Import:
                    pos = ts.skipTrivia(refFile.text, refFile.imports[index].pos);
                    end = refFile.imports[index].end;
                    break;
                case ts.RefFileKind.ReferenceFile:
                    ({ pos, end } = refFile.referencedFiles[index]);
                    break;
                case ts.RefFileKind.TypeReferenceDirective:
                    ({ pos, end } = refFile.typeReferenceDirectives[index]);
                    break;
                default:
                    return ts.Debug.assertNever(kind);
            }
            return ts.createFileDiagnostic(refFile, pos, end - pos, message, ...args);
        }
        function addProgramDiagnosticAtRefPath(file: ts.SourceFile, rootPaths: ts.Map<true>, message: ts.DiagnosticMessage, ...args: (string | number | undefined)[]) {
            const refPaths = refFileMap && refFileMap.get(file.path);
            const refPathToReportErrorOn = ts.forEach(refPaths, refPath => rootPaths.has(refPath.file) ? refPath : undefined) ||
                ts.elementAt(refPaths, 0);
            programDiagnostics.add(refPathToReportErrorOn ?
                createFileDiagnosticAtReference(refPathToReportErrorOn, message, ...args) :
                ts.createCompilerDiagnostic(message, ...args));
        }
        function verifyProjectReferences() {
            const buildInfoPath = !options.noEmit && !options.suppressOutputPathCheck ? ts.getTsBuildInfoEmitOutputFilePath(options) : undefined;
            forEachProjectReference(projectReferences, resolvedProjectReferences, (resolvedRef, index, parent) => {
                const ref = (parent ? parent.commandLine.projectReferences : projectReferences)![index];
                const parentFile = parent && (parent.sourceFile as ts.JsonSourceFile);
                if (!resolvedRef) {
                    createDiagnosticForReference(parentFile, index, ts.Diagnostics.File_0_not_found, ref.path);
                    return;
                }
                const options = resolvedRef.commandLine.options;
                if (!options.composite) {
                    // ok to not have composite if the current program is container only
                    const inputs = parent ? parent.commandLine.fileNames : rootNames;
                    if (inputs.length) {
                        createDiagnosticForReference(parentFile, index, ts.Diagnostics.Referenced_project_0_must_have_setting_composite_Colon_true, ref.path);
                    }
                }
                if (ref.prepend) {
                    const out = options.outFile || options.out;
                    if (out) {
                        if (!host.fileExists(out)) {
                            createDiagnosticForReference(parentFile, index, ts.Diagnostics.Output_file_0_from_project_1_does_not_exist, out, ref.path);
                        }
                    }
                    else {
                        createDiagnosticForReference(parentFile, index, ts.Diagnostics.Cannot_prepend_project_0_because_it_does_not_have_outFile_set, ref.path);
                    }
                }
                if (!parent && buildInfoPath && buildInfoPath === ts.getTsBuildInfoEmitOutputFilePath(options)) {
                    createDiagnosticForReference(parentFile, index, ts.Diagnostics.Cannot_write_file_0_because_it_will_overwrite_tsbuildinfo_file_generated_by_referenced_project_1, buildInfoPath, ref.path);
                    hasEmitBlockingDiagnostics.set(toPath(buildInfoPath), true);
                }
            });
        }
        function createDiagnosticForOptionPathKeyValue(key: string, valueIndex: number, message: ts.DiagnosticMessage, arg0: string | number, arg1: string | number, arg2?: string | number) {
            let needCompilerDiagnostic = true;
            const pathsSyntax = getOptionPathsSyntax();
            for (const pathProp of pathsSyntax) {
                if (ts.isObjectLiteralExpression(pathProp.initializer)) {
                    for (const keyProps of ts.getPropertyAssignment(pathProp.initializer, key)) {
                        const initializer = keyProps.initializer;
                        if (ts.isArrayLiteralExpression(initializer) && initializer.elements.length > valueIndex) {
                            programDiagnostics.add(ts.createDiagnosticForNodeInSourceFile((options.configFile!), initializer.elements[valueIndex], message, arg0, arg1, arg2));
                            needCompilerDiagnostic = false;
                        }
                    }
                }
            }
            if (needCompilerDiagnostic) {
                programDiagnostics.add(ts.createCompilerDiagnostic(message, arg0, arg1, arg2));
            }
        }
        function createDiagnosticForOptionPaths(onKey: boolean, key: string, message: ts.DiagnosticMessage, arg0: string | number) {
            let needCompilerDiagnostic = true;
            const pathsSyntax = getOptionPathsSyntax();
            for (const pathProp of pathsSyntax) {
                if (ts.isObjectLiteralExpression(pathProp.initializer) &&
                    createOptionDiagnosticInObjectLiteralSyntax(pathProp.initializer, onKey, key, /*key2*/ undefined, message, arg0)) {
                    needCompilerDiagnostic = false;
                }
            }
            if (needCompilerDiagnostic) {
                programDiagnostics.add(ts.createCompilerDiagnostic(message, arg0));
            }
        }
        function getOptionsSyntaxByName(name: string): object | undefined {
            const compilerOptionsObjectLiteralSyntax = getCompilerOptionsObjectLiteralSyntax();
            if (compilerOptionsObjectLiteralSyntax) {
                return ts.getPropertyAssignment(compilerOptionsObjectLiteralSyntax, name);
            }
            return undefined;
        }
        function getOptionPathsSyntax(): ts.PropertyAssignment[] {
            return (getOptionsSyntaxByName("paths") as ts.PropertyAssignment[]) || ts.emptyArray;
        }
        function createDiagnosticForOptionName(message: ts.DiagnosticMessage, option1: string, option2?: string, option3?: string) {
            createDiagnosticForOption(/*onKey*/ true, option1, option2, message, option1, option2, option3);
        }
        function createOptionValueDiagnostic(option1: string, message: ts.DiagnosticMessage, arg0: string) {
            createDiagnosticForOption(/*onKey*/ false, option1, /*option2*/ undefined, message, arg0);
        }
        function createDiagnosticForReference(sourceFile: ts.JsonSourceFile | undefined, index: number, message: ts.DiagnosticMessage, arg0?: string | number, arg1?: string | number) {
            const referencesSyntax = ts.firstDefined(ts.getTsConfigPropArray(sourceFile || options.configFile, "references"), property => ts.isArrayLiteralExpression(property.initializer) ? property.initializer : undefined);
            if (referencesSyntax && referencesSyntax.elements.length > index) {
                programDiagnostics.add(ts.createDiagnosticForNodeInSourceFile(sourceFile || options.configFile!, referencesSyntax.elements[index], message, arg0, arg1));
            }
            else {
                programDiagnostics.add(ts.createCompilerDiagnostic(message, arg0, arg1));
            }
        }
        function createDiagnosticForOption(onKey: boolean, option1: string, option2: string | undefined, message: ts.DiagnosticMessage, arg0: string | number, arg1?: string | number, arg2?: string | number) {
            const compilerOptionsObjectLiteralSyntax = getCompilerOptionsObjectLiteralSyntax();
            const needCompilerDiagnostic = !compilerOptionsObjectLiteralSyntax ||
                !createOptionDiagnosticInObjectLiteralSyntax(compilerOptionsObjectLiteralSyntax, onKey, option1, option2, message, arg0, arg1, arg2);
            if (needCompilerDiagnostic) {
                programDiagnostics.add(ts.createCompilerDiagnostic(message, arg0, arg1, arg2));
            }
        }
        function getCompilerOptionsObjectLiteralSyntax() {
            if (_compilerOptionsObjectLiteralSyntax === undefined) {
                _compilerOptionsObjectLiteralSyntax = null; // eslint-disable-line no-null/no-null
                const jsonObjectLiteral = ts.getTsConfigObjectLiteralExpression(options.configFile);
                if (jsonObjectLiteral) {
                    for (const prop of ts.getPropertyAssignment(jsonObjectLiteral, "compilerOptions")) {
                        if (ts.isObjectLiteralExpression(prop.initializer)) {
                            _compilerOptionsObjectLiteralSyntax = prop.initializer;
                            break;
                        }
                    }
                }
            }
            return _compilerOptionsObjectLiteralSyntax;
        }
        function createOptionDiagnosticInObjectLiteralSyntax(objectLiteral: ts.ObjectLiteralExpression, onKey: boolean, key1: string, key2: string | undefined, message: ts.DiagnosticMessage, arg0: string | number, arg1?: string | number, arg2?: string | number): boolean {
            const props = ts.getPropertyAssignment(objectLiteral, key1, key2);
            for (const prop of props) {
                programDiagnostics.add(ts.createDiagnosticForNodeInSourceFile((options.configFile!), onKey ? prop.name : prop.initializer, message, arg0, arg1, arg2));
            }
            return !!props.length;
        }
        function blockEmittingOfFile(emitFileName: string, diag: ts.Diagnostic) {
            hasEmitBlockingDiagnostics.set(toPath(emitFileName), true);
            programDiagnostics.add(diag);
        }
        function isEmittedFile(file: string): boolean {
            if (options.noEmit) {
                return false;
            }
            // If this is source file, its not emitted file
            const filePath = toPath(file);
            if (getSourceFileByPath(filePath)) {
                return false;
            }
            // If options have --outFile or --out just check that
            const out = options.outFile || options.out;
            if (out) {
                return isSameFile(filePath, out) || isSameFile(filePath, ts.removeFileExtension(out) + ts.Extension.Dts);
            }
            // If declarationDir is specified, return if its a file in that directory
            if (options.declarationDir && ts.containsPath(options.declarationDir, filePath, currentDirectory, !host.useCaseSensitiveFileNames())) {
                return true;
            }
            // If --outDir, check if file is in that directory
            if (options.outDir) {
                return ts.containsPath(options.outDir, filePath, currentDirectory, !host.useCaseSensitiveFileNames());
            }
            if (ts.fileExtensionIsOneOf(filePath, ts.supportedJSExtensions) || ts.fileExtensionIs(filePath, ts.Extension.Dts)) {
                // Otherwise just check if sourceFile with the name exists
                const filePathWithoutExtension = ts.removeFileExtension(filePath);
                return !!getSourceFileByPath(((filePathWithoutExtension + ts.Extension.Ts) as ts.Path)) ||
                    !!getSourceFileByPath(((filePathWithoutExtension + ts.Extension.Tsx) as ts.Path));
            }
            return false;
        }
        function isSameFile(file1: string, file2: string) {
            return ts.comparePaths(file1, file2, currentDirectory, !host.useCaseSensitiveFileNames()) === ts.Comparison.EqualTo;
        }
        function getProbableSymlinks(): ts.ReadonlyMap<string> {
            if (host.getSymlinks) {
                return host.getSymlinks();
            }
            return symlinks || (symlinks = ts.discoverProbableSymlinks(files, getCanonicalFileName, host.getCurrentDirectory()));
        }
    }
    /*@internal*/
    export function handleNoEmitOptions(program: ts.ProgramToEmitFilesAndReportErrors, sourceFile: ts.SourceFile | undefined, cancellationToken: ts.CancellationToken | undefined): ts.EmitResult | undefined {
        const options = program.getCompilerOptions();
        if (options.noEmit) {
            return { diagnostics: ts.emptyArray, sourceMaps: undefined, emittedFiles: undefined, emitSkipped: true };
        }
        // If the noEmitOnError flag is set, then check if we have any errors so far.  If so,
        // immediately bail out.  Note that we pass 'undefined' for 'sourceFile' so that we
        // get any preEmit diagnostics, not just the ones
        if (!options.noEmitOnError)
            return undefined;
        let diagnostics: readonly ts.Diagnostic[] = [
            ...program.getOptionsDiagnostics(cancellationToken),
            ...program.getSyntacticDiagnostics(sourceFile, cancellationToken),
            ...program.getGlobalDiagnostics(cancellationToken),
            ...program.getSemanticDiagnostics(sourceFile, cancellationToken)
        ];
        if (diagnostics.length === 0 && ts.getEmitDeclarations(program.getCompilerOptions())) {
            diagnostics = program.getDeclarationDiagnostics(/*sourceFile*/ undefined, cancellationToken);
        }
        return diagnostics.length > 0 ?
            { diagnostics, sourceMaps: undefined, emittedFiles: undefined, emitSkipped: true } :
            undefined;
    }
    /*@internal*/
    interface CompilerHostLike {
        useCaseSensitiveFileNames(): boolean;
        getCurrentDirectory(): string;
        fileExists(fileName: string): boolean;
        readFile(fileName: string): string | undefined;
        readDirectory?(rootDir: string, extensions: readonly string[], excludes: readonly string[] | undefined, includes: readonly string[], depth?: number): string[];
        trace?(s: string): void;
        onUnRecoverableConfigFileDiagnostic?: ts.DiagnosticReporter;
    }
    /* @internal */
    export function parseConfigHostFromCompilerHostLike(host: CompilerHostLike, directoryStructureHost: ts.DirectoryStructureHost = host): ts.ParseConfigFileHost {
        return {
            fileExists: f => directoryStructureHost.fileExists(f),
            readDirectory(root, extensions, excludes, includes, depth) {
                ts.Debug.assertDefined(directoryStructureHost.readDirectory, "'CompilerHost.readDirectory' must be implemented to correctly process 'projectReferences'");
                return directoryStructureHost.readDirectory!(root, extensions, excludes, includes, depth);
            },
            readFile: f => directoryStructureHost.readFile(f),
            useCaseSensitiveFileNames: host.useCaseSensitiveFileNames(),
            getCurrentDirectory: () => host.getCurrentDirectory(),
            onUnRecoverableConfigFileDiagnostic: host.onUnRecoverableConfigFileDiagnostic || ts.returnUndefined,
            trace: host.trace ? (s) => host.trace!(s) : undefined
        };
    }
    // For backward compatibility
    /** @deprecated */ export interface ResolveProjectReferencePathHost {
        fileExists(fileName: string): boolean;
    }
    /* @internal */
    export function createPrependNodes(projectReferences: readonly ts.ProjectReference[] | undefined, getCommandLine: (ref: ts.ProjectReference, index: number) => ts.ParsedCommandLine | undefined, readFile: (path: string) => string | undefined) {
        if (!projectReferences)
            return ts.emptyArray;
        let nodes: ts.InputFiles[] | undefined;
        for (let i = 0; i < projectReferences.length; i++) {
            const ref = projectReferences[i];
            const resolvedRefOpts = getCommandLine(ref, i);
            if (ref.prepend && resolvedRefOpts && resolvedRefOpts.options) {
                const out = resolvedRefOpts.options.outFile || resolvedRefOpts.options.out;
                // Upstream project didn't have outFile set -- skip (error will have been issued earlier)
                if (!out)
                    continue;
                const { jsFilePath, sourceMapFilePath, declarationFilePath, declarationMapPath, buildInfoPath } = ts.getOutputPathsForBundle(resolvedRefOpts.options, /*forceDtsPaths*/ true);
                const node = ts.createInputFiles(readFile, (jsFilePath!), sourceMapFilePath, (declarationFilePath!), declarationMapPath, buildInfoPath);
                (nodes || (nodes = [])).push(node);
            }
        }
        return nodes || ts.emptyArray;
    }
    /**
     * Returns the target config filename of a project reference.
     * Note: The file might not exist.
     */
    export function resolveProjectReferencePath(ref: ts.ProjectReference): ts.ResolvedConfigFileName;
    /** @deprecated */ export function resolveProjectReferencePath(host: ResolveProjectReferencePathHost, ref: ts.ProjectReference): ts.ResolvedConfigFileName;
    export function resolveProjectReferencePath(hostOrRef: ResolveProjectReferencePathHost | ts.ProjectReference, ref?: ts.ProjectReference): ts.ResolvedConfigFileName {
        const passedInRef = ref ? ref : hostOrRef as ts.ProjectReference;
        return ts.resolveConfigFileProjectName(passedInRef.path);
    }
    /* @internal */
    /**
     * Returns a DiagnosticMessage if we won't include a resolved module due to its extension.
     * The DiagnosticMessage's parameters are the imported module name, and the filename it resolved to.
     * This returns a diagnostic even if the module will be an untyped module.
     */
    export function getResolutionDiagnostic(options: ts.CompilerOptions, { extension }: ts.ResolvedModuleFull): ts.DiagnosticMessage | undefined {
        switch (extension) {
            case ts.Extension.Ts:
            case ts.Extension.Dts:
                // These are always allowed.
                return undefined;
            case ts.Extension.Tsx:
                return needJsx();
            case ts.Extension.Jsx:
                return needJsx() || needAllowJs();
            case ts.Extension.Js:
                return needAllowJs();
            case ts.Extension.Json:
                return needResolveJsonModule();
        }
        function needJsx() {
            return options.jsx ? undefined : ts.Diagnostics.Module_0_was_resolved_to_1_but_jsx_is_not_set;
        }
        function needAllowJs() {
            return options.allowJs || !ts.getStrictOptionValue(options, "noImplicitAny") ? undefined : ts.Diagnostics.Could_not_find_a_declaration_file_for_module_0_1_implicitly_has_an_any_type;
        }
        function needResolveJsonModule() {
            return options.resolveJsonModule ? undefined : ts.Diagnostics.Module_0_was_resolved_to_1_but_resolveJsonModule_is_not_used;
        }
    }
    function getModuleNames({ imports, moduleAugmentations }: ts.SourceFile): string[] {
        const res = imports.map(i => i.text);
        for (const aug of moduleAugmentations) {
            if (aug.kind === ts.SyntaxKind.StringLiteral) {
                res.push(aug.text);
            }
            // Do nothing if it's an Identifier; we don't need to do module resolution for `declare global`.
        }
        return res;
    }
}
