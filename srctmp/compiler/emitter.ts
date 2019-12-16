import * as ts from "./ts";
const brackets = createBracketsMap();
const syntheticParent: ts.TextRange = { pos: -1, end: -1 };
/*@internal*/
export function isBuildInfoFile(file: string) {
    return ts.fileExtensionIs(file, ts.Extension.TsBuildInfo);
}
/*@internal*/
/**
 * Iterates over the source files that are expected to have an emit output.
 *
 * @param host An EmitHost.
 * @param action The action to execute.
 * @param sourceFilesOrTargetSourceFile
 *   If an array, the full list of source files to emit.
 *   Else, calls `getSourceFilesToEmit` with the (optional) target source file to determine the list of source files to emit.
 */
export function forEachEmittedFile<T>(host: ts.EmitHost, action: (emitFileNames: ts.EmitFileNames, sourceFileOrBundle: ts.SourceFile | ts.Bundle | undefined) => T, sourceFilesOrTargetSourceFile?: readonly ts.SourceFile[] | ts.SourceFile, forceDtsEmit = false, onlyBuildInfo?: boolean, includeBuildInfo?: boolean) {
    const sourceFiles = ts.isArray(sourceFilesOrTargetSourceFile) ? sourceFilesOrTargetSourceFile : ts.getSourceFilesToEmit(host, sourceFilesOrTargetSourceFile, forceDtsEmit);
    const options = host.getCompilerOptions();
    if (options.outFile || options.out) {
        const prepends = host.getPrependNodes();
        if (sourceFiles.length || prepends.length) {
            const bundle = ts.createBundle(sourceFiles, prepends);
            const result = action(getOutputPathsFor(bundle, host, forceDtsEmit), bundle);
            if (result) {
                return result;
            }
        }
    }
    else {
        if (!onlyBuildInfo) {
            for (const sourceFile of sourceFiles) {
                const result = action(getOutputPathsFor(sourceFile, host, forceDtsEmit), sourceFile);
                if (result) {
                    return result;
                }
            }
        }
        if (includeBuildInfo) {
            const buildInfoPath = getTsBuildInfoEmitOutputFilePath(host.getCompilerOptions());
            if (buildInfoPath)
                return action({ buildInfoPath }, /*sourceFileOrBundle*/ undefined);
        }
    }
}
export function getTsBuildInfoEmitOutputFilePath(options: ts.CompilerOptions) {
    const configFile = options.configFilePath;
    if (!ts.isIncrementalCompilation(options))
        return undefined;
    if (options.tsBuildInfoFile)
        return options.tsBuildInfoFile;
    const outPath = options.outFile || options.out;
    let buildInfoExtensionLess: string;
    if (outPath) {
        buildInfoExtensionLess = ts.removeFileExtension(outPath);
    }
    else {
        if (!configFile)
            return undefined;
        const configFileExtensionLess = ts.removeFileExtension(configFile);
        buildInfoExtensionLess = options.outDir ?
            options.rootDir ?
                ts.resolvePath(options.outDir, ts.getRelativePathFromDirectory(options.rootDir, configFileExtensionLess, /*ignoreCase*/ true)) :
                ts.combinePaths(options.outDir, ts.getBaseFileName(configFileExtensionLess)) :
            configFileExtensionLess;
    }
    return buildInfoExtensionLess + ts.Extension.TsBuildInfo;
}
/*@internal*/
export function getOutputPathsForBundle(options: ts.CompilerOptions, forceDtsPaths: boolean): ts.EmitFileNames {
    const outPath = options.outFile || options.out!;
    const jsFilePath = options.emitDeclarationOnly ? undefined : outPath;
    const sourceMapFilePath = jsFilePath && getSourceMapFilePath(jsFilePath, options);
    const declarationFilePath = (forceDtsPaths || ts.getEmitDeclarations(options)) ? ts.removeFileExtension(outPath) + ts.Extension.Dts : undefined;
    const declarationMapPath = declarationFilePath && ts.getAreDeclarationMapsEnabled(options) ? declarationFilePath + ".map" : undefined;
    const buildInfoPath = getTsBuildInfoEmitOutputFilePath(options);
    return { jsFilePath, sourceMapFilePath, declarationFilePath, declarationMapPath, buildInfoPath };
}
/*@internal*/
export function getOutputPathsFor(sourceFile: ts.SourceFile | ts.Bundle, host: ts.EmitHost, forceDtsPaths: boolean): ts.EmitFileNames {
    const options = host.getCompilerOptions();
    if (sourceFile.kind === ts.SyntaxKind.Bundle) {
        return getOutputPathsForBundle(options, forceDtsPaths);
    }
    else {
        const ownOutputFilePath = ts.getOwnEmitOutputFilePath(sourceFile.fileName, host, getOutputExtension(sourceFile, options));
        // If json file emits to the same location skip writing it, if emitDeclarationOnly skip writing it
        const isJsonEmittedToSameLocation = ts.isJsonSourceFile(sourceFile) &&
            ts.comparePaths(sourceFile.fileName, ownOutputFilePath, host.getCurrentDirectory(), !host.useCaseSensitiveFileNames()) === ts.Comparison.EqualTo;
        const jsFilePath = options.emitDeclarationOnly || isJsonEmittedToSameLocation ? undefined : ownOutputFilePath;
        const sourceMapFilePath = !jsFilePath || ts.isJsonSourceFile(sourceFile) ? undefined : getSourceMapFilePath(jsFilePath, options);
        const declarationFilePath = (forceDtsPaths || ts.getEmitDeclarations(options)) ? ts.getDeclarationEmitOutputFilePath(sourceFile.fileName, host) : undefined;
        const declarationMapPath = declarationFilePath && ts.getAreDeclarationMapsEnabled(options) ? declarationFilePath + ".map" : undefined;
        return { jsFilePath, sourceMapFilePath, declarationFilePath, declarationMapPath, buildInfoPath: undefined };
    }
}
function getSourceMapFilePath(jsFilePath: string, options: ts.CompilerOptions) {
    return (options.sourceMap && !options.inlineSourceMap) ? jsFilePath + ".map" : undefined;
}
// JavaScript files are always LanguageVariant.JSX, as JSX syntax is allowed in .js files also.
// So for JavaScript files, '.jsx' is only emitted if the input was '.jsx', and JsxEmit.Preserve.
// For TypeScript, the only time to emit with a '.jsx' extension, is on JSX input, and JsxEmit.Preserve
/* @internal */
export function getOutputExtension(sourceFile: ts.SourceFile, options: ts.CompilerOptions): ts.Extension {
    if (ts.isJsonSourceFile(sourceFile)) {
        return ts.Extension.Json;
    }
    if (options.jsx === ts.JsxEmit.Preserve) {
        if (ts.isSourceFileJS(sourceFile)) {
            if (ts.fileExtensionIs(sourceFile.fileName, ts.Extension.Jsx)) {
                return ts.Extension.Jsx;
            }
        }
        else if (sourceFile.languageVariant === ts.LanguageVariant.JSX) {
            // TypeScript source file preserving JSX syntax
            return ts.Extension.Jsx;
        }
    }
    return ts.Extension.Js;
}
function rootDirOfOptions(configFile: ts.ParsedCommandLine) {
    return configFile.options.rootDir || ts.getDirectoryPath(ts.Debug.assertDefined(configFile.options.configFilePath));
}
function getOutputPathWithoutChangingExt(inputFileName: string, configFile: ts.ParsedCommandLine, ignoreCase: boolean, outputDir: string | undefined) {
    return outputDir ?
        ts.resolvePath(outputDir, ts.getRelativePathFromDirectory(rootDirOfOptions(configFile), inputFileName, ignoreCase)) :
        inputFileName;
}
/* @internal */
export function getOutputDeclarationFileName(inputFileName: string, configFile: ts.ParsedCommandLine, ignoreCase: boolean) {
    ts.Debug.assert(!ts.fileExtensionIs(inputFileName, ts.Extension.Dts));
    return ts.changeExtension(getOutputPathWithoutChangingExt(inputFileName, configFile, ignoreCase, configFile.options.declarationDir || configFile.options.outDir), ts.Extension.Dts);
}
function getOutputJSFileName(inputFileName: string, configFile: ts.ParsedCommandLine, ignoreCase: boolean) {
    if (configFile.options.emitDeclarationOnly)
        return undefined;
    const isJsonFile = ts.fileExtensionIs(inputFileName, ts.Extension.Json);
    const outputFileName = ts.changeExtension(getOutputPathWithoutChangingExt(inputFileName, configFile, ignoreCase, configFile.options.outDir), isJsonFile ?
        ts.Extension.Json :
        ts.fileExtensionIs(inputFileName, ts.Extension.Tsx) && configFile.options.jsx === ts.JsxEmit.Preserve ?
            ts.Extension.Jsx :
            ts.Extension.Js);
    return !isJsonFile || ts.comparePaths(inputFileName, outputFileName, ts.Debug.assertDefined(configFile.options.configFilePath), ignoreCase) !== ts.Comparison.EqualTo ?
        outputFileName :
        undefined;
}
function createAddOutput() {
    let outputs: string[] | undefined;
    return { addOutput, getOutputs };
    function addOutput(path: string | undefined) {
        if (path) {
            (outputs || (outputs = [])).push(path);
        }
    }
    function getOutputs(): readonly string[] {
        return outputs || ts.emptyArray;
    }
}
function getSingleOutputFileNames(configFile: ts.ParsedCommandLine, addOutput: ReturnType<typeof createAddOutput>["addOutput"]) {
    const { jsFilePath, sourceMapFilePath, declarationFilePath, declarationMapPath, buildInfoPath } = getOutputPathsForBundle(configFile.options, /*forceDtsPaths*/ false);
    addOutput(jsFilePath);
    addOutput(sourceMapFilePath);
    addOutput(declarationFilePath);
    addOutput(declarationMapPath);
    addOutput(buildInfoPath);
}
function getOwnOutputFileNames(configFile: ts.ParsedCommandLine, inputFileName: string, ignoreCase: boolean, addOutput: ReturnType<typeof createAddOutput>["addOutput"]) {
    if (ts.fileExtensionIs(inputFileName, ts.Extension.Dts))
        return;
    const js = getOutputJSFileName(inputFileName, configFile, ignoreCase);
    addOutput(js);
    if (ts.fileExtensionIs(inputFileName, ts.Extension.Json))
        return;
    if (js && configFile.options.sourceMap) {
        addOutput(`${js}.map`);
    }
    if (ts.getEmitDeclarations(configFile.options)) {
        const dts = getOutputDeclarationFileName(inputFileName, configFile, ignoreCase);
        addOutput(dts);
        if (configFile.options.declarationMap) {
            addOutput(`${dts}.map`);
        }
    }
}
/*@internal*/
export function getAllProjectOutputs(configFile: ts.ParsedCommandLine, ignoreCase: boolean): readonly string[] {
    const { addOutput, getOutputs } = createAddOutput();
    if (configFile.options.outFile || configFile.options.out) {
        getSingleOutputFileNames(configFile, addOutput);
    }
    else {
        for (const inputFileName of configFile.fileNames) {
            getOwnOutputFileNames(configFile, inputFileName, ignoreCase, addOutput);
        }
        addOutput(getTsBuildInfoEmitOutputFilePath(configFile.options));
    }
    return getOutputs();
}
export function getOutputFileNames(commandLine: ts.ParsedCommandLine, inputFileName: string, ignoreCase: boolean): readonly string[] {
    inputFileName = ts.normalizePath(inputFileName);
    ts.Debug.assert(ts.contains(commandLine.fileNames, inputFileName), `Expected fileName to be present in command line`);
    const { addOutput, getOutputs } = createAddOutput();
    if (commandLine.options.outFile || commandLine.options.out) {
        getSingleOutputFileNames(commandLine, addOutput);
    }
    else {
        getOwnOutputFileNames(commandLine, inputFileName, ignoreCase, addOutput);
    }
    return getOutputs();
}
/*@internal*/
export function getFirstProjectOutput(configFile: ts.ParsedCommandLine, ignoreCase: boolean): string {
    if (configFile.options.outFile || configFile.options.out) {
        const { jsFilePath } = getOutputPathsForBundle(configFile.options, /*forceDtsPaths*/ false);
        return ts.Debug.assertDefined(jsFilePath, `project ${configFile.options.configFilePath} expected to have at least one output`);
    }
    for (const inputFileName of configFile.fileNames) {
        if (ts.fileExtensionIs(inputFileName, ts.Extension.Dts))
            continue;
        const jsFilePath = getOutputJSFileName(inputFileName, configFile, ignoreCase);
        if (jsFilePath)
            return jsFilePath;
        if (ts.fileExtensionIs(inputFileName, ts.Extension.Json))
            continue;
        if (ts.getEmitDeclarations(configFile.options)) {
            return getOutputDeclarationFileName(inputFileName, configFile, ignoreCase);
        }
    }
    const buildInfoPath = getTsBuildInfoEmitOutputFilePath(configFile.options);
    if (buildInfoPath)
        return buildInfoPath;
    return ts.Debug.fail(`project ${configFile.options.configFilePath} expected to have at least one output`);
}
/*@internal*/
// targetSourceFile is when users only want one file in entire project to be emitted. This is used in compileOnSave feature
export function emitFiles(resolver: ts.EmitResolver, host: ts.EmitHost, targetSourceFile: ts.SourceFile | undefined, { scriptTransformers, declarationTransformers }: ts.EmitTransformers, emitOnlyDtsFiles?: boolean, onlyBuildInfo?: boolean, forceDtsEmit?: boolean): ts.EmitResult {
    const compilerOptions = host.getCompilerOptions();
    const sourceMapDataList: ts.SourceMapEmitResult[] | undefined = (compilerOptions.sourceMap || compilerOptions.inlineSourceMap || ts.getAreDeclarationMapsEnabled(compilerOptions)) ? [] : undefined;
    const emittedFilesList: string[] | undefined = compilerOptions.listEmittedFiles ? [] : undefined;
    const emitterDiagnostics = ts.createDiagnosticCollection();
    const newLine = ts.getNewLineCharacter(compilerOptions, () => host.getNewLine());
    const writer = ts.createTextWriter(newLine);
    const { enter, exit } = ts.performance.createTimer("printTime", "beforePrint", "afterPrint");
    let bundleBuildInfo: ts.BundleBuildInfo | undefined;
    let emitSkipped = false;
    let exportedModulesFromDeclarationEmit: ts.ExportedModulesFromDeclarationEmit | undefined;
    // Emit each output file
    enter();
    forEachEmittedFile(host, emitSourceFileOrBundle, ts.getSourceFilesToEmit(host, targetSourceFile, forceDtsEmit), forceDtsEmit, onlyBuildInfo, !targetSourceFile);
    exit();
    return {
        emitSkipped,
        diagnostics: emitterDiagnostics.getDiagnostics(),
        emittedFiles: emittedFilesList,
        sourceMaps: sourceMapDataList,
        exportedModulesFromDeclarationEmit
    };
    function emitSourceFileOrBundle({ jsFilePath, sourceMapFilePath, declarationFilePath, declarationMapPath, buildInfoPath }: ts.EmitFileNames, sourceFileOrBundle: ts.SourceFile | ts.Bundle | undefined) {
        let buildInfoDirectory: string | undefined;
        if (buildInfoPath && sourceFileOrBundle && ts.isBundle(sourceFileOrBundle)) {
            buildInfoDirectory = ts.getDirectoryPath(ts.getNormalizedAbsolutePath(buildInfoPath, host.getCurrentDirectory()));
            bundleBuildInfo = {
                commonSourceDirectory: relativeToBuildInfo(host.getCommonSourceDirectory()),
                sourceFiles: sourceFileOrBundle.sourceFiles.map(file => relativeToBuildInfo(ts.getNormalizedAbsolutePath(file.fileName, host.getCurrentDirectory())))
            };
        }
        emitJsFileOrBundle(sourceFileOrBundle, jsFilePath, sourceMapFilePath, relativeToBuildInfo);
        emitDeclarationFileOrBundle(sourceFileOrBundle, declarationFilePath, declarationMapPath, relativeToBuildInfo);
        emitBuildInfo(bundleBuildInfo, buildInfoPath);
        if (!emitSkipped && emittedFilesList) {
            if (!emitOnlyDtsFiles) {
                if (jsFilePath) {
                    emittedFilesList.push(jsFilePath);
                }
                if (sourceMapFilePath) {
                    emittedFilesList.push(sourceMapFilePath);
                }
                if (buildInfoPath) {
                    emittedFilesList.push(buildInfoPath);
                }
            }
            if (declarationFilePath) {
                emittedFilesList.push(declarationFilePath);
            }
            if (declarationMapPath) {
                emittedFilesList.push(declarationMapPath);
            }
        }
        function relativeToBuildInfo(path: string) {
            return ts.ensurePathIsNonModuleName(ts.getRelativePathFromDirectory((buildInfoDirectory!), path, host.getCanonicalFileName));
        }
    }
    function emitBuildInfo(bundle: ts.BundleBuildInfo | undefined, buildInfoPath: string | undefined) {
        // Write build information if applicable
        if (!buildInfoPath || targetSourceFile || emitSkipped)
            return;
        const program = host.getProgramBuildInfo();
        if (host.isEmitBlocked(buildInfoPath) || compilerOptions.noEmit) {
            emitSkipped = true;
            return;
        }
        const version = ts.version; // Extracted into a const so the form is stable between namespace and module
        ts.writeFile(host, emitterDiagnostics, buildInfoPath, getBuildInfoText({ bundle, program, version }), /*writeByteOrderMark*/ false);
    }
    function emitJsFileOrBundle(sourceFileOrBundle: ts.SourceFile | ts.Bundle | undefined, jsFilePath: string | undefined, sourceMapFilePath: string | undefined, relativeToBuildInfo: (path: string) => string) {
        if (!sourceFileOrBundle || emitOnlyDtsFiles || !jsFilePath) {
            return;
        }
        // Make sure not to write js file and source map file if any of them cannot be written
        if ((jsFilePath && host.isEmitBlocked(jsFilePath)) || compilerOptions.noEmit) {
            emitSkipped = true;
            return;
        }
        // Transform the source files
        const transform = ts.transformNodes(resolver, host, compilerOptions, [sourceFileOrBundle], scriptTransformers, /*allowDtsFiles*/ false);
        const printerOptions: ts.PrinterOptions = {
            removeComments: compilerOptions.removeComments,
            newLine: compilerOptions.newLine,
            noEmitHelpers: compilerOptions.noEmitHelpers,
            module: compilerOptions.module,
            target: compilerOptions.target,
            sourceMap: compilerOptions.sourceMap,
            inlineSourceMap: compilerOptions.inlineSourceMap,
            inlineSources: compilerOptions.inlineSources,
            extendedDiagnostics: compilerOptions.extendedDiagnostics,
            writeBundleFileInfo: !!bundleBuildInfo,
            relativeToBuildInfo
        };
        // Create a printer to print the nodes
        const printer = createPrinter(printerOptions, {
            // resolver hooks
            hasGlobalName: resolver.hasGlobalName,
            // transform hooks
            onEmitNode: transform.emitNodeWithNotification,
            substituteNode: transform.substituteNode,
        });
        ts.Debug.assert(transform.transformed.length === 1, "Should only see one output from the transform");
        printSourceFileOrBundle(jsFilePath, sourceMapFilePath, transform.transformed[0], printer, compilerOptions);
        // Clean up emit nodes on parse tree
        transform.dispose();
        if (bundleBuildInfo)
            bundleBuildInfo.js = printer.bundleFileInfo;
    }
    function emitDeclarationFileOrBundle(sourceFileOrBundle: ts.SourceFile | ts.Bundle | undefined, declarationFilePath: string | undefined, declarationMapPath: string | undefined, relativeToBuildInfo: (path: string) => string) {
        if (!sourceFileOrBundle)
            return;
        if (!declarationFilePath) {
            if (emitOnlyDtsFiles || compilerOptions.emitDeclarationOnly)
                emitSkipped = true;
            return;
        }
        const sourceFiles = ts.isSourceFile(sourceFileOrBundle) ? [sourceFileOrBundle] : sourceFileOrBundle.sourceFiles;
        // Setup and perform the transformation to retrieve declarations from the input files
        const inputListOrBundle = (compilerOptions.outFile || compilerOptions.out) ? [ts.createBundle(sourceFiles, !ts.isSourceFile(sourceFileOrBundle) ? sourceFileOrBundle.prepends : undefined)] : sourceFiles;
        if (emitOnlyDtsFiles && !ts.getEmitDeclarations(compilerOptions)) {
            // Checker wont collect the linked aliases since thats only done when declaration is enabled.
            // Do that here when emitting only dts files
            sourceFiles.forEach(collectLinkedAliases);
        }
        const declarationTransform = ts.transformNodes(resolver, host, compilerOptions, inputListOrBundle, declarationTransformers, /*allowDtsFiles*/ false);
        if (ts.length(declarationTransform.diagnostics)) {
            for (const diagnostic of declarationTransform.diagnostics!) {
                emitterDiagnostics.add(diagnostic);
            }
        }
        const printerOptions: ts.PrinterOptions = {
            removeComments: compilerOptions.removeComments,
            newLine: compilerOptions.newLine,
            noEmitHelpers: true,
            module: compilerOptions.module,
            target: compilerOptions.target,
            sourceMap: compilerOptions.sourceMap,
            inlineSourceMap: compilerOptions.inlineSourceMap,
            extendedDiagnostics: compilerOptions.extendedDiagnostics,
            onlyPrintJsDocStyle: true,
            writeBundleFileInfo: !!bundleBuildInfo,
            recordInternalSection: !!bundleBuildInfo,
            relativeToBuildInfo
        };
        const declarationPrinter = createPrinter(printerOptions, {
            // resolver hooks
            hasGlobalName: resolver.hasGlobalName,
            // transform hooks
            onEmitNode: declarationTransform.emitNodeWithNotification,
            substituteNode: declarationTransform.substituteNode,
        });
        const declBlocked = (!!declarationTransform.diagnostics && !!declarationTransform.diagnostics.length) || !!host.isEmitBlocked(declarationFilePath) || !!compilerOptions.noEmit;
        emitSkipped = emitSkipped || declBlocked;
        if (!declBlocked || forceDtsEmit) {
            ts.Debug.assert(declarationTransform.transformed.length === 1, "Should only see one output from the decl transform");
            printSourceFileOrBundle(declarationFilePath, declarationMapPath, declarationTransform.transformed[0], declarationPrinter, {
                sourceMap: compilerOptions.declarationMap,
                sourceRoot: compilerOptions.sourceRoot,
                mapRoot: compilerOptions.mapRoot,
                extendedDiagnostics: compilerOptions.extendedDiagnostics,
            });
            if (forceDtsEmit && declarationTransform.transformed[0].kind === ts.SyntaxKind.SourceFile) {
                const sourceFile = declarationTransform.transformed[0];
                exportedModulesFromDeclarationEmit = sourceFile.exportedModulesFromDeclarationEmit;
            }
        }
        declarationTransform.dispose();
        if (bundleBuildInfo)
            bundleBuildInfo.dts = declarationPrinter.bundleFileInfo;
    }
    function collectLinkedAliases(node: ts.Node) {
        if (ts.isExportAssignment(node)) {
            if (node.expression.kind === ts.SyntaxKind.Identifier) {
                resolver.collectLinkedAliases((node.expression as ts.Identifier), /*setVisibility*/ true);
            }
            return;
        }
        else if (ts.isExportSpecifier(node)) {
            resolver.collectLinkedAliases(node.propertyName || node.name, /*setVisibility*/ true);
            return;
        }
        ts.forEachChild(node, collectLinkedAliases);
    }
    function printSourceFileOrBundle(jsFilePath: string, sourceMapFilePath: string | undefined, sourceFileOrBundle: ts.SourceFile | ts.Bundle, printer: ts.Printer, mapOptions: SourceMapOptions) {
        const bundle = sourceFileOrBundle.kind === ts.SyntaxKind.Bundle ? sourceFileOrBundle : undefined;
        const sourceFile = sourceFileOrBundle.kind === ts.SyntaxKind.SourceFile ? sourceFileOrBundle : undefined;
        const sourceFiles = bundle ? bundle.sourceFiles : [sourceFile!];
        let sourceMapGenerator: ts.SourceMapGenerator | undefined;
        if (shouldEmitSourceMaps(mapOptions, sourceFileOrBundle)) {
            sourceMapGenerator = ts.createSourceMapGenerator(host, ts.getBaseFileName(ts.normalizeSlashes(jsFilePath)), getSourceRoot(mapOptions), getSourceMapDirectory(mapOptions, jsFilePath, sourceFile), mapOptions);
        }
        if (bundle) {
            printer.writeBundle(bundle, writer, sourceMapGenerator);
        }
        else {
            printer.writeFile(sourceFile!, writer, sourceMapGenerator);
        }
        if (sourceMapGenerator) {
            if (sourceMapDataList) {
                sourceMapDataList.push({
                    inputSourceFileNames: sourceMapGenerator.getSources(),
                    sourceMap: sourceMapGenerator.toJSON()
                });
            }
            const sourceMappingURL = getSourceMappingURL(mapOptions, sourceMapGenerator, jsFilePath, sourceMapFilePath, sourceFile);
            if (sourceMappingURL) {
                if (!writer.isAtStartOfLine())
                    writer.rawWrite(newLine);
                writer.writeComment(`//# ${"sourceMappingURL"}=${sourceMappingURL}`); // Tools can sometimes see this line as a source mapping url comment
            }
            // Write the source map
            if (sourceMapFilePath) {
                const sourceMap = sourceMapGenerator.toString();
                ts.writeFile(host, emitterDiagnostics, sourceMapFilePath, sourceMap, /*writeByteOrderMark*/ false, sourceFiles);
            }
        }
        else {
            writer.writeLine();
        }
        // Write the output file
        ts.writeFile(host, emitterDiagnostics, jsFilePath, writer.getText(), !!compilerOptions.emitBOM, sourceFiles);
        // Reset state
        writer.clear();
    }
    interface SourceMapOptions {
        sourceMap?: boolean;
        inlineSourceMap?: boolean;
        inlineSources?: boolean;
        sourceRoot?: string;
        mapRoot?: string;
        extendedDiagnostics?: boolean;
    }
    function shouldEmitSourceMaps(mapOptions: SourceMapOptions, sourceFileOrBundle: ts.SourceFile | ts.Bundle) {
        return (mapOptions.sourceMap || mapOptions.inlineSourceMap)
            && (sourceFileOrBundle.kind !== ts.SyntaxKind.SourceFile || !ts.fileExtensionIs(sourceFileOrBundle.fileName, ts.Extension.Json));
    }
    function getSourceRoot(mapOptions: SourceMapOptions) {
        // Normalize source root and make sure it has trailing "/" so that it can be used to combine paths with the
        // relative paths of the sources list in the sourcemap
        const sourceRoot = ts.normalizeSlashes(mapOptions.sourceRoot || "");
        return sourceRoot ? ts.ensureTrailingDirectorySeparator(sourceRoot) : sourceRoot;
    }
    function getSourceMapDirectory(mapOptions: SourceMapOptions, filePath: string, sourceFile: ts.SourceFile | undefined) {
        if (mapOptions.sourceRoot)
            return host.getCommonSourceDirectory();
        if (mapOptions.mapRoot) {
            let sourceMapDir = ts.normalizeSlashes(mapOptions.mapRoot);
            if (sourceFile) {
                // For modules or multiple emit files the mapRoot will have directory structure like the sources
                // So if src\a.ts and src\lib\b.ts are compiled together user would be moving the maps into mapRoot\a.js.map and mapRoot\lib\b.js.map
                sourceMapDir = ts.getDirectoryPath(ts.getSourceFilePathInNewDir(sourceFile.fileName, host, sourceMapDir));
            }
            if (ts.getRootLength(sourceMapDir) === 0) {
                // The relative paths are relative to the common directory
                sourceMapDir = ts.combinePaths(host.getCommonSourceDirectory(), sourceMapDir);
            }
            return sourceMapDir;
        }
        return ts.getDirectoryPath(ts.normalizePath(filePath));
    }
    function getSourceMappingURL(mapOptions: SourceMapOptions, sourceMapGenerator: ts.SourceMapGenerator, filePath: string, sourceMapFilePath: string | undefined, sourceFile: ts.SourceFile | undefined) {
        if (mapOptions.inlineSourceMap) {
            // Encode the sourceMap into the sourceMap url
            const sourceMapText = sourceMapGenerator.toString();
            const base64SourceMapText = ts.base64encode(ts.sys, sourceMapText);
            return `data:application/json;base64,${base64SourceMapText}`;
        }
        const sourceMapFile = ts.getBaseFileName(ts.normalizeSlashes(ts.Debug.assertDefined(sourceMapFilePath)));
        if (mapOptions.mapRoot) {
            let sourceMapDir = ts.normalizeSlashes(mapOptions.mapRoot);
            if (sourceFile) {
                // For modules or multiple emit files the mapRoot will have directory structure like the sources
                // So if src\a.ts and src\lib\b.ts are compiled together user would be moving the maps into mapRoot\a.js.map and mapRoot\lib\b.js.map
                sourceMapDir = ts.getDirectoryPath(ts.getSourceFilePathInNewDir(sourceFile.fileName, host, sourceMapDir));
            }
            if (ts.getRootLength(sourceMapDir) === 0) {
                // The relative paths are relative to the common directory
                sourceMapDir = ts.combinePaths(host.getCommonSourceDirectory(), sourceMapDir);
                return ts.getRelativePathToDirectoryOrUrl(ts.getDirectoryPath(ts.normalizePath(filePath)), // get the relative sourceMapDir path based on jsFilePath
                ts.combinePaths(sourceMapDir, sourceMapFile), // this is where user expects to see sourceMap
                host.getCurrentDirectory(), host.getCanonicalFileName, 
                /*isAbsolutePathAnUrl*/ true);
            }
            else {
                return ts.combinePaths(sourceMapDir, sourceMapFile);
            }
        }
        return sourceMapFile;
    }
}
/*@internal*/
export function getBuildInfoText(buildInfo: ts.BuildInfo) {
    return JSON.stringify(buildInfo, undefined, 2);
}
/*@internal*/
export function getBuildInfo(buildInfoText: string) {
    return JSON.parse(buildInfoText) as ts.BuildInfo;
}
/*@internal*/
export const notImplementedResolver: ts.EmitResolver = {
    hasGlobalName: ts.notImplemented,
    getReferencedExportContainer: ts.notImplemented,
    getReferencedImportDeclaration: ts.notImplemented,
    getReferencedDeclarationWithCollidingName: ts.notImplemented,
    isDeclarationWithCollidingName: ts.notImplemented,
    isValueAliasDeclaration: ts.notImplemented,
    isReferencedAliasDeclaration: ts.notImplemented,
    isTopLevelValueImportEqualsWithEntityName: ts.notImplemented,
    getNodeCheckFlags: ts.notImplemented,
    isDeclarationVisible: ts.notImplemented,
    isLateBound: (_node): _node is ts.LateBoundDeclaration => false,
    collectLinkedAliases: ts.notImplemented,
    isImplementationOfOverload: ts.notImplemented,
    isRequiredInitializedParameter: ts.notImplemented,
    isOptionalUninitializedParameterProperty: ts.notImplemented,
    isExpandoFunctionDeclaration: ts.notImplemented,
    getPropertiesOfContainerFunction: ts.notImplemented,
    createTypeOfDeclaration: ts.notImplemented,
    createReturnTypeOfSignatureDeclaration: ts.notImplemented,
    createTypeOfExpression: ts.notImplemented,
    createLiteralConstValue: ts.notImplemented,
    isSymbolAccessible: ts.notImplemented,
    isEntityNameVisible: ts.notImplemented,
    // Returns the constant value this property access resolves to: notImplemented, or 'undefined' for a non-constant
    getConstantValue: ts.notImplemented,
    getReferencedValueDeclaration: ts.notImplemented,
    getTypeReferenceSerializationKind: ts.notImplemented,
    isOptionalParameter: ts.notImplemented,
    moduleExportsSomeValue: ts.notImplemented,
    isArgumentsLocalBinding: ts.notImplemented,
    getExternalModuleFileFromDeclaration: ts.notImplemented,
    getTypeReferenceDirectivesForEntityName: ts.notImplemented,
    getTypeReferenceDirectivesForSymbol: ts.notImplemented,
    isLiteralConstDeclaration: ts.notImplemented,
    getJsxFactoryEntity: ts.notImplemented,
    getAllAccessorDeclarations: ts.notImplemented,
    getSymbolOfExternalModuleSpecifier: ts.notImplemented,
    isBindingCapturedByNode: ts.notImplemented,
    getDeclarationStatementsForSourceFile: ts.notImplemented,
};
/*@internal*/
/** File that isnt present resulting in error or output files */
export type EmitUsingBuildInfoResult = string | readonly ts.OutputFile[];
/*@internal*/
export interface EmitUsingBuildInfoHost extends ts.ModuleResolutionHost {
    getCurrentDirectory(): string;
    getCanonicalFileName(fileName: string): string;
    useCaseSensitiveFileNames(): boolean;
    getNewLine(): string;
}
function createSourceFilesFromBundleBuildInfo(bundle: ts.BundleBuildInfo, buildInfoDirectory: string, host: EmitUsingBuildInfoHost): readonly ts.SourceFile[] {
    const sourceFiles = bundle.sourceFiles.map(fileName => {
        const sourceFile = (ts.createNode(ts.SyntaxKind.SourceFile, 0, 0) as ts.SourceFile);
        sourceFile.fileName = ts.getRelativePathFromDirectory(host.getCurrentDirectory(), ts.getNormalizedAbsolutePath(fileName, buildInfoDirectory), !host.useCaseSensitiveFileNames());
        sourceFile.text = "";
        sourceFile.statements = ts.createNodeArray();
        return sourceFile;
    });
    const jsBundle = ts.Debug.assertDefined(bundle.js);
    ts.forEach(jsBundle.sources && jsBundle.sources.prologues, prologueInfo => {
        const sourceFile = sourceFiles[prologueInfo.file];
        sourceFile.text = prologueInfo.text;
        sourceFile.end = prologueInfo.text.length;
        sourceFile.statements = ts.createNodeArray(prologueInfo.directives.map(directive => {
            const statement = (ts.createNode(ts.SyntaxKind.ExpressionStatement, directive.pos, directive.end) as ts.PrologueDirective);
            statement.expression = (ts.createNode(ts.SyntaxKind.StringLiteral, directive.expression.pos, directive.expression.end) as ts.StringLiteral);
            statement.expression.text = directive.expression.text;
            return statement;
        }));
    });
    return sourceFiles;
}
/*@internal*/
export function emitUsingBuildInfo(config: ts.ParsedCommandLine, host: EmitUsingBuildInfoHost, getCommandLine: (ref: ts.ProjectReference) => ts.ParsedCommandLine | undefined, customTransformers?: ts.CustomTransformers): EmitUsingBuildInfoResult {
    const { buildInfoPath, jsFilePath, sourceMapFilePath, declarationFilePath, declarationMapPath } = getOutputPathsForBundle(config.options, /*forceDtsPaths*/ false);
    const buildInfoText = host.readFile(ts.Debug.assertDefined(buildInfoPath));
    if (!buildInfoText)
        return buildInfoPath!;
    const jsFileText = host.readFile(ts.Debug.assertDefined(jsFilePath));
    if (!jsFileText)
        return jsFilePath!;
    const sourceMapText = sourceMapFilePath && host.readFile(sourceMapFilePath);
    // error if no source map or for now if inline sourcemap
    if ((sourceMapFilePath && !sourceMapText) || config.options.inlineSourceMap)
        return sourceMapFilePath || "inline sourcemap decoding";
    // read declaration text
    const declarationText = declarationFilePath && host.readFile(declarationFilePath);
    if (declarationFilePath && !declarationText)
        return declarationFilePath;
    const declarationMapText = declarationMapPath && host.readFile(declarationMapPath);
    // error if no source map or for now if inline sourcemap
    if ((declarationMapPath && !declarationMapText) || config.options.inlineSourceMap)
        return declarationMapPath || "inline sourcemap decoding";
    const buildInfo = getBuildInfo(buildInfoText);
    if (!buildInfo.bundle || !buildInfo.bundle.js || (declarationText && !buildInfo.bundle.dts))
        return buildInfoPath!;
    const buildInfoDirectory = ts.getDirectoryPath(ts.getNormalizedAbsolutePath((buildInfoPath!), host.getCurrentDirectory()));
    const ownPrependInput = ts.createInputFiles(jsFileText, (declarationText!), sourceMapFilePath, sourceMapText, declarationMapPath, declarationMapText, jsFilePath, declarationFilePath, buildInfoPath, buildInfo, 
    /*onlyOwnText*/ true);
    const outputFiles: ts.OutputFile[] = [];
    const prependNodes = ts.createPrependNodes(config.projectReferences, getCommandLine, f => host.readFile(f));
    const sourceFilesForJsEmit = createSourceFilesFromBundleBuildInfo(buildInfo.bundle, buildInfoDirectory, host);
    const emitHost: ts.EmitHost = {
        getPrependNodes: ts.memoize(() => [...prependNodes, ownPrependInput]),
        getCanonicalFileName: host.getCanonicalFileName,
        getCommonSourceDirectory: () => ts.getNormalizedAbsolutePath(buildInfo.bundle!.commonSourceDirectory, buildInfoDirectory),
        getCompilerOptions: () => config.options,
        getCurrentDirectory: () => host.getCurrentDirectory(),
        getNewLine: () => host.getNewLine(),
        getSourceFile: ts.returnUndefined,
        getSourceFileByPath: ts.returnUndefined,
        getSourceFiles: () => sourceFilesForJsEmit,
        getLibFileFromReference: ts.notImplemented,
        isSourceFileFromExternalLibrary: ts.returnFalse,
        getResolvedProjectReferenceToRedirect: ts.returnUndefined,
        isSourceOfProjectReferenceRedirect: ts.returnFalse,
        writeFile: (name, text, writeByteOrderMark) => {
            switch (name) {
                case jsFilePath:
                    if (jsFileText === text)
                        return;
                    break;
                case sourceMapFilePath:
                    if (sourceMapText === text)
                        return;
                    break;
                case buildInfoPath:
                    const newBuildInfo = getBuildInfo(text);
                    newBuildInfo.program = buildInfo.program;
                    // Update sourceFileInfo
                    const { js, dts, sourceFiles } = buildInfo.bundle!;
                    newBuildInfo.bundle!.js!.sources = js!.sources;
                    if (dts) {
                        newBuildInfo.bundle!.dts!.sources = dts.sources;
                    }
                    newBuildInfo.bundle!.sourceFiles = sourceFiles;
                    outputFiles.push({ name, text: getBuildInfoText(newBuildInfo), writeByteOrderMark });
                    return;
                case declarationFilePath:
                    if (declarationText === text)
                        return;
                    break;
                case declarationMapPath:
                    if (declarationMapText === text)
                        return;
                    break;
                default:
                    ts.Debug.fail(`Unexpected path: ${name}`);
            }
            outputFiles.push({ name, text, writeByteOrderMark });
        },
        isEmitBlocked: ts.returnFalse,
        readFile: f => host.readFile(f),
        fileExists: f => host.fileExists(f),
        directoryExists: host.directoryExists && (f => host.directoryExists!(f)),
        useCaseSensitiveFileNames: () => host.useCaseSensitiveFileNames(),
        getProgramBuildInfo: ts.returnUndefined,
        getSourceFileFromReference: ts.returnUndefined,
        redirectTargetsMap: ts.createMultiMap()
    };
    emitFiles(notImplementedResolver, emitHost, 
    /*targetSourceFile*/ undefined, ts.getTransformers(config.options, customTransformers));
    return outputFiles;
}
const enum PipelinePhase {
    Notification,
    Substitution,
    Comments,
    SourceMaps,
    Emit
}
export function createPrinter(printerOptions: ts.PrinterOptions = {}, handlers: ts.PrintHandlers = {}): ts.Printer {
    const { hasGlobalName, onEmitNode = ts.noEmitNotification, substituteNode = ts.noEmitSubstitution, onBeforeEmitNodeArray, onAfterEmitNodeArray, onBeforeEmitToken, onAfterEmitToken } = handlers;
    const extendedDiagnostics = !!printerOptions.extendedDiagnostics;
    const newLine = ts.getNewLineCharacter(printerOptions);
    const moduleKind = ts.getEmitModuleKind(printerOptions);
    const bundledHelpers = ts.createMap<boolean>();
    let currentSourceFile: ts.SourceFile | undefined;
    let nodeIdToGeneratedName: string[]; // Map of generated names for specific nodes.
    let autoGeneratedIdToGeneratedName: string[]; // Map of generated names for temp and loop variables.
    let generatedNames: ts.Map<true>; // Set of names generated by the NameGenerator.
    let tempFlagsStack: TempFlags[]; // Stack of enclosing name generation scopes.
    let tempFlags: TempFlags; // TempFlags for the current name generation scope.
    let reservedNamesStack: ts.Map<true>[]; // Stack of TempFlags reserved in enclosing name generation scopes.
    let reservedNames: ts.Map<true>; // TempFlags to reserve in nested name generation scopes.
    let writer: ts.EmitTextWriter;
    let ownWriter: ts.EmitTextWriter; // Reusable `EmitTextWriter` for basic printing.
    let write = writeBase;
    let isOwnFileEmit: boolean;
    const bundleFileInfo = printerOptions.writeBundleFileInfo ? { sections: [] } as ts.BundleFileInfo : undefined;
    const relativeToBuildInfo = bundleFileInfo ? ts.Debug.assertDefined(printerOptions.relativeToBuildInfo) : undefined;
    const recordInternalSection = printerOptions.recordInternalSection;
    let sourceFileTextPos = 0;
    let sourceFileTextKind: ts.BundleFileTextLikeKind = ts.BundleFileSectionKind.Text;
    // Source Maps
    let sourceMapsDisabled = true;
    let sourceMapGenerator: ts.SourceMapGenerator | undefined;
    let sourceMapSource: ts.SourceMapSource;
    let sourceMapSourceIndex = -1;
    // Comments
    let containerPos = -1;
    let containerEnd = -1;
    let declarationListContainerEnd = -1;
    let currentLineMap: readonly number[] | undefined;
    let detachedCommentsInfo: {
        nodePos: number;
        detachedCommentEndPos: number;
    }[] | undefined;
    let hasWrittenComment = false;
    let commentsDisabled = !!printerOptions.removeComments;
    let lastNode: ts.Node | undefined;
    let lastSubstitution: ts.Node | undefined;
    const { enter: enterComment, exit: exitComment } = ts.performance.createTimerIf(extendedDiagnostics, "commentTime", "beforeComment", "afterComment");
    reset();
    return {
        // public API
        printNode,
        printList,
        printFile,
        printBundle,
        // internal API
        writeNode,
        writeList,
        writeFile,
        writeBundle,
        bundleFileInfo
    };
    function printNode(hint: ts.EmitHint, node: ts.Node, sourceFile: ts.SourceFile): string {
        switch (hint) {
            case ts.EmitHint.SourceFile:
                ts.Debug.assert(ts.isSourceFile(node), "Expected a SourceFile node.");
                break;
            case ts.EmitHint.IdentifierName:
                ts.Debug.assert(ts.isIdentifier(node), "Expected an Identifier node.");
                break;
            case ts.EmitHint.Expression:
                ts.Debug.assert(ts.isExpression(node), "Expected an Expression node.");
                break;
        }
        switch (node.kind) {
            case ts.SyntaxKind.SourceFile: return printFile((<ts.SourceFile>node));
            case ts.SyntaxKind.Bundle: return printBundle((<ts.Bundle>node));
            case ts.SyntaxKind.UnparsedSource: return printUnparsedSource((<ts.UnparsedSource>node));
        }
        writeNode(hint, node, sourceFile, beginPrint());
        return endPrint();
    }
    function printList<T extends ts.Node>(format: ts.ListFormat, nodes: ts.NodeArray<T>, sourceFile: ts.SourceFile) {
        writeList(format, nodes, sourceFile, beginPrint());
        return endPrint();
    }
    function printBundle(bundle: ts.Bundle): string {
        writeBundle(bundle, beginPrint(), /*sourceMapEmitter*/ undefined);
        return endPrint();
    }
    function printFile(sourceFile: ts.SourceFile): string {
        writeFile(sourceFile, beginPrint(), /*sourceMapEmitter*/ undefined);
        return endPrint();
    }
    function printUnparsedSource(unparsed: ts.UnparsedSource): string {
        writeUnparsedSource(unparsed, beginPrint());
        return endPrint();
    }
    /**
     * If `sourceFile` is `undefined`, `node` must be a synthesized `TypeNode`.
     */
    function writeNode(hint: ts.EmitHint, node: ts.TypeNode, sourceFile: undefined, output: ts.EmitTextWriter): void;
    function writeNode(hint: ts.EmitHint, node: ts.Node, sourceFile: ts.SourceFile, output: ts.EmitTextWriter): void;
    function writeNode(hint: ts.EmitHint, node: ts.Node, sourceFile: ts.SourceFile | undefined, output: ts.EmitTextWriter) {
        const previousWriter = writer;
        setWriter(output, /*_sourceMapGenerator*/ undefined);
        print(hint, node, sourceFile);
        reset();
        writer = previousWriter;
    }
    function writeList<T extends ts.Node>(format: ts.ListFormat, nodes: ts.NodeArray<T>, sourceFile: ts.SourceFile | undefined, output: ts.EmitTextWriter) {
        const previousWriter = writer;
        setWriter(output, /*_sourceMapGenerator*/ undefined);
        if (sourceFile) {
            setSourceFile(sourceFile);
        }
        emitList(syntheticParent, nodes, format);
        reset();
        writer = previousWriter;
    }
    function getTextPosWithWriteLine() {
        return writer.getTextPosWithWriteLine ? writer.getTextPosWithWriteLine() : writer.getTextPos();
    }
    function updateOrPushBundleFileTextLike(pos: number, end: number, kind: ts.BundleFileTextLikeKind) {
        const last = ts.lastOrUndefined(bundleFileInfo!.sections);
        if (last && last.kind === kind) {
            last.end = end;
        }
        else {
            bundleFileInfo!.sections.push({ pos, end, kind });
        }
    }
    function recordBundleFileInternalSectionStart(node: ts.Node) {
        if (recordInternalSection &&
            bundleFileInfo &&
            currentSourceFile &&
            (ts.isDeclaration(node) || ts.isVariableStatement(node)) &&
            ts.isInternalDeclaration(node, currentSourceFile) &&
            sourceFileTextKind !== ts.BundleFileSectionKind.Internal) {
            const prevSourceFileTextKind = sourceFileTextKind;
            recordBundleFileTextLikeSection(writer.getTextPos());
            sourceFileTextPos = getTextPosWithWriteLine();
            sourceFileTextKind = ts.BundleFileSectionKind.Internal;
            return prevSourceFileTextKind;
        }
        return undefined;
    }
    function recordBundleFileInternalSectionEnd(prevSourceFileTextKind: ReturnType<typeof recordBundleFileInternalSectionStart>) {
        if (prevSourceFileTextKind) {
            recordBundleFileTextLikeSection(writer.getTextPos());
            sourceFileTextPos = getTextPosWithWriteLine();
            sourceFileTextKind = prevSourceFileTextKind;
        }
    }
    function recordBundleFileTextLikeSection(end: number) {
        if (sourceFileTextPos < end) {
            updateOrPushBundleFileTextLike(sourceFileTextPos, end, sourceFileTextKind);
            return true;
        }
        return false;
    }
    function writeBundle(bundle: ts.Bundle, output: ts.EmitTextWriter, sourceMapGenerator: ts.SourceMapGenerator | undefined) {
        isOwnFileEmit = false;
        const previousWriter = writer;
        setWriter(output, sourceMapGenerator);
        emitShebangIfNeeded(bundle);
        emitPrologueDirectivesIfNeeded(bundle);
        emitHelpers(bundle);
        emitSyntheticTripleSlashReferencesIfNeeded(bundle);
        for (const prepend of bundle.prepends) {
            writeLine();
            const pos = writer.getTextPos();
            const savedSections = bundleFileInfo && bundleFileInfo.sections;
            if (savedSections)
                bundleFileInfo!.sections = [];
            print(ts.EmitHint.Unspecified, prepend, /*sourceFile*/ undefined);
            if (bundleFileInfo) {
                const newSections = bundleFileInfo.sections;
                bundleFileInfo.sections = savedSections!;
                if (prepend.oldFileOfCurrentEmit)
                    bundleFileInfo.sections.push(...newSections);
                else {
                    newSections.forEach(section => ts.Debug.assert(ts.isBundleFileTextLike(section)));
                    bundleFileInfo.sections.push({
                        pos,
                        end: writer.getTextPos(),
                        kind: ts.BundleFileSectionKind.Prepend,
                        data: relativeToBuildInfo!((prepend as ts.UnparsedSource).fileName),
                        texts: (newSections as ts.BundleFileTextLike[])
                    });
                }
            }
        }
        sourceFileTextPos = getTextPosWithWriteLine();
        for (const sourceFile of bundle.sourceFiles) {
            print(ts.EmitHint.SourceFile, sourceFile, sourceFile);
        }
        if (bundleFileInfo && bundle.sourceFiles.length) {
            const end = writer.getTextPos();
            if (recordBundleFileTextLikeSection(end)) {
                // Store prologues
                const prologues = getPrologueDirectivesFromBundledSourceFiles(bundle);
                if (prologues) {
                    if (!bundleFileInfo.sources)
                        bundleFileInfo.sources = {};
                    bundleFileInfo.sources.prologues = prologues;
                }
                // Store helpes
                const helpers = getHelpersFromBundledSourceFiles(bundle);
                if (helpers) {
                    if (!bundleFileInfo.sources)
                        bundleFileInfo.sources = {};
                    bundleFileInfo.sources.helpers = helpers;
                }
            }
        }
        reset();
        writer = previousWriter;
    }
    function writeUnparsedSource(unparsed: ts.UnparsedSource, output: ts.EmitTextWriter) {
        const previousWriter = writer;
        setWriter(output, /*_sourceMapGenerator*/ undefined);
        print(ts.EmitHint.Unspecified, unparsed, /*sourceFile*/ undefined);
        reset();
        writer = previousWriter;
    }
    function writeFile(sourceFile: ts.SourceFile, output: ts.EmitTextWriter, sourceMapGenerator: ts.SourceMapGenerator | undefined) {
        isOwnFileEmit = true;
        const previousWriter = writer;
        setWriter(output, sourceMapGenerator);
        emitShebangIfNeeded(sourceFile);
        emitPrologueDirectivesIfNeeded(sourceFile);
        print(ts.EmitHint.SourceFile, sourceFile, sourceFile);
        reset();
        writer = previousWriter;
    }
    function beginPrint() {
        return ownWriter || (ownWriter = ts.createTextWriter(newLine));
    }
    function endPrint() {
        const text = ownWriter.getText();
        ownWriter.clear();
        return text;
    }
    function print(hint: ts.EmitHint, node: ts.Node, sourceFile: ts.SourceFile | undefined) {
        if (sourceFile) {
            setSourceFile(sourceFile);
        }
        pipelineEmit(hint, node);
    }
    function setSourceFile(sourceFile: ts.SourceFile | undefined) {
        currentSourceFile = sourceFile;
        currentLineMap = undefined;
        detachedCommentsInfo = undefined;
        if (sourceFile) {
            setSourceMapSource(sourceFile);
        }
    }
    function setWriter(_writer: ts.EmitTextWriter | undefined, _sourceMapGenerator: ts.SourceMapGenerator | undefined) {
        if (_writer && printerOptions.omitTrailingSemicolon) {
            _writer = ts.getTrailingSemicolonDeferringWriter(_writer);
        }
        writer = _writer!; // TODO: GH#18217
        sourceMapGenerator = _sourceMapGenerator;
        sourceMapsDisabled = !writer || !sourceMapGenerator;
    }
    function reset() {
        nodeIdToGeneratedName = [];
        autoGeneratedIdToGeneratedName = [];
        generatedNames = ts.createMap<true>();
        tempFlagsStack = [];
        tempFlags = TempFlags.Auto;
        reservedNamesStack = [];
        currentSourceFile = undefined!;
        currentLineMap = undefined!;
        detachedCommentsInfo = undefined;
        lastNode = undefined;
        lastSubstitution = undefined;
        setWriter(/*output*/ undefined, /*_sourceMapGenerator*/ undefined);
    }
    function getCurrentLineMap() {
        return currentLineMap || (currentLineMap = ts.getLineStarts((currentSourceFile!)));
    }
    function emit(node: ts.Node): ts.Node;
    function emit(node: ts.Node | undefined): ts.Node | undefined;
    function emit(node: ts.Node | undefined) {
        if (node === undefined)
            return;
        const prevSourceFileTextKind = recordBundleFileInternalSectionStart(node);
        const substitute = pipelineEmit(ts.EmitHint.Unspecified, node);
        recordBundleFileInternalSectionEnd(prevSourceFileTextKind);
        return substitute;
    }
    function emitIdentifierName(node: ts.Identifier): ts.Node;
    function emitIdentifierName(node: ts.Identifier | undefined): ts.Node | undefined;
    function emitIdentifierName(node: ts.Identifier | undefined): ts.Node | undefined {
        if (node === undefined)
            return;
        return pipelineEmit(ts.EmitHint.IdentifierName, node);
    }
    function emitExpression(node: ts.Expression): ts.Node;
    function emitExpression(node: ts.Expression | undefined): ts.Node | undefined;
    function emitExpression(node: ts.Expression | undefined): ts.Node | undefined {
        if (node === undefined)
            return;
        return pipelineEmit(ts.EmitHint.Expression, node);
    }
    function pipelineEmit(emitHint: ts.EmitHint, node: ts.Node) {
        const savedLastNode = lastNode;
        const savedLastSubstitution = lastSubstitution;
        lastNode = node;
        lastSubstitution = undefined;
        const pipelinePhase = getPipelinePhase(PipelinePhase.Notification, node);
        pipelinePhase(emitHint, node);
        ts.Debug.assert(lastNode === node);
        const substitute = lastSubstitution;
        lastNode = savedLastNode;
        lastSubstitution = savedLastSubstitution;
        return substitute || node;
    }
    function getPipelinePhase(phase: PipelinePhase, node: ts.Node) {
        switch (phase) {
            case PipelinePhase.Notification:
                if (onEmitNode !== ts.noEmitNotification) {
                    return pipelineEmitWithNotification;
                }
            // falls through
            case PipelinePhase.Substitution:
                if (substituteNode !== ts.noEmitSubstitution) {
                    return pipelineEmitWithSubstitution;
                }
            // falls through
            case PipelinePhase.Comments:
                if (!commentsDisabled && node.kind !== ts.SyntaxKind.SourceFile) {
                    return pipelineEmitWithComments;
                }
            // falls through
            case PipelinePhase.SourceMaps:
                if (!sourceMapsDisabled && node.kind !== ts.SyntaxKind.SourceFile && !ts.isInJsonFile(node)) {
                    return pipelineEmitWithSourceMap;
                }
            // falls through
            case PipelinePhase.Emit:
                return pipelineEmitWithHint;
            default:
                return ts.Debug.assertNever(phase);
        }
    }
    function getNextPipelinePhase(currentPhase: PipelinePhase, node: ts.Node) {
        return getPipelinePhase(currentPhase + 1, node);
    }
    function pipelineEmitWithNotification(hint: ts.EmitHint, node: ts.Node) {
        ts.Debug.assert(lastNode === node);
        const pipelinePhase = getNextPipelinePhase(PipelinePhase.Notification, node);
        onEmitNode(hint, node, pipelinePhase);
        ts.Debug.assert(lastNode === node);
    }
    function pipelineEmitWithHint(hint: ts.EmitHint, node: ts.Node): void {
        ts.Debug.assert(lastNode === node || lastSubstitution === node);
        if (hint === ts.EmitHint.SourceFile)
            return emitSourceFile(ts.cast(node, ts.isSourceFile));
        if (hint === ts.EmitHint.IdentifierName)
            return emitIdentifier(ts.cast(node, ts.isIdentifier));
        if (hint === ts.EmitHint.MappedTypeParameter)
            return emitMappedTypeParameter(ts.cast(node, ts.isTypeParameterDeclaration));
        if (hint === ts.EmitHint.EmbeddedStatement) {
            ts.Debug.assertNode(node, ts.isEmptyStatement);
            return emitEmptyStatement(/*isEmbeddedStatement*/ true);
        }
        if (hint === ts.EmitHint.Unspecified) {
            if (ts.isKeyword(node.kind))
                return writeTokenNode(node, writeKeyword);
            switch (node.kind) {
                // Pseudo-literals
                case ts.SyntaxKind.TemplateHead:
                case ts.SyntaxKind.TemplateMiddle:
                case ts.SyntaxKind.TemplateTail:
                    return emitLiteral((<ts.LiteralExpression>node));
                case ts.SyntaxKind.UnparsedSource:
                case ts.SyntaxKind.UnparsedPrepend:
                    return emitUnparsedSourceOrPrepend((<ts.UnparsedSource>node));
                case ts.SyntaxKind.UnparsedPrologue:
                    return writeUnparsedNode((<ts.UnparsedNode>node));
                case ts.SyntaxKind.UnparsedText:
                case ts.SyntaxKind.UnparsedInternalText:
                    return emitUnparsedTextLike((<ts.UnparsedTextLike>node));
                case ts.SyntaxKind.UnparsedSyntheticReference:
                    return emitUnparsedSyntheticReference((<ts.UnparsedSyntheticReference>node));
                // Identifiers
                case ts.SyntaxKind.Identifier:
                    return emitIdentifier((<ts.Identifier>node));
                // Parse tree nodes
                // Names
                case ts.SyntaxKind.QualifiedName:
                    return emitQualifiedName((<ts.QualifiedName>node));
                case ts.SyntaxKind.ComputedPropertyName:
                    return emitComputedPropertyName((<ts.ComputedPropertyName>node));
                // Signature elements
                case ts.SyntaxKind.TypeParameter:
                    return emitTypeParameter((<ts.TypeParameterDeclaration>node));
                case ts.SyntaxKind.Parameter:
                    return emitParameter((<ts.ParameterDeclaration>node));
                case ts.SyntaxKind.Decorator:
                    return emitDecorator((<ts.Decorator>node));
                // Type members
                case ts.SyntaxKind.PropertySignature:
                    return emitPropertySignature((<ts.PropertySignature>node));
                case ts.SyntaxKind.PropertyDeclaration:
                    return emitPropertyDeclaration((<ts.PropertyDeclaration>node));
                case ts.SyntaxKind.MethodSignature:
                    return emitMethodSignature((<ts.MethodSignature>node));
                case ts.SyntaxKind.MethodDeclaration:
                    return emitMethodDeclaration((<ts.MethodDeclaration>node));
                case ts.SyntaxKind.Constructor:
                    return emitConstructor((<ts.ConstructorDeclaration>node));
                case ts.SyntaxKind.GetAccessor:
                case ts.SyntaxKind.SetAccessor:
                    return emitAccessorDeclaration((<ts.AccessorDeclaration>node));
                case ts.SyntaxKind.CallSignature:
                    return emitCallSignature((<ts.CallSignatureDeclaration>node));
                case ts.SyntaxKind.ConstructSignature:
                    return emitConstructSignature((<ts.ConstructSignatureDeclaration>node));
                case ts.SyntaxKind.IndexSignature:
                    return emitIndexSignature((<ts.IndexSignatureDeclaration>node));
                // Types
                case ts.SyntaxKind.TypePredicate:
                    return emitTypePredicate((<ts.TypePredicateNode>node));
                case ts.SyntaxKind.TypeReference:
                    return emitTypeReference((<ts.TypeReferenceNode>node));
                case ts.SyntaxKind.FunctionType:
                    return emitFunctionType((<ts.FunctionTypeNode>node));
                case ts.SyntaxKind.JSDocFunctionType:
                    return emitJSDocFunctionType((node as ts.JSDocFunctionType));
                case ts.SyntaxKind.ConstructorType:
                    return emitConstructorType((<ts.ConstructorTypeNode>node));
                case ts.SyntaxKind.TypeQuery:
                    return emitTypeQuery((<ts.TypeQueryNode>node));
                case ts.SyntaxKind.TypeLiteral:
                    return emitTypeLiteral((<ts.TypeLiteralNode>node));
                case ts.SyntaxKind.ArrayType:
                    return emitArrayType((<ts.ArrayTypeNode>node));
                case ts.SyntaxKind.TupleType:
                    return emitTupleType((<ts.TupleTypeNode>node));
                case ts.SyntaxKind.OptionalType:
                    return emitOptionalType((<ts.OptionalTypeNode>node));
                case ts.SyntaxKind.UnionType:
                    return emitUnionType((<ts.UnionTypeNode>node));
                case ts.SyntaxKind.IntersectionType:
                    return emitIntersectionType((<ts.IntersectionTypeNode>node));
                case ts.SyntaxKind.ConditionalType:
                    return emitConditionalType((<ts.ConditionalTypeNode>node));
                case ts.SyntaxKind.InferType:
                    return emitInferType((<ts.InferTypeNode>node));
                case ts.SyntaxKind.ParenthesizedType:
                    return emitParenthesizedType((<ts.ParenthesizedTypeNode>node));
                case ts.SyntaxKind.ExpressionWithTypeArguments:
                    return emitExpressionWithTypeArguments((<ts.ExpressionWithTypeArguments>node));
                case ts.SyntaxKind.ThisType:
                    return emitThisType();
                case ts.SyntaxKind.TypeOperator:
                    return emitTypeOperator((<ts.TypeOperatorNode>node));
                case ts.SyntaxKind.IndexedAccessType:
                    return emitIndexedAccessType((<ts.IndexedAccessTypeNode>node));
                case ts.SyntaxKind.MappedType:
                    return emitMappedType((<ts.MappedTypeNode>node));
                case ts.SyntaxKind.LiteralType:
                    return emitLiteralType((<ts.LiteralTypeNode>node));
                case ts.SyntaxKind.ImportType:
                    return emitImportTypeNode((<ts.ImportTypeNode>node));
                case ts.SyntaxKind.JSDocAllType:
                    writePunctuation("*");
                    return;
                case ts.SyntaxKind.JSDocUnknownType:
                    writePunctuation("?");
                    return;
                case ts.SyntaxKind.JSDocNullableType:
                    return emitJSDocNullableType((node as ts.JSDocNullableType));
                case ts.SyntaxKind.JSDocNonNullableType:
                    return emitJSDocNonNullableType((node as ts.JSDocNonNullableType));
                case ts.SyntaxKind.JSDocOptionalType:
                    return emitJSDocOptionalType((node as ts.JSDocOptionalType));
                case ts.SyntaxKind.RestType:
                case ts.SyntaxKind.JSDocVariadicType:
                    return emitRestOrJSDocVariadicType((node as ts.RestTypeNode | ts.JSDocVariadicType));
                // Binding patterns
                case ts.SyntaxKind.ObjectBindingPattern:
                    return emitObjectBindingPattern((<ts.ObjectBindingPattern>node));
                case ts.SyntaxKind.ArrayBindingPattern:
                    return emitArrayBindingPattern((<ts.ArrayBindingPattern>node));
                case ts.SyntaxKind.BindingElement:
                    return emitBindingElement((<ts.BindingElement>node));
                // Misc
                case ts.SyntaxKind.TemplateSpan:
                    return emitTemplateSpan((<ts.TemplateSpan>node));
                case ts.SyntaxKind.SemicolonClassElement:
                    return emitSemicolonClassElement();
                // Statements
                case ts.SyntaxKind.Block:
                    return emitBlock((<ts.Block>node));
                case ts.SyntaxKind.VariableStatement:
                    return emitVariableStatement((<ts.VariableStatement>node));
                case ts.SyntaxKind.EmptyStatement:
                    return emitEmptyStatement(/*isEmbeddedStatement*/ false);
                case ts.SyntaxKind.ExpressionStatement:
                    return emitExpressionStatement((<ts.ExpressionStatement>node));
                case ts.SyntaxKind.IfStatement:
                    return emitIfStatement((<ts.IfStatement>node));
                case ts.SyntaxKind.DoStatement:
                    return emitDoStatement((<ts.DoStatement>node));
                case ts.SyntaxKind.WhileStatement:
                    return emitWhileStatement((<ts.WhileStatement>node));
                case ts.SyntaxKind.ForStatement:
                    return emitForStatement((<ts.ForStatement>node));
                case ts.SyntaxKind.ForInStatement:
                    return emitForInStatement((<ts.ForInStatement>node));
                case ts.SyntaxKind.ForOfStatement:
                    return emitForOfStatement((<ts.ForOfStatement>node));
                case ts.SyntaxKind.ContinueStatement:
                    return emitContinueStatement((<ts.ContinueStatement>node));
                case ts.SyntaxKind.BreakStatement:
                    return emitBreakStatement((<ts.BreakStatement>node));
                case ts.SyntaxKind.ReturnStatement:
                    return emitReturnStatement((<ts.ReturnStatement>node));
                case ts.SyntaxKind.WithStatement:
                    return emitWithStatement((<ts.WithStatement>node));
                case ts.SyntaxKind.SwitchStatement:
                    return emitSwitchStatement((<ts.SwitchStatement>node));
                case ts.SyntaxKind.LabeledStatement:
                    return emitLabeledStatement((<ts.LabeledStatement>node));
                case ts.SyntaxKind.ThrowStatement:
                    return emitThrowStatement((<ts.ThrowStatement>node));
                case ts.SyntaxKind.TryStatement:
                    return emitTryStatement((<ts.TryStatement>node));
                case ts.SyntaxKind.DebuggerStatement:
                    return emitDebuggerStatement((<ts.DebuggerStatement>node));
                // Declarations
                case ts.SyntaxKind.VariableDeclaration:
                    return emitVariableDeclaration((<ts.VariableDeclaration>node));
                case ts.SyntaxKind.VariableDeclarationList:
                    return emitVariableDeclarationList((<ts.VariableDeclarationList>node));
                case ts.SyntaxKind.FunctionDeclaration:
                    return emitFunctionDeclaration((<ts.FunctionDeclaration>node));
                case ts.SyntaxKind.ClassDeclaration:
                    return emitClassDeclaration((<ts.ClassDeclaration>node));
                case ts.SyntaxKind.InterfaceDeclaration:
                    return emitInterfaceDeclaration((<ts.InterfaceDeclaration>node));
                case ts.SyntaxKind.TypeAliasDeclaration:
                    return emitTypeAliasDeclaration((<ts.TypeAliasDeclaration>node));
                case ts.SyntaxKind.EnumDeclaration:
                    return emitEnumDeclaration((<ts.EnumDeclaration>node));
                case ts.SyntaxKind.ModuleDeclaration:
                    return emitModuleDeclaration((<ts.ModuleDeclaration>node));
                case ts.SyntaxKind.ModuleBlock:
                    return emitModuleBlock((<ts.ModuleBlock>node));
                case ts.SyntaxKind.CaseBlock:
                    return emitCaseBlock((<ts.CaseBlock>node));
                case ts.SyntaxKind.NamespaceExportDeclaration:
                    return emitNamespaceExportDeclaration((<ts.NamespaceExportDeclaration>node));
                case ts.SyntaxKind.ImportEqualsDeclaration:
                    return emitImportEqualsDeclaration((<ts.ImportEqualsDeclaration>node));
                case ts.SyntaxKind.ImportDeclaration:
                    return emitImportDeclaration((<ts.ImportDeclaration>node));
                case ts.SyntaxKind.ImportClause:
                    return emitImportClause((<ts.ImportClause>node));
                case ts.SyntaxKind.NamespaceImport:
                    return emitNamespaceImport((<ts.NamespaceImport>node));
                case ts.SyntaxKind.NamedImports:
                    return emitNamedImports((<ts.NamedImports>node));
                case ts.SyntaxKind.ImportSpecifier:
                    return emitImportSpecifier((<ts.ImportSpecifier>node));
                case ts.SyntaxKind.ExportAssignment:
                    return emitExportAssignment((<ts.ExportAssignment>node));
                case ts.SyntaxKind.ExportDeclaration:
                    return emitExportDeclaration((<ts.ExportDeclaration>node));
                case ts.SyntaxKind.NamedExports:
                    return emitNamedExports((<ts.NamedExports>node));
                case ts.SyntaxKind.ExportSpecifier:
                    return emitExportSpecifier((<ts.ExportSpecifier>node));
                case ts.SyntaxKind.MissingDeclaration:
                    return;
                // Module references
                case ts.SyntaxKind.ExternalModuleReference:
                    return emitExternalModuleReference((<ts.ExternalModuleReference>node));
                // JSX (non-expression)
                case ts.SyntaxKind.JsxText:
                    return emitJsxText((<ts.JsxText>node));
                case ts.SyntaxKind.JsxOpeningElement:
                case ts.SyntaxKind.JsxOpeningFragment:
                    return emitJsxOpeningElementOrFragment((<ts.JsxOpeningElement>node));
                case ts.SyntaxKind.JsxClosingElement:
                case ts.SyntaxKind.JsxClosingFragment:
                    return emitJsxClosingElementOrFragment((<ts.JsxClosingElement>node));
                case ts.SyntaxKind.JsxAttribute:
                    return emitJsxAttribute((<ts.JsxAttribute>node));
                case ts.SyntaxKind.JsxAttributes:
                    return emitJsxAttributes((<ts.JsxAttributes>node));
                case ts.SyntaxKind.JsxSpreadAttribute:
                    return emitJsxSpreadAttribute((<ts.JsxSpreadAttribute>node));
                case ts.SyntaxKind.JsxExpression:
                    return emitJsxExpression((<ts.JsxExpression>node));
                // Clauses
                case ts.SyntaxKind.CaseClause:
                    return emitCaseClause((<ts.CaseClause>node));
                case ts.SyntaxKind.DefaultClause:
                    return emitDefaultClause((<ts.DefaultClause>node));
                case ts.SyntaxKind.HeritageClause:
                    return emitHeritageClause((<ts.HeritageClause>node));
                case ts.SyntaxKind.CatchClause:
                    return emitCatchClause((<ts.CatchClause>node));
                // Property assignments
                case ts.SyntaxKind.PropertyAssignment:
                    return emitPropertyAssignment((<ts.PropertyAssignment>node));
                case ts.SyntaxKind.ShorthandPropertyAssignment:
                    return emitShorthandPropertyAssignment((<ts.ShorthandPropertyAssignment>node));
                case ts.SyntaxKind.SpreadAssignment:
                    return emitSpreadAssignment((node as ts.SpreadAssignment));
                // Enum
                case ts.SyntaxKind.EnumMember:
                    return emitEnumMember((<ts.EnumMember>node));
                // JSDoc nodes (only used in codefixes currently)
                case ts.SyntaxKind.JSDocParameterTag:
                case ts.SyntaxKind.JSDocPropertyTag:
                    return emitJSDocPropertyLikeTag((node as ts.JSDocPropertyLikeTag));
                case ts.SyntaxKind.JSDocReturnTag:
                case ts.SyntaxKind.JSDocTypeTag:
                case ts.SyntaxKind.JSDocThisTag:
                case ts.SyntaxKind.JSDocEnumTag:
                    return emitJSDocSimpleTypedTag((node as ts.JSDocTypeTag));
                case ts.SyntaxKind.JSDocAugmentsTag:
                    return emitJSDocAugmentsTag((node as ts.JSDocAugmentsTag));
                case ts.SyntaxKind.JSDocTemplateTag:
                    return emitJSDocTemplateTag((node as ts.JSDocTemplateTag));
                case ts.SyntaxKind.JSDocTypedefTag:
                    return emitJSDocTypedefTag((node as ts.JSDocTypedefTag));
                case ts.SyntaxKind.JSDocCallbackTag:
                    return emitJSDocCallbackTag((node as ts.JSDocCallbackTag));
                case ts.SyntaxKind.JSDocSignature:
                    return emitJSDocSignature((node as ts.JSDocSignature));
                case ts.SyntaxKind.JSDocTypeLiteral:
                    return emitJSDocTypeLiteral((node as ts.JSDocTypeLiteral));
                case ts.SyntaxKind.JSDocClassTag:
                case ts.SyntaxKind.JSDocTag:
                    return emitJSDocSimpleTag((node as ts.JSDocTag));
                case ts.SyntaxKind.JSDocComment:
                    return emitJSDoc((node as ts.JSDoc));
                // Transformation nodes (ignored)
            }
            if (ts.isExpression(node)) {
                hint = ts.EmitHint.Expression;
                if (substituteNode !== ts.noEmitSubstitution) {
                    lastSubstitution = node = substituteNode(hint, node);
                }
            }
            else if (ts.isToken(node)) {
                return writeTokenNode(node, writePunctuation);
            }
        }
        if (hint === ts.EmitHint.Expression) {
            switch (node.kind) {
                // Literals
                case ts.SyntaxKind.NumericLiteral:
                case ts.SyntaxKind.BigIntLiteral:
                    return emitNumericOrBigIntLiteral((<ts.NumericLiteral | ts.BigIntLiteral>node));
                case ts.SyntaxKind.StringLiteral:
                case ts.SyntaxKind.RegularExpressionLiteral:
                case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
                    return emitLiteral((<ts.LiteralExpression>node));
                // Identifiers
                case ts.SyntaxKind.Identifier:
                    return emitIdentifier((<ts.Identifier>node));
                // Reserved words
                case ts.SyntaxKind.FalseKeyword:
                case ts.SyntaxKind.NullKeyword:
                case ts.SyntaxKind.SuperKeyword:
                case ts.SyntaxKind.TrueKeyword:
                case ts.SyntaxKind.ThisKeyword:
                case ts.SyntaxKind.ImportKeyword:
                    writeTokenNode(node, writeKeyword);
                    return;
                // Expressions
                case ts.SyntaxKind.ArrayLiteralExpression:
                    return emitArrayLiteralExpression((<ts.ArrayLiteralExpression>node));
                case ts.SyntaxKind.ObjectLiteralExpression:
                    return emitObjectLiteralExpression((<ts.ObjectLiteralExpression>node));
                case ts.SyntaxKind.PropertyAccessExpression:
                    return emitPropertyAccessExpression((<ts.PropertyAccessExpression>node));
                case ts.SyntaxKind.ElementAccessExpression:
                    return emitElementAccessExpression((<ts.ElementAccessExpression>node));
                case ts.SyntaxKind.CallExpression:
                    return emitCallExpression((<ts.CallExpression>node));
                case ts.SyntaxKind.NewExpression:
                    return emitNewExpression((<ts.NewExpression>node));
                case ts.SyntaxKind.TaggedTemplateExpression:
                    return emitTaggedTemplateExpression((<ts.TaggedTemplateExpression>node));
                case ts.SyntaxKind.TypeAssertionExpression:
                    return emitTypeAssertionExpression((<ts.TypeAssertion>node));
                case ts.SyntaxKind.ParenthesizedExpression:
                    return emitParenthesizedExpression((<ts.ParenthesizedExpression>node));
                case ts.SyntaxKind.FunctionExpression:
                    return emitFunctionExpression((<ts.FunctionExpression>node));
                case ts.SyntaxKind.ArrowFunction:
                    return emitArrowFunction((<ts.ArrowFunction>node));
                case ts.SyntaxKind.DeleteExpression:
                    return emitDeleteExpression((<ts.DeleteExpression>node));
                case ts.SyntaxKind.TypeOfExpression:
                    return emitTypeOfExpression((<ts.TypeOfExpression>node));
                case ts.SyntaxKind.VoidExpression:
                    return emitVoidExpression((<ts.VoidExpression>node));
                case ts.SyntaxKind.AwaitExpression:
                    return emitAwaitExpression((<ts.AwaitExpression>node));
                case ts.SyntaxKind.PrefixUnaryExpression:
                    return emitPrefixUnaryExpression((<ts.PrefixUnaryExpression>node));
                case ts.SyntaxKind.PostfixUnaryExpression:
                    return emitPostfixUnaryExpression((<ts.PostfixUnaryExpression>node));
                case ts.SyntaxKind.BinaryExpression:
                    return emitBinaryExpression((<ts.BinaryExpression>node));
                case ts.SyntaxKind.ConditionalExpression:
                    return emitConditionalExpression((<ts.ConditionalExpression>node));
                case ts.SyntaxKind.TemplateExpression:
                    return emitTemplateExpression((<ts.TemplateExpression>node));
                case ts.SyntaxKind.YieldExpression:
                    return emitYieldExpression((<ts.YieldExpression>node));
                case ts.SyntaxKind.SpreadElement:
                    return emitSpreadExpression((<ts.SpreadElement>node));
                case ts.SyntaxKind.ClassExpression:
                    return emitClassExpression((<ts.ClassExpression>node));
                case ts.SyntaxKind.OmittedExpression:
                    return;
                case ts.SyntaxKind.AsExpression:
                    return emitAsExpression((<ts.AsExpression>node));
                case ts.SyntaxKind.NonNullExpression:
                    return emitNonNullExpression((<ts.NonNullExpression>node));
                case ts.SyntaxKind.MetaProperty:
                    return emitMetaProperty((<ts.MetaProperty>node));
                // JSX
                case ts.SyntaxKind.JsxElement:
                    return emitJsxElement((<ts.JsxElement>node));
                case ts.SyntaxKind.JsxSelfClosingElement:
                    return emitJsxSelfClosingElement((<ts.JsxSelfClosingElement>node));
                case ts.SyntaxKind.JsxFragment:
                    return emitJsxFragment((<ts.JsxFragment>node));
                // Transformation nodes
                case ts.SyntaxKind.PartiallyEmittedExpression:
                    return emitPartiallyEmittedExpression((<ts.PartiallyEmittedExpression>node));
                case ts.SyntaxKind.CommaListExpression:
                    return emitCommaList((<ts.CommaListExpression>node));
            }
        }
    }
    function emitMappedTypeParameter(node: ts.TypeParameterDeclaration): void {
        emit(node.name);
        writeSpace();
        writeKeyword("in");
        writeSpace();
        emit(node.constraint);
    }
    function pipelineEmitWithSubstitution(hint: ts.EmitHint, node: ts.Node) {
        ts.Debug.assert(lastNode === node || lastSubstitution === node);
        const pipelinePhase = getNextPipelinePhase(PipelinePhase.Substitution, node);
        lastSubstitution = substituteNode(hint, node);
        pipelinePhase(hint, lastSubstitution);
        ts.Debug.assert(lastNode === node || lastSubstitution === node);
    }
    function getHelpersFromBundledSourceFiles(bundle: ts.Bundle): string[] | undefined {
        let result: string[] | undefined;
        if (moduleKind === ts.ModuleKind.None || printerOptions.noEmitHelpers) {
            return undefined;
        }
        const bundledHelpers = ts.createMap<boolean>();
        for (const sourceFile of bundle.sourceFiles) {
            const shouldSkip = ts.getExternalHelpersModuleName(sourceFile) !== undefined;
            const helpers = getSortedEmitHelpers(sourceFile);
            if (!helpers)
                continue;
            for (const helper of helpers) {
                if (!helper.scoped && !shouldSkip && !bundledHelpers.get(helper.name)) {
                    bundledHelpers.set(helper.name, true);
                    (result || (result = [])).push(helper.name);
                }
            }
        }
        return result;
    }
    function emitHelpers(node: ts.Node) {
        let helpersEmitted = false;
        const bundle = node.kind === ts.SyntaxKind.Bundle ? <ts.Bundle>node : undefined;
        if (bundle && moduleKind === ts.ModuleKind.None) {
            return;
        }
        const numPrepends = bundle ? bundle.prepends.length : 0;
        const numNodes = bundle ? bundle.sourceFiles.length + numPrepends : 1;
        for (let i = 0; i < numNodes; i++) {
            const currentNode = bundle ? i < numPrepends ? bundle.prepends[i] : bundle.sourceFiles[i - numPrepends] : node;
            const sourceFile = ts.isSourceFile(currentNode) ? currentNode : ts.isUnparsedSource(currentNode) ? undefined : currentSourceFile!;
            const shouldSkip = printerOptions.noEmitHelpers || (!!sourceFile && ts.hasRecordedExternalHelpers(sourceFile));
            const shouldBundle = (ts.isSourceFile(currentNode) || ts.isUnparsedSource(currentNode)) && !isOwnFileEmit;
            const helpers = ts.isUnparsedSource(currentNode) ? currentNode.helpers : getSortedEmitHelpers(currentNode);
            if (helpers) {
                for (const helper of helpers) {
                    if (!helper.scoped) {
                        // Skip the helper if it can be skipped and the noEmitHelpers compiler
                        // option is set, or if it can be imported and the importHelpers compiler
                        // option is set.
                        if (shouldSkip)
                            continue;
                        // Skip the helper if it can be bundled but hasn't already been emitted and we
                        // are emitting a bundled module.
                        if (shouldBundle) {
                            if (bundledHelpers.get(helper.name)) {
                                continue;
                            }
                            bundledHelpers.set(helper.name, true);
                        }
                    }
                    else if (bundle) {
                        // Skip the helper if it is scoped and we are emitting bundled helpers
                        continue;
                    }
                    const pos = getTextPosWithWriteLine();
                    if (typeof helper.text === "string") {
                        writeLines(helper.text);
                    }
                    else {
                        writeLines(helper.text(makeFileLevelOptimisticUniqueName));
                    }
                    if (bundleFileInfo)
                        bundleFileInfo.sections.push({ pos, end: writer.getTextPos(), kind: ts.BundleFileSectionKind.EmitHelpers, data: helper.name });
                    helpersEmitted = true;
                }
            }
        }
        return helpersEmitted;
    }
    function getSortedEmitHelpers(node: ts.Node) {
        const helpers = ts.getEmitHelpers(node);
        return helpers && ts.stableSort(helpers, ts.compareEmitHelpers);
    }
    //
    // Literals/Pseudo-literals
    //
    // SyntaxKind.NumericLiteral
    // SyntaxKind.BigIntLiteral
    function emitNumericOrBigIntLiteral(node: ts.NumericLiteral | ts.BigIntLiteral) {
        emitLiteral(node);
    }
    // SyntaxKind.StringLiteral
    // SyntaxKind.RegularExpressionLiteral
    // SyntaxKind.NoSubstitutionTemplateLiteral
    // SyntaxKind.TemplateHead
    // SyntaxKind.TemplateMiddle
    // SyntaxKind.TemplateTail
    function emitLiteral(node: ts.LiteralLikeNode) {
        const text = getLiteralTextOfNode(node, printerOptions.neverAsciiEscape);
        if ((printerOptions.sourceMap || printerOptions.inlineSourceMap)
            && (node.kind === ts.SyntaxKind.StringLiteral || ts.isTemplateLiteralKind(node.kind))) {
            writeLiteral(text);
        }
        else {
            // Quick info expects all literals to be called with writeStringLiteral, as there's no specific type for numberLiterals
            writeStringLiteral(text);
        }
    }
    // SyntaxKind.UnparsedSource
    // SyntaxKind.UnparsedPrepend
    function emitUnparsedSourceOrPrepend(unparsed: ts.UnparsedSource | ts.UnparsedPrepend) {
        for (const text of unparsed.texts) {
            writeLine();
            emit(text);
        }
    }
    // SyntaxKind.UnparsedPrologue
    // SyntaxKind.UnparsedText
    // SyntaxKind.UnparsedInternal
    // SyntaxKind.UnparsedSyntheticReference
    function writeUnparsedNode(unparsed: ts.UnparsedNode) {
        writer.rawWrite(unparsed.parent.text.substring(unparsed.pos, unparsed.end));
    }
    // SyntaxKind.UnparsedText
    // SyntaxKind.UnparsedInternal
    function emitUnparsedTextLike(unparsed: ts.UnparsedTextLike) {
        const pos = getTextPosWithWriteLine();
        writeUnparsedNode(unparsed);
        if (bundleFileInfo) {
            updateOrPushBundleFileTextLike(pos, writer.getTextPos(), unparsed.kind === ts.SyntaxKind.UnparsedText ?
                ts.BundleFileSectionKind.Text :
                ts.BundleFileSectionKind.Internal);
        }
    }
    // SyntaxKind.UnparsedSyntheticReference
    function emitUnparsedSyntheticReference(unparsed: ts.UnparsedSyntheticReference) {
        const pos = getTextPosWithWriteLine();
        writeUnparsedNode(unparsed);
        if (bundleFileInfo) {
            const section = ts.clone(unparsed.section);
            section.pos = pos;
            section.end = writer.getTextPos();
            bundleFileInfo.sections.push(section);
        }
    }
    //
    // Identifiers
    //
    function emitIdentifier(node: ts.Identifier) {
        const writeText = node.symbol ? writeSymbol : write;
        writeText(getTextOfNode(node, /*includeTrivia*/ false), node.symbol);
        emitList(node, node.typeArguments, ts.ListFormat.TypeParameters); // Call emitList directly since it could be an array of TypeParameterDeclarations _or_ type arguments
    }
    //
    // Names
    //
    function emitQualifiedName(node: ts.QualifiedName) {
        emitEntityName(node.left);
        writePunctuation(".");
        emit(node.right);
    }
    function emitEntityName(node: ts.EntityName) {
        if (node.kind === ts.SyntaxKind.Identifier) {
            emitExpression(node);
        }
        else {
            emit(node);
        }
    }
    function emitComputedPropertyName(node: ts.ComputedPropertyName) {
        writePunctuation("[");
        emitExpression(node.expression);
        writePunctuation("]");
    }
    //
    // Signature elements
    //
    function emitTypeParameter(node: ts.TypeParameterDeclaration) {
        emit(node.name);
        if (node.constraint) {
            writeSpace();
            writeKeyword("extends");
            writeSpace();
            emit(node.constraint);
        }
        if (node.default) {
            writeSpace();
            writeOperator("=");
            writeSpace();
            emit(node.default);
        }
    }
    function emitParameter(node: ts.ParameterDeclaration) {
        emitDecorators(node, node.decorators);
        emitModifiers(node, node.modifiers);
        emit(node.dotDotDotToken);
        emitNodeWithWriter(node.name, writeParameter);
        emit(node.questionToken);
        if (node.parent && node.parent.kind === ts.SyntaxKind.JSDocFunctionType && !node.name) {
            emit(node.type);
        }
        else {
            emitTypeAnnotation(node.type);
        }
        // The comment position has to fallback to any present node within the parameterdeclaration because as it turns out, the parser can make parameter declarations with _just_ an initializer.
        emitInitializer(node.initializer, node.type ? node.type.end : node.questionToken ? node.questionToken.end : node.name ? node.name.end : node.modifiers ? node.modifiers.end : node.decorators ? node.decorators.end : node.pos, node);
    }
    function emitDecorator(decorator: ts.Decorator) {
        writePunctuation("@");
        emitExpression(decorator.expression);
    }
    //
    // Type members
    //
    function emitPropertySignature(node: ts.PropertySignature) {
        emitDecorators(node, node.decorators);
        emitModifiers(node, node.modifiers);
        emitNodeWithWriter(node.name, writeProperty);
        emit(node.questionToken);
        emitTypeAnnotation(node.type);
        writeTrailingSemicolon();
    }
    function emitPropertyDeclaration(node: ts.PropertyDeclaration) {
        emitDecorators(node, node.decorators);
        emitModifiers(node, node.modifiers);
        emit(node.name);
        emit(node.questionToken);
        emit(node.exclamationToken);
        emitTypeAnnotation(node.type);
        emitInitializer(node.initializer, node.type ? node.type.end : node.questionToken ? node.questionToken.end : node.name.end, node);
        writeTrailingSemicolon();
    }
    function emitMethodSignature(node: ts.MethodSignature) {
        pushNameGenerationScope(node);
        emitDecorators(node, node.decorators);
        emitModifiers(node, node.modifiers);
        emit(node.name);
        emit(node.questionToken);
        emitTypeParameters(node, node.typeParameters);
        emitParameters(node, node.parameters);
        emitTypeAnnotation(node.type);
        writeTrailingSemicolon();
        popNameGenerationScope(node);
    }
    function emitMethodDeclaration(node: ts.MethodDeclaration) {
        emitDecorators(node, node.decorators);
        emitModifiers(node, node.modifiers);
        emit(node.asteriskToken);
        emit(node.name);
        emit(node.questionToken);
        emitSignatureAndBody(node, emitSignatureHead);
    }
    function emitConstructor(node: ts.ConstructorDeclaration) {
        emitModifiers(node, node.modifiers);
        writeKeyword("constructor");
        emitSignatureAndBody(node, emitSignatureHead);
    }
    function emitAccessorDeclaration(node: ts.AccessorDeclaration) {
        emitDecorators(node, node.decorators);
        emitModifiers(node, node.modifiers);
        writeKeyword(node.kind === ts.SyntaxKind.GetAccessor ? "get" : "set");
        writeSpace();
        emit(node.name);
        emitSignatureAndBody(node, emitSignatureHead);
    }
    function emitCallSignature(node: ts.CallSignatureDeclaration) {
        pushNameGenerationScope(node);
        emitDecorators(node, node.decorators);
        emitModifiers(node, node.modifiers);
        emitTypeParameters(node, node.typeParameters);
        emitParameters(node, node.parameters);
        emitTypeAnnotation(node.type);
        writeTrailingSemicolon();
        popNameGenerationScope(node);
    }
    function emitConstructSignature(node: ts.ConstructSignatureDeclaration) {
        pushNameGenerationScope(node);
        emitDecorators(node, node.decorators);
        emitModifiers(node, node.modifiers);
        writeKeyword("new");
        writeSpace();
        emitTypeParameters(node, node.typeParameters);
        emitParameters(node, node.parameters);
        emitTypeAnnotation(node.type);
        writeTrailingSemicolon();
        popNameGenerationScope(node);
    }
    function emitIndexSignature(node: ts.IndexSignatureDeclaration) {
        emitDecorators(node, node.decorators);
        emitModifiers(node, node.modifiers);
        emitParametersForIndexSignature(node, node.parameters);
        emitTypeAnnotation(node.type);
        writeTrailingSemicolon();
    }
    function emitSemicolonClassElement() {
        writeTrailingSemicolon();
    }
    //
    // Types
    //
    function emitTypePredicate(node: ts.TypePredicateNode) {
        if (node.assertsModifier) {
            emit(node.assertsModifier);
            writeSpace();
        }
        emit(node.parameterName);
        if (node.type) {
            writeSpace();
            writeKeyword("is");
            writeSpace();
            emit(node.type);
        }
    }
    function emitTypeReference(node: ts.TypeReferenceNode) {
        emit(node.typeName);
        emitTypeArguments(node, node.typeArguments);
    }
    function emitFunctionType(node: ts.FunctionTypeNode) {
        pushNameGenerationScope(node);
        emitTypeParameters(node, node.typeParameters);
        emitParametersForArrow(node, node.parameters);
        writeSpace();
        writePunctuation("=>");
        writeSpace();
        emit(node.type);
        popNameGenerationScope(node);
    }
    function emitJSDocFunctionType(node: ts.JSDocFunctionType) {
        writeKeyword("function");
        emitParameters(node, node.parameters);
        writePunctuation(":");
        emit(node.type);
    }
    function emitJSDocNullableType(node: ts.JSDocNullableType) {
        writePunctuation("?");
        emit(node.type);
    }
    function emitJSDocNonNullableType(node: ts.JSDocNonNullableType) {
        writePunctuation("!");
        emit(node.type);
    }
    function emitJSDocOptionalType(node: ts.JSDocOptionalType) {
        emit(node.type);
        writePunctuation("=");
    }
    function emitConstructorType(node: ts.ConstructorTypeNode) {
        pushNameGenerationScope(node);
        writeKeyword("new");
        writeSpace();
        emitTypeParameters(node, node.typeParameters);
        emitParameters(node, node.parameters);
        writeSpace();
        writePunctuation("=>");
        writeSpace();
        emit(node.type);
        popNameGenerationScope(node);
    }
    function emitTypeQuery(node: ts.TypeQueryNode) {
        writeKeyword("typeof");
        writeSpace();
        emit(node.exprName);
    }
    function emitTypeLiteral(node: ts.TypeLiteralNode) {
        writePunctuation("{");
        const flags = ts.getEmitFlags(node) & ts.EmitFlags.SingleLine ? ts.ListFormat.SingleLineTypeLiteralMembers : ts.ListFormat.MultiLineTypeLiteralMembers;
        emitList(node, node.members, flags | ts.ListFormat.NoSpaceIfEmpty);
        writePunctuation("}");
    }
    function emitArrayType(node: ts.ArrayTypeNode) {
        emit(node.elementType);
        writePunctuation("[");
        writePunctuation("]");
    }
    function emitRestOrJSDocVariadicType(node: ts.RestTypeNode | ts.JSDocVariadicType) {
        writePunctuation("...");
        emit(node.type);
    }
    function emitTupleType(node: ts.TupleTypeNode) {
        writePunctuation("[");
        emitList(node, node.elementTypes, ts.ListFormat.TupleTypeElements);
        writePunctuation("]");
    }
    function emitOptionalType(node: ts.OptionalTypeNode) {
        emit(node.type);
        writePunctuation("?");
    }
    function emitUnionType(node: ts.UnionTypeNode) {
        emitList(node, node.types, ts.ListFormat.UnionTypeConstituents);
    }
    function emitIntersectionType(node: ts.IntersectionTypeNode) {
        emitList(node, node.types, ts.ListFormat.IntersectionTypeConstituents);
    }
    function emitConditionalType(node: ts.ConditionalTypeNode) {
        emit(node.checkType);
        writeSpace();
        writeKeyword("extends");
        writeSpace();
        emit(node.extendsType);
        writeSpace();
        writePunctuation("?");
        writeSpace();
        emit(node.trueType);
        writeSpace();
        writePunctuation(":");
        writeSpace();
        emit(node.falseType);
    }
    function emitInferType(node: ts.InferTypeNode) {
        writeKeyword("infer");
        writeSpace();
        emit(node.typeParameter);
    }
    function emitParenthesizedType(node: ts.ParenthesizedTypeNode) {
        writePunctuation("(");
        emit(node.type);
        writePunctuation(")");
    }
    function emitThisType() {
        writeKeyword("this");
    }
    function emitTypeOperator(node: ts.TypeOperatorNode) {
        writeTokenText(node.operator, writeKeyword);
        writeSpace();
        emit(node.type);
    }
    function emitIndexedAccessType(node: ts.IndexedAccessTypeNode) {
        emit(node.objectType);
        writePunctuation("[");
        emit(node.indexType);
        writePunctuation("]");
    }
    function emitMappedType(node: ts.MappedTypeNode) {
        const emitFlags = ts.getEmitFlags(node);
        writePunctuation("{");
        if (emitFlags & ts.EmitFlags.SingleLine) {
            writeSpace();
        }
        else {
            writeLine();
            increaseIndent();
        }
        if (node.readonlyToken) {
            emit(node.readonlyToken);
            if (node.readonlyToken.kind !== ts.SyntaxKind.ReadonlyKeyword) {
                writeKeyword("readonly");
            }
            writeSpace();
        }
        writePunctuation("[");
        pipelineEmit(ts.EmitHint.MappedTypeParameter, node.typeParameter);
        writePunctuation("]");
        if (node.questionToken) {
            emit(node.questionToken);
            if (node.questionToken.kind !== ts.SyntaxKind.QuestionToken) {
                writePunctuation("?");
            }
        }
        writePunctuation(":");
        writeSpace();
        emit(node.type);
        writeTrailingSemicolon();
        if (emitFlags & ts.EmitFlags.SingleLine) {
            writeSpace();
        }
        else {
            writeLine();
            decreaseIndent();
        }
        writePunctuation("}");
    }
    function emitLiteralType(node: ts.LiteralTypeNode) {
        emitExpression(node.literal);
    }
    function emitImportTypeNode(node: ts.ImportTypeNode) {
        if (node.isTypeOf) {
            writeKeyword("typeof");
            writeSpace();
        }
        writeKeyword("import");
        writePunctuation("(");
        emit(node.argument);
        writePunctuation(")");
        if (node.qualifier) {
            writePunctuation(".");
            emit(node.qualifier);
        }
        emitTypeArguments(node, node.typeArguments);
    }
    //
    // Binding patterns
    //
    function emitObjectBindingPattern(node: ts.ObjectBindingPattern) {
        writePunctuation("{");
        emitList(node, node.elements, ts.ListFormat.ObjectBindingPatternElements);
        writePunctuation("}");
    }
    function emitArrayBindingPattern(node: ts.ArrayBindingPattern) {
        writePunctuation("[");
        emitList(node, node.elements, ts.ListFormat.ArrayBindingPatternElements);
        writePunctuation("]");
    }
    function emitBindingElement(node: ts.BindingElement) {
        emit(node.dotDotDotToken);
        if (node.propertyName) {
            emit(node.propertyName);
            writePunctuation(":");
            writeSpace();
        }
        emit(node.name);
        emitInitializer(node.initializer, node.name.end, node);
    }
    //
    // Expressions
    //
    function emitArrayLiteralExpression(node: ts.ArrayLiteralExpression) {
        const elements = node.elements;
        const preferNewLine = node.multiLine ? ts.ListFormat.PreferNewLine : ts.ListFormat.None;
        emitExpressionList(node, elements, ts.ListFormat.ArrayLiteralExpressionElements | preferNewLine);
    }
    function emitObjectLiteralExpression(node: ts.ObjectLiteralExpression) {
        ts.forEach(node.properties, generateMemberNames);
        const indentedFlag = ts.getEmitFlags(node) & ts.EmitFlags.Indented;
        if (indentedFlag) {
            increaseIndent();
        }
        const preferNewLine = node.multiLine ? ts.ListFormat.PreferNewLine : ts.ListFormat.None;
        const allowTrailingComma = currentSourceFile!.languageVersion >= ts.ScriptTarget.ES5 && !ts.isJsonSourceFile((currentSourceFile!)) ? ts.ListFormat.AllowTrailingComma : ts.ListFormat.None;
        emitList(node, node.properties, ts.ListFormat.ObjectLiteralExpressionProperties | allowTrailingComma | preferNewLine);
        if (indentedFlag) {
            decreaseIndent();
        }
    }
    function emitPropertyAccessExpression(node: ts.PropertyAccessExpression) {
        const expression = ts.cast(emitExpression(node.expression), ts.isExpression);
        const token = ts.getDotOrQuestionDotToken(node);
        const indentBeforeDot = needsIndentation(node, node.expression, token);
        const indentAfterDot = needsIndentation(node, token, node.name);
        increaseIndentIf(indentBeforeDot, /*writeSpaceIfNotIndenting*/ false);
        const shouldEmitDotDot = token.kind !== ts.SyntaxKind.QuestionDotToken &&
            mayNeedDotDotForPropertyAccess(expression) &&
            !writer.hasTrailingComment() &&
            !writer.hasTrailingWhitespace();
        if (shouldEmitDotDot) {
            writePunctuation(".");
        }
        emitTokenWithComment(token.kind, node.expression.end, writePunctuation, node);
        increaseIndentIf(indentAfterDot, /*writeSpaceIfNotIndenting*/ false);
        emit(node.name);
        decreaseIndentIf(indentBeforeDot, indentAfterDot);
    }
    // 1..toString is a valid property access, emit a dot after the literal
    // Also emit a dot if expression is a integer const enum value - it will appear in generated code as numeric literal
    function mayNeedDotDotForPropertyAccess(expression: ts.Expression) {
        expression = ts.skipPartiallyEmittedExpressions(expression);
        if (ts.isNumericLiteral(expression)) {
            // check if numeric literal is a decimal literal that was originally written with a dot
            const text = getLiteralTextOfNode((<ts.LiteralExpression>expression), /*neverAsciiEscape*/ true);
            // If he number will be printed verbatim and it doesn't already contain a dot, add one
            // if the expression doesn't have any comments that will be emitted.
            return !expression.numericLiteralFlags && !ts.stringContains(text, (ts.tokenToString(ts.SyntaxKind.DotToken)!));
        }
        else if (ts.isAccessExpression(expression)) {
            // check if constant enum value is integer
            const constantValue = ts.getConstantValue(expression);
            // isFinite handles cases when constantValue is undefined
            return typeof constantValue === "number" && isFinite(constantValue)
                && Math.floor(constantValue) === constantValue;
        }
    }
    function emitElementAccessExpression(node: ts.ElementAccessExpression) {
        emitExpression(node.expression);
        emit(node.questionDotToken);
        emitTokenWithComment(ts.SyntaxKind.OpenBracketToken, node.expression.end, writePunctuation, node);
        emitExpression(node.argumentExpression);
        emitTokenWithComment(ts.SyntaxKind.CloseBracketToken, node.argumentExpression.end, writePunctuation, node);
    }
    function emitCallExpression(node: ts.CallExpression) {
        emitExpression(node.expression);
        emit(node.questionDotToken);
        emitTypeArguments(node, node.typeArguments);
        emitExpressionList(node, node.arguments, ts.ListFormat.CallExpressionArguments);
    }
    function emitNewExpression(node: ts.NewExpression) {
        emitTokenWithComment(ts.SyntaxKind.NewKeyword, node.pos, writeKeyword, node);
        writeSpace();
        emitExpression(node.expression);
        emitTypeArguments(node, node.typeArguments);
        emitExpressionList(node, node.arguments, ts.ListFormat.NewExpressionArguments);
    }
    function emitTaggedTemplateExpression(node: ts.TaggedTemplateExpression) {
        emitExpression(node.tag);
        emitTypeArguments(node, node.typeArguments);
        writeSpace();
        emitExpression(node.template);
    }
    function emitTypeAssertionExpression(node: ts.TypeAssertion) {
        writePunctuation("<");
        emit(node.type);
        writePunctuation(">");
        emitExpression(node.expression);
    }
    function emitParenthesizedExpression(node: ts.ParenthesizedExpression) {
        const openParenPos = emitTokenWithComment(ts.SyntaxKind.OpenParenToken, node.pos, writePunctuation, node);
        emitExpression(node.expression);
        emitTokenWithComment(ts.SyntaxKind.CloseParenToken, node.expression ? node.expression.end : openParenPos, writePunctuation, node);
    }
    function emitFunctionExpression(node: ts.FunctionExpression) {
        generateNameIfNeeded(node.name);
        emitFunctionDeclarationOrExpression(node);
    }
    function emitArrowFunction(node: ts.ArrowFunction) {
        emitDecorators(node, node.decorators);
        emitModifiers(node, node.modifiers);
        emitSignatureAndBody(node, emitArrowFunctionHead);
    }
    function emitArrowFunctionHead(node: ts.ArrowFunction) {
        emitTypeParameters(node, node.typeParameters);
        emitParametersForArrow(node, node.parameters);
        emitTypeAnnotation(node.type);
        writeSpace();
        emit(node.equalsGreaterThanToken);
    }
    function emitDeleteExpression(node: ts.DeleteExpression) {
        emitTokenWithComment(ts.SyntaxKind.DeleteKeyword, node.pos, writeKeyword, node);
        writeSpace();
        emitExpression(node.expression);
    }
    function emitTypeOfExpression(node: ts.TypeOfExpression) {
        emitTokenWithComment(ts.SyntaxKind.TypeOfKeyword, node.pos, writeKeyword, node);
        writeSpace();
        emitExpression(node.expression);
    }
    function emitVoidExpression(node: ts.VoidExpression) {
        emitTokenWithComment(ts.SyntaxKind.VoidKeyword, node.pos, writeKeyword, node);
        writeSpace();
        emitExpression(node.expression);
    }
    function emitAwaitExpression(node: ts.AwaitExpression) {
        emitTokenWithComment(ts.SyntaxKind.AwaitKeyword, node.pos, writeKeyword, node);
        writeSpace();
        emitExpression(node.expression);
    }
    function emitPrefixUnaryExpression(node: ts.PrefixUnaryExpression) {
        writeTokenText(node.operator, writeOperator);
        if (shouldEmitWhitespaceBeforeOperand(node)) {
            writeSpace();
        }
        emitExpression(node.operand);
    }
    function shouldEmitWhitespaceBeforeOperand(node: ts.PrefixUnaryExpression) {
        // In some cases, we need to emit a space between the operator and the operand. One obvious case
        // is when the operator is an identifier, like delete or typeof. We also need to do this for plus
        // and minus expressions in certain cases. Specifically, consider the following two cases (parens
        // are just for clarity of exposition, and not part of the source code):
        //
        //  (+(+1))
        //  (+(++1))
        //
        // We need to emit a space in both cases. In the first case, the absence of a space will make
        // the resulting expression a prefix increment operation. And in the second, it will make the resulting
        // expression a prefix increment whose operand is a plus expression - (++(+x))
        // The same is true of minus of course.
        const operand = node.operand;
        return operand.kind === ts.SyntaxKind.PrefixUnaryExpression
            && ((node.operator === ts.SyntaxKind.PlusToken && ((<ts.PrefixUnaryExpression>operand).operator === ts.SyntaxKind.PlusToken || (<ts.PrefixUnaryExpression>operand).operator === ts.SyntaxKind.PlusPlusToken))
                || (node.operator === ts.SyntaxKind.MinusToken && ((<ts.PrefixUnaryExpression>operand).operator === ts.SyntaxKind.MinusToken || (<ts.PrefixUnaryExpression>operand).operator === ts.SyntaxKind.MinusMinusToken)));
    }
    function emitPostfixUnaryExpression(node: ts.PostfixUnaryExpression) {
        emitExpression(node.operand);
        writeTokenText(node.operator, writeOperator);
    }
    function emitBinaryExpression(node: ts.BinaryExpression) {
        const isCommaOperator = node.operatorToken.kind !== ts.SyntaxKind.CommaToken;
        const indentBeforeOperator = needsIndentation(node, node.left, node.operatorToken);
        const indentAfterOperator = needsIndentation(node, node.operatorToken, node.right);
        emitExpression(node.left);
        increaseIndentIf(indentBeforeOperator, isCommaOperator);
        emitLeadingCommentsOfPosition(node.operatorToken.pos);
        writeTokenNode(node.operatorToken, node.operatorToken.kind === ts.SyntaxKind.InKeyword ? writeKeyword : writeOperator);
        emitTrailingCommentsOfPosition(node.operatorToken.end, /*prefixSpace*/ true); // Binary operators should have a space before the comment starts
        increaseIndentIf(indentAfterOperator, /*writeSpaceIfNotIndenting*/ true);
        emitExpression(node.right);
        decreaseIndentIf(indentBeforeOperator, indentAfterOperator);
    }
    function emitConditionalExpression(node: ts.ConditionalExpression) {
        const indentBeforeQuestion = needsIndentation(node, node.condition, node.questionToken);
        const indentAfterQuestion = needsIndentation(node, node.questionToken, node.whenTrue);
        const indentBeforeColon = needsIndentation(node, node.whenTrue, node.colonToken);
        const indentAfterColon = needsIndentation(node, node.colonToken, node.whenFalse);
        emitExpression(node.condition);
        increaseIndentIf(indentBeforeQuestion, /*writeSpaceIfNotIndenting*/ true);
        emit(node.questionToken);
        increaseIndentIf(indentAfterQuestion, /*writeSpaceIfNotIndenting*/ true);
        emitExpression(node.whenTrue);
        decreaseIndentIf(indentBeforeQuestion, indentAfterQuestion);
        increaseIndentIf(indentBeforeColon, /*writeSpaceIfNotIndenting*/ true);
        emit(node.colonToken);
        increaseIndentIf(indentAfterColon, /*writeSpaceIfNotIndenting*/ true);
        emitExpression(node.whenFalse);
        decreaseIndentIf(indentBeforeColon, indentAfterColon);
    }
    function emitTemplateExpression(node: ts.TemplateExpression) {
        emit(node.head);
        emitList(node, node.templateSpans, ts.ListFormat.TemplateExpressionSpans);
    }
    function emitYieldExpression(node: ts.YieldExpression) {
        emitTokenWithComment(ts.SyntaxKind.YieldKeyword, node.pos, writeKeyword, node);
        emit(node.asteriskToken);
        emitExpressionWithLeadingSpace(node.expression);
    }
    function emitSpreadExpression(node: ts.SpreadElement) {
        emitTokenWithComment(ts.SyntaxKind.DotDotDotToken, node.pos, writePunctuation, node);
        emitExpression(node.expression);
    }
    function emitClassExpression(node: ts.ClassExpression) {
        generateNameIfNeeded(node.name);
        emitClassDeclarationOrExpression(node);
    }
    function emitExpressionWithTypeArguments(node: ts.ExpressionWithTypeArguments) {
        emitExpression(node.expression);
        emitTypeArguments(node, node.typeArguments);
    }
    function emitAsExpression(node: ts.AsExpression) {
        emitExpression(node.expression);
        if (node.type) {
            writeSpace();
            writeKeyword("as");
            writeSpace();
            emit(node.type);
        }
    }
    function emitNonNullExpression(node: ts.NonNullExpression) {
        emitExpression(node.expression);
        writeOperator("!");
    }
    function emitMetaProperty(node: ts.MetaProperty) {
        writeToken(node.keywordToken, node.pos, writePunctuation);
        writePunctuation(".");
        emit(node.name);
    }
    //
    // Misc
    //
    function emitTemplateSpan(node: ts.TemplateSpan) {
        emitExpression(node.expression);
        emit(node.literal);
    }
    //
    // Statements
    //
    function emitBlock(node: ts.Block) {
        emitBlockStatements(node, /*forceSingleLine*/ !node.multiLine && isEmptyBlock(node));
    }
    function emitBlockStatements(node: ts.BlockLike, forceSingleLine: boolean) {
        emitTokenWithComment(ts.SyntaxKind.OpenBraceToken, node.pos, writePunctuation, /*contextNode*/ node);
        const format = forceSingleLine || ts.getEmitFlags(node) & ts.EmitFlags.SingleLine ? ts.ListFormat.SingleLineBlockStatements : ts.ListFormat.MultiLineBlockStatements;
        emitList(node, node.statements, format);
        emitTokenWithComment(ts.SyntaxKind.CloseBraceToken, node.statements.end, writePunctuation, /*contextNode*/ node, /*indentLeading*/ !!(format & ts.ListFormat.MultiLine));
    }
    function emitVariableStatement(node: ts.VariableStatement) {
        emitModifiers(node, node.modifiers);
        emit(node.declarationList);
        writeTrailingSemicolon();
    }
    function emitEmptyStatement(isEmbeddedStatement: boolean) {
        // While most trailing semicolons are possibly insignificant, an embedded "empty"
        // statement is significant and cannot be elided by a trailing-semicolon-omitting writer.
        if (isEmbeddedStatement) {
            writePunctuation(";");
        }
        else {
            writeTrailingSemicolon();
        }
    }
    function emitExpressionStatement(node: ts.ExpressionStatement) {
        emitExpression(node.expression);
        // Emit semicolon in non json files
        // or if json file that created synthesized expression(eg.define expression statement when --out and amd code generation)
        if (!ts.isJsonSourceFile((currentSourceFile!)) || ts.nodeIsSynthesized(node.expression)) {
            writeTrailingSemicolon();
        }
    }
    function emitIfStatement(node: ts.IfStatement) {
        const openParenPos = emitTokenWithComment(ts.SyntaxKind.IfKeyword, node.pos, writeKeyword, node);
        writeSpace();
        emitTokenWithComment(ts.SyntaxKind.OpenParenToken, openParenPos, writePunctuation, node);
        emitExpression(node.expression);
        emitTokenWithComment(ts.SyntaxKind.CloseParenToken, node.expression.end, writePunctuation, node);
        emitEmbeddedStatement(node, node.thenStatement);
        if (node.elseStatement) {
            writeLineOrSpace(node);
            emitTokenWithComment(ts.SyntaxKind.ElseKeyword, node.thenStatement.end, writeKeyword, node);
            if (node.elseStatement.kind === ts.SyntaxKind.IfStatement) {
                writeSpace();
                emit(node.elseStatement);
            }
            else {
                emitEmbeddedStatement(node, node.elseStatement);
            }
        }
    }
    function emitWhileClause(node: ts.WhileStatement | ts.DoStatement, startPos: number) {
        const openParenPos = emitTokenWithComment(ts.SyntaxKind.WhileKeyword, startPos, writeKeyword, node);
        writeSpace();
        emitTokenWithComment(ts.SyntaxKind.OpenParenToken, openParenPos, writePunctuation, node);
        emitExpression(node.expression);
        emitTokenWithComment(ts.SyntaxKind.CloseParenToken, node.expression.end, writePunctuation, node);
    }
    function emitDoStatement(node: ts.DoStatement) {
        emitTokenWithComment(ts.SyntaxKind.DoKeyword, node.pos, writeKeyword, node);
        emitEmbeddedStatement(node, node.statement);
        if (ts.isBlock(node.statement)) {
            writeSpace();
        }
        else {
            writeLineOrSpace(node);
        }
        emitWhileClause(node, node.statement.end);
        writeTrailingSemicolon();
    }
    function emitWhileStatement(node: ts.WhileStatement) {
        emitWhileClause(node, node.pos);
        emitEmbeddedStatement(node, node.statement);
    }
    function emitForStatement(node: ts.ForStatement) {
        const openParenPos = emitTokenWithComment(ts.SyntaxKind.ForKeyword, node.pos, writeKeyword, node);
        writeSpace();
        let pos = emitTokenWithComment(ts.SyntaxKind.OpenParenToken, openParenPos, writePunctuation, /*contextNode*/ node);
        emitForBinding(node.initializer);
        pos = emitTokenWithComment(ts.SyntaxKind.SemicolonToken, node.initializer ? node.initializer.end : pos, writePunctuation, node);
        emitExpressionWithLeadingSpace(node.condition);
        pos = emitTokenWithComment(ts.SyntaxKind.SemicolonToken, node.condition ? node.condition.end : pos, writePunctuation, node);
        emitExpressionWithLeadingSpace(node.incrementor);
        emitTokenWithComment(ts.SyntaxKind.CloseParenToken, node.incrementor ? node.incrementor.end : pos, writePunctuation, node);
        emitEmbeddedStatement(node, node.statement);
    }
    function emitForInStatement(node: ts.ForInStatement) {
        const openParenPos = emitTokenWithComment(ts.SyntaxKind.ForKeyword, node.pos, writeKeyword, node);
        writeSpace();
        emitTokenWithComment(ts.SyntaxKind.OpenParenToken, openParenPos, writePunctuation, node);
        emitForBinding(node.initializer);
        writeSpace();
        emitTokenWithComment(ts.SyntaxKind.InKeyword, node.initializer.end, writeKeyword, node);
        writeSpace();
        emitExpression(node.expression);
        emitTokenWithComment(ts.SyntaxKind.CloseParenToken, node.expression.end, writePunctuation, node);
        emitEmbeddedStatement(node, node.statement);
    }
    function emitForOfStatement(node: ts.ForOfStatement) {
        const openParenPos = emitTokenWithComment(ts.SyntaxKind.ForKeyword, node.pos, writeKeyword, node);
        writeSpace();
        emitWithTrailingSpace(node.awaitModifier);
        emitTokenWithComment(ts.SyntaxKind.OpenParenToken, openParenPos, writePunctuation, node);
        emitForBinding(node.initializer);
        writeSpace();
        emitTokenWithComment(ts.SyntaxKind.OfKeyword, node.initializer.end, writeKeyword, node);
        writeSpace();
        emitExpression(node.expression);
        emitTokenWithComment(ts.SyntaxKind.CloseParenToken, node.expression.end, writePunctuation, node);
        emitEmbeddedStatement(node, node.statement);
    }
    function emitForBinding(node: ts.VariableDeclarationList | ts.Expression | undefined) {
        if (node !== undefined) {
            if (node.kind === ts.SyntaxKind.VariableDeclarationList) {
                emit(node);
            }
            else {
                emitExpression(node);
            }
        }
    }
    function emitContinueStatement(node: ts.ContinueStatement) {
        emitTokenWithComment(ts.SyntaxKind.ContinueKeyword, node.pos, writeKeyword, node);
        emitWithLeadingSpace(node.label);
        writeTrailingSemicolon();
    }
    function emitBreakStatement(node: ts.BreakStatement) {
        emitTokenWithComment(ts.SyntaxKind.BreakKeyword, node.pos, writeKeyword, node);
        emitWithLeadingSpace(node.label);
        writeTrailingSemicolon();
    }
    function emitTokenWithComment(token: ts.SyntaxKind, pos: number, writer: (s: string) => void, contextNode: ts.Node, indentLeading?: boolean) {
        const node = ts.getParseTreeNode(contextNode);
        const isSimilarNode = node && node.kind === contextNode.kind;
        const startPos = pos;
        if (isSimilarNode) {
            pos = ts.skipTrivia(currentSourceFile!.text, pos);
        }
        if (emitLeadingCommentsOfPosition && isSimilarNode && contextNode.pos !== startPos) {
            const needsIndent = indentLeading && !ts.positionsAreOnSameLine(startPos, pos, (currentSourceFile!));
            if (needsIndent) {
                increaseIndent();
            }
            emitLeadingCommentsOfPosition(startPos);
            if (needsIndent) {
                decreaseIndent();
            }
        }
        pos = writeTokenText(token, writer, pos);
        if (emitTrailingCommentsOfPosition && isSimilarNode && contextNode.end !== pos) {
            emitTrailingCommentsOfPosition(pos, /*prefixSpace*/ true);
        }
        return pos;
    }
    function emitReturnStatement(node: ts.ReturnStatement) {
        emitTokenWithComment(ts.SyntaxKind.ReturnKeyword, node.pos, writeKeyword, /*contextNode*/ node);
        emitExpressionWithLeadingSpace(node.expression);
        writeTrailingSemicolon();
    }
    function emitWithStatement(node: ts.WithStatement) {
        const openParenPos = emitTokenWithComment(ts.SyntaxKind.WithKeyword, node.pos, writeKeyword, node);
        writeSpace();
        emitTokenWithComment(ts.SyntaxKind.OpenParenToken, openParenPos, writePunctuation, node);
        emitExpression(node.expression);
        emitTokenWithComment(ts.SyntaxKind.CloseParenToken, node.expression.end, writePunctuation, node);
        emitEmbeddedStatement(node, node.statement);
    }
    function emitSwitchStatement(node: ts.SwitchStatement) {
        const openParenPos = emitTokenWithComment(ts.SyntaxKind.SwitchKeyword, node.pos, writeKeyword, node);
        writeSpace();
        emitTokenWithComment(ts.SyntaxKind.OpenParenToken, openParenPos, writePunctuation, node);
        emitExpression(node.expression);
        emitTokenWithComment(ts.SyntaxKind.CloseParenToken, node.expression.end, writePunctuation, node);
        writeSpace();
        emit(node.caseBlock);
    }
    function emitLabeledStatement(node: ts.LabeledStatement) {
        emit(node.label);
        emitTokenWithComment(ts.SyntaxKind.ColonToken, node.label.end, writePunctuation, node);
        writeSpace();
        emit(node.statement);
    }
    function emitThrowStatement(node: ts.ThrowStatement) {
        emitTokenWithComment(ts.SyntaxKind.ThrowKeyword, node.pos, writeKeyword, node);
        emitExpressionWithLeadingSpace(node.expression);
        writeTrailingSemicolon();
    }
    function emitTryStatement(node: ts.TryStatement) {
        emitTokenWithComment(ts.SyntaxKind.TryKeyword, node.pos, writeKeyword, node);
        writeSpace();
        emit(node.tryBlock);
        if (node.catchClause) {
            writeLineOrSpace(node);
            emit(node.catchClause);
        }
        if (node.finallyBlock) {
            writeLineOrSpace(node);
            emitTokenWithComment(ts.SyntaxKind.FinallyKeyword, (node.catchClause || node.tryBlock).end, writeKeyword, node);
            writeSpace();
            emit(node.finallyBlock);
        }
    }
    function emitDebuggerStatement(node: ts.DebuggerStatement) {
        writeToken(ts.SyntaxKind.DebuggerKeyword, node.pos, writeKeyword);
        writeTrailingSemicolon();
    }
    //
    // Declarations
    //
    function emitVariableDeclaration(node: ts.VariableDeclaration) {
        emit(node.name);
        emit(node.exclamationToken);
        emitTypeAnnotation(node.type);
        emitInitializer(node.initializer, node.type ? node.type.end : node.name.end, node);
    }
    function emitVariableDeclarationList(node: ts.VariableDeclarationList) {
        writeKeyword(ts.isLet(node) ? "let" : ts.isVarConst(node) ? "const" : "var");
        writeSpace();
        emitList(node, node.declarations, ts.ListFormat.VariableDeclarationList);
    }
    function emitFunctionDeclaration(node: ts.FunctionDeclaration) {
        emitFunctionDeclarationOrExpression(node);
    }
    function emitFunctionDeclarationOrExpression(node: ts.FunctionDeclaration | ts.FunctionExpression) {
        emitDecorators(node, node.decorators);
        emitModifiers(node, node.modifiers);
        writeKeyword("function");
        emit(node.asteriskToken);
        writeSpace();
        emitIdentifierName(node.name);
        emitSignatureAndBody(node, emitSignatureHead);
    }
    function emitBlockCallback(_hint: ts.EmitHint, body: ts.Node): void {
        emitBlockFunctionBody((<ts.Block>body));
    }
    function emitSignatureAndBody(node: ts.FunctionLikeDeclaration, emitSignatureHead: (node: ts.SignatureDeclaration) => void) {
        const body = node.body;
        if (body) {
            if (ts.isBlock(body)) {
                const indentedFlag = ts.getEmitFlags(node) & ts.EmitFlags.Indented;
                if (indentedFlag) {
                    increaseIndent();
                }
                pushNameGenerationScope(node);
                ts.forEach(node.parameters, generateNames);
                generateNames(node.body);
                emitSignatureHead(node);
                if (onEmitNode) {
                    onEmitNode(ts.EmitHint.Unspecified, body, emitBlockCallback);
                }
                else {
                    emitBlockFunctionBody(body);
                }
                popNameGenerationScope(node);
                if (indentedFlag) {
                    decreaseIndent();
                }
            }
            else {
                emitSignatureHead(node);
                writeSpace();
                emitExpression(body);
            }
        }
        else {
            emitSignatureHead(node);
            writeTrailingSemicolon();
        }
    }
    function emitSignatureHead(node: ts.FunctionDeclaration | ts.FunctionExpression | ts.MethodDeclaration | ts.AccessorDeclaration | ts.ConstructorDeclaration) {
        emitTypeParameters(node, node.typeParameters);
        emitParameters(node, node.parameters);
        emitTypeAnnotation(node.type);
    }
    function shouldEmitBlockFunctionBodyOnSingleLine(body: ts.Block) {
        // We must emit a function body as a single-line body in the following case:
        // * The body has NodeEmitFlags.SingleLine specified.
        // We must emit a function body as a multi-line body in the following cases:
        // * The body is explicitly marked as multi-line.
        // * A non-synthesized body's start and end position are on different lines.
        // * Any statement in the body starts on a new line.
        if (ts.getEmitFlags(body) & ts.EmitFlags.SingleLine) {
            return true;
        }
        if (body.multiLine) {
            return false;
        }
        if (!ts.nodeIsSynthesized(body) && !ts.rangeIsOnSingleLine(body, (currentSourceFile!))) {
            return false;
        }
        if (shouldWriteLeadingLineTerminator(body, body.statements, ts.ListFormat.PreserveLines)
            || shouldWriteClosingLineTerminator(body, body.statements, ts.ListFormat.PreserveLines)) {
            return false;
        }
        let previousStatement: ts.Statement | undefined;
        for (const statement of body.statements) {
            if (shouldWriteSeparatingLineTerminator(previousStatement, statement, ts.ListFormat.PreserveLines)) {
                return false;
            }
            previousStatement = statement;
        }
        return true;
    }
    function emitBlockFunctionBody(body: ts.Block) {
        writeSpace();
        writePunctuation("{");
        increaseIndent();
        const emitBlockFunctionBody = shouldEmitBlockFunctionBodyOnSingleLine(body)
            ? emitBlockFunctionBodyOnSingleLine
            : emitBlockFunctionBodyWorker;
        if (emitBodyWithDetachedComments) {
            emitBodyWithDetachedComments(body, body.statements, emitBlockFunctionBody);
        }
        else {
            emitBlockFunctionBody(body);
        }
        decreaseIndent();
        writeToken(ts.SyntaxKind.CloseBraceToken, body.statements.end, writePunctuation, body);
    }
    function emitBlockFunctionBodyOnSingleLine(body: ts.Block) {
        emitBlockFunctionBodyWorker(body, /*emitBlockFunctionBodyOnSingleLine*/ true);
    }
    function emitBlockFunctionBodyWorker(body: ts.Block, emitBlockFunctionBodyOnSingleLine?: boolean) {
        // Emit all the prologue directives (like "use strict").
        const statementOffset = emitPrologueDirectives(body.statements);
        const pos = writer.getTextPos();
        emitHelpers(body);
        if (statementOffset === 0 && pos === writer.getTextPos() && emitBlockFunctionBodyOnSingleLine) {
            decreaseIndent();
            emitList(body, body.statements, ts.ListFormat.SingleLineFunctionBodyStatements);
            increaseIndent();
        }
        else {
            emitList(body, body.statements, ts.ListFormat.MultiLineFunctionBodyStatements, statementOffset);
        }
    }
    function emitClassDeclaration(node: ts.ClassDeclaration) {
        emitClassDeclarationOrExpression(node);
    }
    function emitClassDeclarationOrExpression(node: ts.ClassDeclaration | ts.ClassExpression) {
        ts.forEach(node.members, generateMemberNames);
        emitDecorators(node, node.decorators);
        emitModifiers(node, node.modifiers);
        writeKeyword("class");
        if (node.name) {
            writeSpace();
            emitIdentifierName(node.name);
        }
        const indentedFlag = ts.getEmitFlags(node) & ts.EmitFlags.Indented;
        if (indentedFlag) {
            increaseIndent();
        }
        emitTypeParameters(node, node.typeParameters);
        emitList(node, node.heritageClauses, ts.ListFormat.ClassHeritageClauses);
        writeSpace();
        writePunctuation("{");
        emitList(node, node.members, ts.ListFormat.ClassMembers);
        writePunctuation("}");
        if (indentedFlag) {
            decreaseIndent();
        }
    }
    function emitInterfaceDeclaration(node: ts.InterfaceDeclaration) {
        emitDecorators(node, node.decorators);
        emitModifiers(node, node.modifiers);
        writeKeyword("interface");
        writeSpace();
        emit(node.name);
        emitTypeParameters(node, node.typeParameters);
        emitList(node, node.heritageClauses, ts.ListFormat.HeritageClauses);
        writeSpace();
        writePunctuation("{");
        emitList(node, node.members, ts.ListFormat.InterfaceMembers);
        writePunctuation("}");
    }
    function emitTypeAliasDeclaration(node: ts.TypeAliasDeclaration) {
        emitDecorators(node, node.decorators);
        emitModifiers(node, node.modifiers);
        writeKeyword("type");
        writeSpace();
        emit(node.name);
        emitTypeParameters(node, node.typeParameters);
        writeSpace();
        writePunctuation("=");
        writeSpace();
        emit(node.type);
        writeTrailingSemicolon();
    }
    function emitEnumDeclaration(node: ts.EnumDeclaration) {
        emitModifiers(node, node.modifiers);
        writeKeyword("enum");
        writeSpace();
        emit(node.name);
        writeSpace();
        writePunctuation("{");
        emitList(node, node.members, ts.ListFormat.EnumMembers);
        writePunctuation("}");
    }
    function emitModuleDeclaration(node: ts.ModuleDeclaration) {
        emitModifiers(node, node.modifiers);
        if (~node.flags & ts.NodeFlags.GlobalAugmentation) {
            writeKeyword(node.flags & ts.NodeFlags.Namespace ? "namespace" : "module");
            writeSpace();
        }
        emit(node.name);
        let body = node.body;
        if (!body)
            return writeTrailingSemicolon();
        while (body.kind === ts.SyntaxKind.ModuleDeclaration) {
            writePunctuation(".");
            emit((<ts.ModuleDeclaration>body).name);
            body = ((<ts.ModuleDeclaration>body).body!);
        }
        writeSpace();
        emit(body);
    }
    function emitModuleBlock(node: ts.ModuleBlock) {
        pushNameGenerationScope(node);
        ts.forEach(node.statements, generateNames);
        emitBlockStatements(node, /*forceSingleLine*/ isEmptyBlock(node));
        popNameGenerationScope(node);
    }
    function emitCaseBlock(node: ts.CaseBlock) {
        emitTokenWithComment(ts.SyntaxKind.OpenBraceToken, node.pos, writePunctuation, node);
        emitList(node, node.clauses, ts.ListFormat.CaseBlockClauses);
        emitTokenWithComment(ts.SyntaxKind.CloseBraceToken, node.clauses.end, writePunctuation, node, /*indentLeading*/ true);
    }
    function emitImportEqualsDeclaration(node: ts.ImportEqualsDeclaration) {
        emitModifiers(node, node.modifiers);
        emitTokenWithComment(ts.SyntaxKind.ImportKeyword, node.modifiers ? node.modifiers.end : node.pos, writeKeyword, node);
        writeSpace();
        emit(node.name);
        writeSpace();
        emitTokenWithComment(ts.SyntaxKind.EqualsToken, node.name.end, writePunctuation, node);
        writeSpace();
        emitModuleReference(node.moduleReference);
        writeTrailingSemicolon();
    }
    function emitModuleReference(node: ts.ModuleReference) {
        if (node.kind === ts.SyntaxKind.Identifier) {
            emitExpression(node);
        }
        else {
            emit(node);
        }
    }
    function emitImportDeclaration(node: ts.ImportDeclaration) {
        emitModifiers(node, node.modifiers);
        emitTokenWithComment(ts.SyntaxKind.ImportKeyword, node.modifiers ? node.modifiers.end : node.pos, writeKeyword, node);
        writeSpace();
        if (node.importClause) {
            emit(node.importClause);
            writeSpace();
            emitTokenWithComment(ts.SyntaxKind.FromKeyword, node.importClause.end, writeKeyword, node);
            writeSpace();
        }
        emitExpression(node.moduleSpecifier);
        writeTrailingSemicolon();
    }
    function emitImportClause(node: ts.ImportClause) {
        emit(node.name);
        if (node.name && node.namedBindings) {
            emitTokenWithComment(ts.SyntaxKind.CommaToken, node.name.end, writePunctuation, node);
            writeSpace();
        }
        emit(node.namedBindings);
    }
    function emitNamespaceImport(node: ts.NamespaceImport) {
        const asPos = emitTokenWithComment(ts.SyntaxKind.AsteriskToken, node.pos, writePunctuation, node);
        writeSpace();
        emitTokenWithComment(ts.SyntaxKind.AsKeyword, asPos, writeKeyword, node);
        writeSpace();
        emit(node.name);
    }
    function emitNamedImports(node: ts.NamedImports) {
        emitNamedImportsOrExports(node);
    }
    function emitImportSpecifier(node: ts.ImportSpecifier) {
        emitImportOrExportSpecifier(node);
    }
    function emitExportAssignment(node: ts.ExportAssignment) {
        const nextPos = emitTokenWithComment(ts.SyntaxKind.ExportKeyword, node.pos, writeKeyword, node);
        writeSpace();
        if (node.isExportEquals) {
            emitTokenWithComment(ts.SyntaxKind.EqualsToken, nextPos, writeOperator, node);
        }
        else {
            emitTokenWithComment(ts.SyntaxKind.DefaultKeyword, nextPos, writeKeyword, node);
        }
        writeSpace();
        emitExpression(node.expression);
        writeTrailingSemicolon();
    }
    function emitExportDeclaration(node: ts.ExportDeclaration) {
        let nextPos = emitTokenWithComment(ts.SyntaxKind.ExportKeyword, node.pos, writeKeyword, node);
        writeSpace();
        if (node.exportClause) {
            emit(node.exportClause);
        }
        else {
            nextPos = emitTokenWithComment(ts.SyntaxKind.AsteriskToken, nextPos, writePunctuation, node);
        }
        if (node.moduleSpecifier) {
            writeSpace();
            const fromPos = node.exportClause ? node.exportClause.end : nextPos;
            emitTokenWithComment(ts.SyntaxKind.FromKeyword, fromPos, writeKeyword, node);
            writeSpace();
            emitExpression(node.moduleSpecifier);
        }
        writeTrailingSemicolon();
    }
    function emitNamespaceExportDeclaration(node: ts.NamespaceExportDeclaration) {
        let nextPos = emitTokenWithComment(ts.SyntaxKind.ExportKeyword, node.pos, writeKeyword, node);
        writeSpace();
        nextPos = emitTokenWithComment(ts.SyntaxKind.AsKeyword, nextPos, writeKeyword, node);
        writeSpace();
        nextPos = emitTokenWithComment(ts.SyntaxKind.NamespaceKeyword, nextPos, writeKeyword, node);
        writeSpace();
        emit(node.name);
        writeTrailingSemicolon();
    }
    function emitNamedExports(node: ts.NamedExports) {
        emitNamedImportsOrExports(node);
    }
    function emitExportSpecifier(node: ts.ExportSpecifier) {
        emitImportOrExportSpecifier(node);
    }
    function emitNamedImportsOrExports(node: ts.NamedImportsOrExports) {
        writePunctuation("{");
        emitList(node, node.elements, ts.ListFormat.NamedImportsOrExportsElements);
        writePunctuation("}");
    }
    function emitImportOrExportSpecifier(node: ts.ImportOrExportSpecifier) {
        if (node.propertyName) {
            emit(node.propertyName);
            writeSpace();
            emitTokenWithComment(ts.SyntaxKind.AsKeyword, node.propertyName.end, writeKeyword, node);
            writeSpace();
        }
        emit(node.name);
    }
    //
    // Module references
    //
    function emitExternalModuleReference(node: ts.ExternalModuleReference) {
        writeKeyword("require");
        writePunctuation("(");
        emitExpression(node.expression);
        writePunctuation(")");
    }
    //
    // JSX
    //
    function emitJsxElement(node: ts.JsxElement) {
        emit(node.openingElement);
        emitList(node, node.children, ts.ListFormat.JsxElementOrFragmentChildren);
        emit(node.closingElement);
    }
    function emitJsxSelfClosingElement(node: ts.JsxSelfClosingElement) {
        writePunctuation("<");
        emitJsxTagName(node.tagName);
        emitTypeArguments(node, node.typeArguments);
        writeSpace();
        emit(node.attributes);
        writePunctuation("/>");
    }
    function emitJsxFragment(node: ts.JsxFragment) {
        emit(node.openingFragment);
        emitList(node, node.children, ts.ListFormat.JsxElementOrFragmentChildren);
        emit(node.closingFragment);
    }
    function emitJsxOpeningElementOrFragment(node: ts.JsxOpeningElement | ts.JsxOpeningFragment) {
        writePunctuation("<");
        if (ts.isJsxOpeningElement(node)) {
            emitJsxTagName(node.tagName);
            emitTypeArguments(node, node.typeArguments);
            if (node.attributes.properties && node.attributes.properties.length > 0) {
                writeSpace();
            }
            emit(node.attributes);
        }
        writePunctuation(">");
    }
    function emitJsxText(node: ts.JsxText) {
        writer.writeLiteral(node.text);
    }
    function emitJsxClosingElementOrFragment(node: ts.JsxClosingElement | ts.JsxClosingFragment) {
        writePunctuation("</");
        if (ts.isJsxClosingElement(node)) {
            emitJsxTagName(node.tagName);
        }
        writePunctuation(">");
    }
    function emitJsxAttributes(node: ts.JsxAttributes) {
        emitList(node, node.properties, ts.ListFormat.JsxElementAttributes);
    }
    function emitJsxAttribute(node: ts.JsxAttribute) {
        emit(node.name);
        emitNodeWithPrefix("=", writePunctuation, node.initializer!, emit); // TODO: GH#18217
    }
    function emitJsxSpreadAttribute(node: ts.JsxSpreadAttribute) {
        writePunctuation("{...");
        emitExpression(node.expression);
        writePunctuation("}");
    }
    function emitJsxExpression(node: ts.JsxExpression) {
        if (node.expression) {
            writePunctuation("{");
            emit(node.dotDotDotToken);
            emitExpression(node.expression);
            writePunctuation("}");
        }
    }
    function emitJsxTagName(node: ts.JsxTagNameExpression) {
        if (node.kind === ts.SyntaxKind.Identifier) {
            emitExpression(node);
        }
        else {
            emit(node);
        }
    }
    //
    // Clauses
    //
    function emitCaseClause(node: ts.CaseClause) {
        emitTokenWithComment(ts.SyntaxKind.CaseKeyword, node.pos, writeKeyword, node);
        writeSpace();
        emitExpression(node.expression);
        emitCaseOrDefaultClauseRest(node, node.statements, node.expression.end);
    }
    function emitDefaultClause(node: ts.DefaultClause) {
        const pos = emitTokenWithComment(ts.SyntaxKind.DefaultKeyword, node.pos, writeKeyword, node);
        emitCaseOrDefaultClauseRest(node, node.statements, pos);
    }
    function emitCaseOrDefaultClauseRest(parentNode: ts.Node, statements: ts.NodeArray<ts.Statement>, colonPos: number) {
        const emitAsSingleStatement = statements.length === 1 &&
            (
            // treat synthesized nodes as located on the same line for emit purposes
            ts.nodeIsSynthesized(parentNode) ||
                ts.nodeIsSynthesized(statements[0]) ||
                ts.rangeStartPositionsAreOnSameLine(parentNode, statements[0], (currentSourceFile!)));
        let format = ts.ListFormat.CaseOrDefaultClauseStatements;
        if (emitAsSingleStatement) {
            writeToken(ts.SyntaxKind.ColonToken, colonPos, writePunctuation, parentNode);
            writeSpace();
            format &= ~(ts.ListFormat.MultiLine | ts.ListFormat.Indented);
        }
        else {
            emitTokenWithComment(ts.SyntaxKind.ColonToken, colonPos, writePunctuation, parentNode);
        }
        emitList(parentNode, statements, format);
    }
    function emitHeritageClause(node: ts.HeritageClause) {
        writeSpace();
        writeTokenText(node.token, writeKeyword);
        writeSpace();
        emitList(node, node.types, ts.ListFormat.HeritageClauseTypes);
    }
    function emitCatchClause(node: ts.CatchClause) {
        const openParenPos = emitTokenWithComment(ts.SyntaxKind.CatchKeyword, node.pos, writeKeyword, node);
        writeSpace();
        if (node.variableDeclaration) {
            emitTokenWithComment(ts.SyntaxKind.OpenParenToken, openParenPos, writePunctuation, node);
            emit(node.variableDeclaration);
            emitTokenWithComment(ts.SyntaxKind.CloseParenToken, node.variableDeclaration.end, writePunctuation, node);
            writeSpace();
        }
        emit(node.block);
    }
    //
    // Property assignments
    //
    function emitPropertyAssignment(node: ts.PropertyAssignment) {
        emit(node.name);
        writePunctuation(":");
        writeSpace();
        // This is to ensure that we emit comment in the following case:
        //      For example:
        //          obj = {
        //              id: /*comment1*/ ()=>void
        //          }
        // "comment1" is not considered to be leading comment for node.initializer
        // but rather a trailing comment on the previous node.
        const initializer = node.initializer;
        if (emitTrailingCommentsOfPosition && (ts.getEmitFlags(initializer) & ts.EmitFlags.NoLeadingComments) === 0) {
            const commentRange = ts.getCommentRange(initializer);
            emitTrailingCommentsOfPosition(commentRange.pos);
        }
        emitExpression(initializer);
    }
    function emitShorthandPropertyAssignment(node: ts.ShorthandPropertyAssignment) {
        emit(node.name);
        if (node.objectAssignmentInitializer) {
            writeSpace();
            writePunctuation("=");
            writeSpace();
            emitExpression(node.objectAssignmentInitializer);
        }
    }
    function emitSpreadAssignment(node: ts.SpreadAssignment) {
        if (node.expression) {
            emitTokenWithComment(ts.SyntaxKind.DotDotDotToken, node.pos, writePunctuation, node);
            emitExpression(node.expression);
        }
    }
    //
    // Enum
    //
    function emitEnumMember(node: ts.EnumMember) {
        emit(node.name);
        emitInitializer(node.initializer, node.name.end, node);
    }
    //
    // JSDoc
    //
    function emitJSDoc(node: ts.JSDoc) {
        write("/**");
        if (node.comment) {
            const lines = node.comment.split(/\r\n?|\n/g);
            for (const line of lines) {
                writeLine();
                writeSpace();
                writePunctuation("*");
                writeSpace();
                write(line);
            }
        }
        if (node.tags) {
            if (node.tags.length === 1 && node.tags[0].kind === ts.SyntaxKind.JSDocTypeTag && !node.comment) {
                writeSpace();
                emit(node.tags[0]);
            }
            else {
                emitList(node, node.tags, ts.ListFormat.JSDocComment);
            }
        }
        writeSpace();
        write("*/");
    }
    function emitJSDocSimpleTypedTag(tag: ts.JSDocTypeTag | ts.JSDocThisTag | ts.JSDocEnumTag | ts.JSDocReturnTag) {
        emitJSDocTagName(tag.tagName);
        emitJSDocTypeExpression(tag.typeExpression);
        emitJSDocComment(tag.comment);
    }
    function emitJSDocAugmentsTag(tag: ts.JSDocAugmentsTag) {
        emitJSDocTagName(tag.tagName);
        writeSpace();
        writePunctuation("{");
        emit(tag.class);
        writePunctuation("}");
        emitJSDocComment(tag.comment);
    }
    function emitJSDocTemplateTag(tag: ts.JSDocTemplateTag) {
        emitJSDocTagName(tag.tagName);
        emitJSDocTypeExpression(tag.constraint);
        writeSpace();
        emitList(tag, tag.typeParameters, ts.ListFormat.CommaListElements);
        emitJSDocComment(tag.comment);
    }
    function emitJSDocTypedefTag(tag: ts.JSDocTypedefTag) {
        emitJSDocTagName(tag.tagName);
        if (tag.typeExpression) {
            if (tag.typeExpression.kind === ts.SyntaxKind.JSDocTypeExpression) {
                emitJSDocTypeExpression(tag.typeExpression);
            }
            else {
                writeSpace();
                writePunctuation("{");
                write("Object");
                if (tag.typeExpression.isArrayType) {
                    writePunctuation("[");
                    writePunctuation("]");
                }
                writePunctuation("}");
            }
        }
        if (tag.fullName) {
            writeSpace();
            emit(tag.fullName);
        }
        emitJSDocComment(tag.comment);
        if (tag.typeExpression && tag.typeExpression.kind === ts.SyntaxKind.JSDocTypeLiteral) {
            emitJSDocTypeLiteral(tag.typeExpression);
        }
    }
    function emitJSDocCallbackTag(tag: ts.JSDocCallbackTag) {
        emitJSDocTagName(tag.tagName);
        if (tag.name) {
            writeSpace();
            emit(tag.name);
        }
        emitJSDocComment(tag.comment);
        emitJSDocSignature(tag.typeExpression);
    }
    function emitJSDocSimpleTag(tag: ts.JSDocTag) {
        emitJSDocTagName(tag.tagName);
        emitJSDocComment(tag.comment);
    }
    function emitJSDocTypeLiteral(lit: ts.JSDocTypeLiteral) {
        emitList(lit, ts.createNodeArray(lit.jsDocPropertyTags), ts.ListFormat.JSDocComment);
    }
    function emitJSDocSignature(sig: ts.JSDocSignature) {
        if (sig.typeParameters) {
            emitList(sig, ts.createNodeArray(sig.typeParameters), ts.ListFormat.JSDocComment);
        }
        if (sig.parameters) {
            emitList(sig, ts.createNodeArray(sig.parameters), ts.ListFormat.JSDocComment);
        }
        if (sig.type) {
            writeLine();
            writeSpace();
            writePunctuation("*");
            writeSpace();
            emit(sig.type);
        }
    }
    function emitJSDocPropertyLikeTag(param: ts.JSDocPropertyLikeTag) {
        emitJSDocTagName(param.tagName);
        emitJSDocTypeExpression(param.typeExpression);
        writeSpace();
        if (param.isBracketed) {
            writePunctuation("[");
        }
        emit(param.name);
        if (param.isBracketed) {
            writePunctuation("]");
        }
        emitJSDocComment(param.comment);
    }
    function emitJSDocTagName(tagName: ts.Identifier) {
        writePunctuation("@");
        emit(tagName);
    }
    function emitJSDocComment(comment: string | undefined) {
        if (comment) {
            writeSpace();
            write(comment);
        }
    }
    function emitJSDocTypeExpression(typeExpression: ts.JSDocTypeExpression | undefined) {
        if (typeExpression) {
            writeSpace();
            writePunctuation("{");
            emit(typeExpression.type);
            writePunctuation("}");
        }
    }
    //
    // Top-level nodes
    //
    function emitSourceFile(node: ts.SourceFile) {
        writeLine();
        const statements = node.statements;
        if (emitBodyWithDetachedComments) {
            // Emit detached comment if there are no prologue directives or if the first node is synthesized.
            // The synthesized node will have no leading comment so some comments may be missed.
            const shouldEmitDetachedComment = statements.length === 0 ||
                !ts.isPrologueDirective(statements[0]) ||
                ts.nodeIsSynthesized(statements[0]);
            if (shouldEmitDetachedComment) {
                emitBodyWithDetachedComments(node, statements, emitSourceFileWorker);
                return;
            }
        }
        emitSourceFileWorker(node);
    }
    function emitSyntheticTripleSlashReferencesIfNeeded(node: ts.Bundle) {
        emitTripleSlashDirectives(!!node.hasNoDefaultLib, node.syntheticFileReferences || [], node.syntheticTypeReferences || [], node.syntheticLibReferences || []);
        for (const prepend of node.prepends) {
            if (ts.isUnparsedSource(prepend) && prepend.syntheticReferences) {
                for (const ref of prepend.syntheticReferences) {
                    emit(ref);
                    writeLine();
                }
            }
        }
    }
    function emitTripleSlashDirectivesIfNeeded(node: ts.SourceFile) {
        if (node.isDeclarationFile)
            emitTripleSlashDirectives(node.hasNoDefaultLib, node.referencedFiles, node.typeReferenceDirectives, node.libReferenceDirectives);
    }
    function emitTripleSlashDirectives(hasNoDefaultLib: boolean, files: readonly ts.FileReference[], types: readonly ts.FileReference[], libs: readonly ts.FileReference[]) {
        if (hasNoDefaultLib) {
            const pos = writer.getTextPos();
            writeComment(`/// <reference no-default-lib="true"/>`);
            if (bundleFileInfo)
                bundleFileInfo.sections.push({ pos, end: writer.getTextPos(), kind: ts.BundleFileSectionKind.NoDefaultLib });
            writeLine();
        }
        if (currentSourceFile && currentSourceFile.moduleName) {
            writeComment(`/// <amd-module name="${currentSourceFile.moduleName}" />`);
            writeLine();
        }
        if (currentSourceFile && currentSourceFile.amdDependencies) {
            for (const dep of currentSourceFile.amdDependencies) {
                if (dep.name) {
                    writeComment(`/// <amd-dependency name="${dep.name}" path="${dep.path}" />`);
                }
                else {
                    writeComment(`/// <amd-dependency path="${dep.path}" />`);
                }
                writeLine();
            }
        }
        for (const directive of files) {
            const pos = writer.getTextPos();
            writeComment(`/// <reference path="${directive.fileName}" />`);
            if (bundleFileInfo)
                bundleFileInfo.sections.push({ pos, end: writer.getTextPos(), kind: ts.BundleFileSectionKind.Reference, data: directive.fileName });
            writeLine();
        }
        for (const directive of types) {
            const pos = writer.getTextPos();
            writeComment(`/// <reference types="${directive.fileName}" />`);
            if (bundleFileInfo)
                bundleFileInfo.sections.push({ pos, end: writer.getTextPos(), kind: ts.BundleFileSectionKind.Type, data: directive.fileName });
            writeLine();
        }
        for (const directive of libs) {
            const pos = writer.getTextPos();
            writeComment(`/// <reference lib="${directive.fileName}" />`);
            if (bundleFileInfo)
                bundleFileInfo.sections.push({ pos, end: writer.getTextPos(), kind: ts.BundleFileSectionKind.Lib, data: directive.fileName });
            writeLine();
        }
    }
    function emitSourceFileWorker(node: ts.SourceFile) {
        const statements = node.statements;
        pushNameGenerationScope(node);
        ts.forEach(node.statements, generateNames);
        emitHelpers(node);
        const index = ts.findIndex(statements, statement => !ts.isPrologueDirective(statement));
        emitTripleSlashDirectivesIfNeeded(node);
        emitList(node, statements, ts.ListFormat.MultiLine, index === -1 ? statements.length : index);
        popNameGenerationScope(node);
    }
    // Transformation nodes
    function emitPartiallyEmittedExpression(node: ts.PartiallyEmittedExpression) {
        emitExpression(node.expression);
    }
    function emitCommaList(node: ts.CommaListExpression) {
        emitExpressionList(node, node.elements, ts.ListFormat.CommaListElements);
    }
    /**
     * Emits any prologue directives at the start of a Statement list, returning the
     * number of prologue directives written to the output.
     */
    function emitPrologueDirectives(statements: readonly ts.Node[], sourceFile?: ts.SourceFile, seenPrologueDirectives?: ts.Map<true>, recordBundleFileSection?: true): number {
        let needsToSetSourceFile = !!sourceFile;
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (ts.isPrologueDirective(statement)) {
                const shouldEmitPrologueDirective = seenPrologueDirectives ? !seenPrologueDirectives.has(statement.expression.text) : true;
                if (shouldEmitPrologueDirective) {
                    if (needsToSetSourceFile) {
                        needsToSetSourceFile = false;
                        setSourceFile(sourceFile);
                    }
                    writeLine();
                    const pos = writer.getTextPos();
                    emit(statement);
                    if (recordBundleFileSection && bundleFileInfo)
                        bundleFileInfo.sections.push({ pos, end: writer.getTextPos(), kind: ts.BundleFileSectionKind.Prologue, data: statement.expression.text });
                    if (seenPrologueDirectives) {
                        seenPrologueDirectives.set(statement.expression.text, true);
                    }
                }
            }
            else {
                // return index of the first non prologue directive
                return i;
            }
        }
        return statements.length;
    }
    function emitUnparsedPrologues(prologues: readonly ts.UnparsedPrologue[], seenPrologueDirectives: ts.Map<true>) {
        for (const prologue of prologues) {
            if (!seenPrologueDirectives.has(prologue.data)) {
                writeLine();
                const pos = writer.getTextPos();
                emit(prologue);
                if (bundleFileInfo)
                    bundleFileInfo.sections.push({ pos, end: writer.getTextPos(), kind: ts.BundleFileSectionKind.Prologue, data: prologue.data });
                if (seenPrologueDirectives) {
                    seenPrologueDirectives.set(prologue.data, true);
                }
            }
        }
    }
    function emitPrologueDirectivesIfNeeded(sourceFileOrBundle: ts.Bundle | ts.SourceFile) {
        if (ts.isSourceFile(sourceFileOrBundle)) {
            emitPrologueDirectives(sourceFileOrBundle.statements, sourceFileOrBundle);
        }
        else {
            const seenPrologueDirectives = ts.createMap<true>();
            for (const prepend of sourceFileOrBundle.prepends) {
                emitUnparsedPrologues((prepend as ts.UnparsedSource).prologues, seenPrologueDirectives);
            }
            for (const sourceFile of sourceFileOrBundle.sourceFiles) {
                emitPrologueDirectives(sourceFile.statements, sourceFile, seenPrologueDirectives, /*recordBundleFileSection*/ true);
            }
            setSourceFile(undefined);
        }
    }
    function getPrologueDirectivesFromBundledSourceFiles(bundle: ts.Bundle): ts.SourceFilePrologueInfo[] | undefined {
        const seenPrologueDirectives = ts.createMap<true>();
        let prologues: ts.SourceFilePrologueInfo[] | undefined;
        for (let index = 0; index < bundle.sourceFiles.length; index++) {
            const sourceFile = bundle.sourceFiles[index];
            let directives: ts.SourceFilePrologueDirective[] | undefined;
            let end = 0;
            for (const statement of sourceFile.statements) {
                if (!ts.isPrologueDirective(statement))
                    break;
                if (seenPrologueDirectives.has(statement.expression.text))
                    continue;
                seenPrologueDirectives.set(statement.expression.text, true);
                (directives || (directives = [])).push({
                    pos: statement.pos,
                    end: statement.end,
                    expression: {
                        pos: statement.expression.pos,
                        end: statement.expression.end,
                        text: statement.expression.text
                    }
                });
                end = end < statement.end ? statement.end : end;
            }
            if (directives)
                (prologues || (prologues = [])).push({ file: index, text: sourceFile.text.substring(0, end), directives });
        }
        return prologues;
    }
    function emitShebangIfNeeded(sourceFileOrBundle: ts.Bundle | ts.SourceFile | ts.UnparsedSource) {
        if (ts.isSourceFile(sourceFileOrBundle) || ts.isUnparsedSource(sourceFileOrBundle)) {
            const shebang = ts.getShebang(sourceFileOrBundle.text);
            if (shebang) {
                writeComment(shebang);
                writeLine();
                return true;
            }
        }
        else {
            for (const prepend of sourceFileOrBundle.prepends) {
                ts.Debug.assertNode(prepend, ts.isUnparsedSource);
                if (emitShebangIfNeeded((prepend as ts.UnparsedSource))) {
                    return true;
                }
            }
            for (const sourceFile of sourceFileOrBundle.sourceFiles) {
                // Emit only the first encountered shebang
                if (emitShebangIfNeeded(sourceFile)) {
                    return true;
                }
            }
        }
    }
    //
    // Helpers
    //
    function emitNodeWithWriter(node: ts.Node | undefined, writer: typeof write) {
        if (!node)
            return;
        const savedWrite = write;
        write = writer;
        emit(node);
        write = savedWrite;
    }
    function emitModifiers(node: ts.Node, modifiers: ts.NodeArray<ts.Modifier> | undefined) {
        if (modifiers && modifiers.length) {
            emitList(node, modifiers, ts.ListFormat.Modifiers);
            writeSpace();
        }
    }
    function emitTypeAnnotation(node: ts.TypeNode | undefined) {
        if (node) {
            writePunctuation(":");
            writeSpace();
            emit(node);
        }
    }
    function emitInitializer(node: ts.Expression | undefined, equalCommentStartPos: number, container: ts.Node) {
        if (node) {
            writeSpace();
            emitTokenWithComment(ts.SyntaxKind.EqualsToken, equalCommentStartPos, writeOperator, container);
            writeSpace();
            emitExpression(node);
        }
    }
    function emitNodeWithPrefix(prefix: string, prefixWriter: (s: string) => void, node: ts.Node, emit: (node: ts.Node) => void) {
        if (node) {
            prefixWriter(prefix);
            emit(node);
        }
    }
    function emitWithLeadingSpace(node: ts.Node | undefined) {
        if (node) {
            writeSpace();
            emit(node);
        }
    }
    function emitExpressionWithLeadingSpace(node: ts.Expression | undefined) {
        if (node) {
            writeSpace();
            emitExpression(node);
        }
    }
    function emitWithTrailingSpace(node: ts.Node | undefined) {
        if (node) {
            emit(node);
            writeSpace();
        }
    }
    function emitEmbeddedStatement(parent: ts.Node, node: ts.Statement) {
        if (ts.isBlock(node) || ts.getEmitFlags(parent) & ts.EmitFlags.SingleLine) {
            writeSpace();
            emit(node);
        }
        else {
            writeLine();
            increaseIndent();
            if (ts.isEmptyStatement(node)) {
                pipelineEmit(ts.EmitHint.EmbeddedStatement, node);
            }
            else {
                emit(node);
            }
            decreaseIndent();
        }
    }
    function emitDecorators(parentNode: ts.Node, decorators: ts.NodeArray<ts.Decorator> | undefined) {
        emitList(parentNode, decorators, ts.ListFormat.Decorators);
    }
    function emitTypeArguments(parentNode: ts.Node, typeArguments: ts.NodeArray<ts.TypeNode> | undefined) {
        emitList(parentNode, typeArguments, ts.ListFormat.TypeArguments);
    }
    function emitTypeParameters(parentNode: ts.SignatureDeclaration | ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.ClassDeclaration | ts.ClassExpression, typeParameters: ts.NodeArray<ts.TypeParameterDeclaration> | undefined) {
        if (ts.isFunctionLike(parentNode) && parentNode.typeArguments) { // Quick info uses type arguments in place of type parameters on instantiated signatures
            return emitTypeArguments(parentNode, parentNode.typeArguments);
        }
        emitList(parentNode, typeParameters, ts.ListFormat.TypeParameters);
    }
    function emitParameters(parentNode: ts.Node, parameters: ts.NodeArray<ts.ParameterDeclaration>) {
        emitList(parentNode, parameters, ts.ListFormat.Parameters);
    }
    function canEmitSimpleArrowHead(parentNode: ts.FunctionTypeNode | ts.ArrowFunction, parameters: ts.NodeArray<ts.ParameterDeclaration>) {
        const parameter = ts.singleOrUndefined(parameters);
        return parameter
            && parameter.pos === parentNode.pos // may not have parsed tokens between parent and parameter
            && ts.isArrowFunction(parentNode) // only arrow functions may have simple arrow head
            && !parentNode.type // arrow function may not have return type annotation
            && !ts.some(parentNode.decorators) // parent may not have decorators
            && !ts.some(parentNode.modifiers) // parent may not have modifiers
            && !ts.some(parentNode.typeParameters) // parent may not have type parameters
            && !ts.some(parameter.decorators) // parameter may not have decorators
            && !ts.some(parameter.modifiers) // parameter may not have modifiers
            && !parameter.dotDotDotToken // parameter may not be rest
            && !parameter.questionToken // parameter may not be optional
            && !parameter.type // parameter may not have a type annotation
            && !parameter.initializer // parameter may not have an initializer
            && ts.isIdentifier(parameter.name); // parameter name must be identifier
    }
    function emitParametersForArrow(parentNode: ts.FunctionTypeNode | ts.ArrowFunction, parameters: ts.NodeArray<ts.ParameterDeclaration>) {
        if (canEmitSimpleArrowHead(parentNode, parameters)) {
            emitList(parentNode, parameters, ts.ListFormat.Parameters & ~ts.ListFormat.Parenthesis);
        }
        else {
            emitParameters(parentNode, parameters);
        }
    }
    function emitParametersForIndexSignature(parentNode: ts.Node, parameters: ts.NodeArray<ts.ParameterDeclaration>) {
        emitList(parentNode, parameters, ts.ListFormat.IndexSignatureParameters);
    }
    function emitList(parentNode: ts.TextRange, children: ts.NodeArray<ts.Node> | undefined, format: ts.ListFormat, start?: number, count?: number) {
        emitNodeList(emit, parentNode, children, format, start, count);
    }
    function emitExpressionList(parentNode: ts.TextRange, children: ts.NodeArray<ts.Node> | undefined, format: ts.ListFormat, start?: number, count?: number) {
        emitNodeList((emitExpression as (node: ts.Node) => void), parentNode, children, format, start, count); // TODO: GH#18217
    }
    function writeDelimiter(format: ts.ListFormat) {
        switch (format & ts.ListFormat.DelimitersMask) {
            case ts.ListFormat.None:
                break;
            case ts.ListFormat.CommaDelimited:
                writePunctuation(",");
                break;
            case ts.ListFormat.BarDelimited:
                writeSpace();
                writePunctuation("|");
                break;
            case ts.ListFormat.AsteriskDelimited:
                writeSpace();
                writePunctuation("*");
                writeSpace();
                break;
            case ts.ListFormat.AmpersandDelimited:
                writeSpace();
                writePunctuation("&");
                break;
        }
    }
    function emitNodeList(emit: (node: ts.Node) => void, parentNode: ts.TextRange, children: ts.NodeArray<ts.Node> | undefined, format: ts.ListFormat, start = 0, count = children ? children.length - start : 0) {
        const isUndefined = children === undefined;
        if (isUndefined && format & ts.ListFormat.OptionalIfUndefined) {
            return;
        }
        const isEmpty = children === undefined || start >= children.length || count === 0;
        if (isEmpty && format & ts.ListFormat.OptionalIfEmpty) {
            if (onBeforeEmitNodeArray) {
                onBeforeEmitNodeArray(children);
            }
            if (onAfterEmitNodeArray) {
                onAfterEmitNodeArray(children);
            }
            return;
        }
        if (format & ts.ListFormat.BracketsMask) {
            writePunctuation(getOpeningBracket(format));
            if (isEmpty && !isUndefined) {
                // TODO: GH#18217
                emitTrailingCommentsOfPosition(children!.pos, /*prefixSpace*/ true); // Emit comments within empty bracketed lists
            }
        }
        if (onBeforeEmitNodeArray) {
            onBeforeEmitNodeArray(children);
        }
        if (isEmpty) {
            // Write a line terminator if the parent node was multi-line
            if (format & ts.ListFormat.MultiLine) {
                writeLine();
            }
            else if (format & ts.ListFormat.SpaceBetweenBraces && !(format & ts.ListFormat.NoSpaceIfEmpty)) {
                writeSpace();
            }
        }
        else {
            // Write the opening line terminator or leading whitespace.
            const mayEmitInterveningComments = (format & ts.ListFormat.NoInterveningComments) === 0;
            let shouldEmitInterveningComments = mayEmitInterveningComments;
            if (shouldWriteLeadingLineTerminator(parentNode, children!, format)) { // TODO: GH#18217
                writeLine();
                shouldEmitInterveningComments = false;
            }
            else if (format & ts.ListFormat.SpaceBetweenBraces) {
                writeSpace();
            }
            // Increase the indent, if requested.
            if (format & ts.ListFormat.Indented) {
                increaseIndent();
            }
            // Emit each child.
            let previousSibling: ts.Node | undefined;
            let previousSourceFileTextKind: ReturnType<typeof recordBundleFileInternalSectionStart>;
            let shouldDecreaseIndentAfterEmit = false;
            for (let i = 0; i < count; i++) {
                const child = children![start + i];
                // Write the delimiter if this is not the first node.
                if (format & ts.ListFormat.AsteriskDelimited) {
                    // always write JSDoc in the format "\n *"
                    writeLine();
                    writeDelimiter(format);
                }
                else if (previousSibling) {
                    // i.e
                    //      function commentedParameters(
                    //          /* Parameter a */
                    //          a
                    //          /* End of parameter a */ -> this comment isn't considered to be trailing comment of parameter "a" due to newline
                    //          ,
                    if (format & ts.ListFormat.DelimitersMask && previousSibling.end !== parentNode.end) {
                        emitLeadingCommentsOfPosition(previousSibling.end);
                    }
                    writeDelimiter(format);
                    recordBundleFileInternalSectionEnd(previousSourceFileTextKind);
                    // Write either a line terminator or whitespace to separate the elements.
                    if (shouldWriteSeparatingLineTerminator(previousSibling, child, format)) {
                        // If a synthesized node in a single-line list starts on a new
                        // line, we should increase the indent.
                        if ((format & (ts.ListFormat.LinesMask | ts.ListFormat.Indented)) === ts.ListFormat.SingleLine) {
                            increaseIndent();
                            shouldDecreaseIndentAfterEmit = true;
                        }
                        writeLine();
                        shouldEmitInterveningComments = false;
                    }
                    else if (previousSibling && format & ts.ListFormat.SpaceBetweenSiblings) {
                        writeSpace();
                    }
                }
                // Emit this child.
                previousSourceFileTextKind = recordBundleFileInternalSectionStart(child);
                if (shouldEmitInterveningComments) {
                    if (emitTrailingCommentsOfPosition) {
                        const commentRange = ts.getCommentRange(child);
                        emitTrailingCommentsOfPosition(commentRange.pos);
                    }
                }
                else {
                    shouldEmitInterveningComments = mayEmitInterveningComments;
                }
                emit(child);
                if (shouldDecreaseIndentAfterEmit) {
                    decreaseIndent();
                    shouldDecreaseIndentAfterEmit = false;
                }
                previousSibling = child;
            }
            // Write a trailing comma, if requested.
            const hasTrailingComma = (format & ts.ListFormat.AllowTrailingComma) && children!.hasTrailingComma;
            if (format & ts.ListFormat.CommaDelimited && hasTrailingComma) {
                writePunctuation(",");
            }
            // Emit any trailing comment of the last element in the list
            // i.e
            //       var array = [...
            //          2
            //          /* end of element 2 */
            //       ];
            if (previousSibling && format & ts.ListFormat.DelimitersMask && previousSibling.end !== parentNode.end && !(ts.getEmitFlags(previousSibling) & ts.EmitFlags.NoTrailingComments)) {
                emitLeadingCommentsOfPosition(previousSibling.end);
            }
            // Decrease the indent, if requested.
            if (format & ts.ListFormat.Indented) {
                decreaseIndent();
            }
            recordBundleFileInternalSectionEnd(previousSourceFileTextKind);
            // Write the closing line terminator or closing whitespace.
            if (shouldWriteClosingLineTerminator(parentNode, children!, format)) {
                writeLine();
            }
            else if (format & ts.ListFormat.SpaceBetweenBraces) {
                writeSpace();
            }
        }
        if (onAfterEmitNodeArray) {
            onAfterEmitNodeArray(children);
        }
        if (format & ts.ListFormat.BracketsMask) {
            if (isEmpty && !isUndefined) {
                // TODO: GH#18217
                emitLeadingCommentsOfPosition(children!.end); // Emit leading comments within empty lists
            }
            writePunctuation(getClosingBracket(format));
        }
    }
    // Writers
    function writeLiteral(s: string) {
        writer.writeLiteral(s);
    }
    function writeStringLiteral(s: string) {
        writer.writeStringLiteral(s);
    }
    function writeBase(s: string) {
        writer.write(s);
    }
    function writeSymbol(s: string, sym: ts.Symbol) {
        writer.writeSymbol(s, sym);
    }
    function writePunctuation(s: string) {
        writer.writePunctuation(s);
    }
    function writeTrailingSemicolon() {
        writer.writeTrailingSemicolon(";");
    }
    function writeKeyword(s: string) {
        writer.writeKeyword(s);
    }
    function writeOperator(s: string) {
        writer.writeOperator(s);
    }
    function writeParameter(s: string) {
        writer.writeParameter(s);
    }
    function writeComment(s: string) {
        writer.writeComment(s);
    }
    function writeSpace() {
        writer.writeSpace(" ");
    }
    function writeProperty(s: string) {
        writer.writeProperty(s);
    }
    function writeLine() {
        writer.writeLine();
    }
    function increaseIndent() {
        writer.increaseIndent();
    }
    function decreaseIndent() {
        writer.decreaseIndent();
    }
    function writeToken(token: ts.SyntaxKind, pos: number, writer: (s: string) => void, contextNode?: ts.Node) {
        return !sourceMapsDisabled
            ? emitTokenWithSourceMap(contextNode, token, writer, pos, writeTokenText)
            : writeTokenText(token, writer, pos);
    }
    function writeTokenNode(node: ts.Node, writer: (s: string) => void) {
        if (onBeforeEmitToken) {
            onBeforeEmitToken(node);
        }
        writer((ts.tokenToString(node.kind)!));
        if (onAfterEmitToken) {
            onAfterEmitToken(node);
        }
    }
    function writeTokenText(token: ts.SyntaxKind, writer: (s: string) => void): void;
    function writeTokenText(token: ts.SyntaxKind, writer: (s: string) => void, pos: number): number;
    function writeTokenText(token: ts.SyntaxKind, writer: (s: string) => void, pos?: number): number {
        const tokenString = (ts.tokenToString(token)!);
        writer(tokenString);
        return pos! < 0 ? pos! : pos! + tokenString.length;
    }
    function writeLineOrSpace(node: ts.Node) {
        if (ts.getEmitFlags(node) & ts.EmitFlags.SingleLine) {
            writeSpace();
        }
        else {
            writeLine();
        }
    }
    function writeLines(text: string): void {
        const lines = text.split(/\r\n?|\n/g);
        const indentation = ts.guessIndentation(lines);
        for (const lineText of lines) {
            const line = indentation ? lineText.slice(indentation) : lineText;
            if (line.length) {
                writeLine();
                write(line);
            }
        }
    }
    function increaseIndentIf(value: boolean, writeSpaceIfNotIndenting: boolean) {
        if (value) {
            increaseIndent();
            writeLine();
        }
        else if (writeSpaceIfNotIndenting) {
            writeSpace();
        }
    }
    // Helper function to decrease the indent if we previously indented.  Allows multiple
    // previous indent values to be considered at a time.  This also allows caller to just
    // call this once, passing in all their appropriate indent values, instead of needing
    // to call this helper function multiple times.
    function decreaseIndentIf(value1: boolean, value2: boolean) {
        if (value1) {
            decreaseIndent();
        }
        if (value2) {
            decreaseIndent();
        }
    }
    function shouldWriteLeadingLineTerminator(parentNode: ts.TextRange, children: ts.NodeArray<ts.Node>, format: ts.ListFormat) {
        if (format & ts.ListFormat.MultiLine) {
            return true;
        }
        if (format & ts.ListFormat.PreserveLines) {
            if (format & ts.ListFormat.PreferNewLine) {
                return true;
            }
            const firstChild = children[0];
            if (firstChild === undefined) {
                return !ts.rangeIsOnSingleLine(parentNode, (currentSourceFile!));
            }
            else if (ts.positionIsSynthesized(parentNode.pos) || ts.nodeIsSynthesized(firstChild)) {
                return synthesizedNodeStartsOnNewLine(firstChild, format);
            }
            else {
                return !ts.rangeStartPositionsAreOnSameLine(parentNode, firstChild, (currentSourceFile!));
            }
        }
        else {
            return false;
        }
    }
    function shouldWriteSeparatingLineTerminator(previousNode: ts.Node | undefined, nextNode: ts.Node, format: ts.ListFormat) {
        if (format & ts.ListFormat.MultiLine) {
            return true;
        }
        else if (format & ts.ListFormat.PreserveLines) {
            if (previousNode === undefined || nextNode === undefined) {
                return false;
            }
            else if (ts.nodeIsSynthesized(previousNode) || ts.nodeIsSynthesized(nextNode)) {
                return synthesizedNodeStartsOnNewLine(previousNode, format) || synthesizedNodeStartsOnNewLine(nextNode, format);
            }
            else {
                return !ts.rangeEndIsOnSameLineAsRangeStart(previousNode, nextNode, (currentSourceFile!));
            }
        }
        else {
            return ts.getStartsOnNewLine(nextNode);
        }
    }
    function shouldWriteClosingLineTerminator(parentNode: ts.TextRange, children: ts.NodeArray<ts.Node>, format: ts.ListFormat) {
        if (format & ts.ListFormat.MultiLine) {
            return (format & ts.ListFormat.NoTrailingNewLine) === 0;
        }
        else if (format & ts.ListFormat.PreserveLines) {
            if (format & ts.ListFormat.PreferNewLine) {
                return true;
            }
            const lastChild = ts.lastOrUndefined(children);
            if (lastChild === undefined) {
                return !ts.rangeIsOnSingleLine(parentNode, (currentSourceFile!));
            }
            else if (ts.positionIsSynthesized(parentNode.pos) || ts.nodeIsSynthesized(lastChild)) {
                return synthesizedNodeStartsOnNewLine(lastChild, format);
            }
            else {
                return !ts.rangeEndPositionsAreOnSameLine(parentNode, lastChild, (currentSourceFile!));
            }
        }
        else {
            return false;
        }
    }
    function synthesizedNodeStartsOnNewLine(node: ts.Node, format: ts.ListFormat) {
        if (ts.nodeIsSynthesized(node)) {
            const startsOnNewLine = ts.getStartsOnNewLine(node);
            if (startsOnNewLine === undefined) {
                return (format & ts.ListFormat.PreferNewLine) !== 0;
            }
            return startsOnNewLine;
        }
        return (format & ts.ListFormat.PreferNewLine) !== 0;
    }
    function needsIndentation(parent: ts.Node, node1: ts.Node, node2: ts.Node): boolean {
        if (ts.getEmitFlags(parent) & ts.EmitFlags.NoIndentation) {
            return false;
        }
        parent = skipSynthesizedParentheses(parent);
        node1 = skipSynthesizedParentheses(node1);
        node2 = skipSynthesizedParentheses(node2);
        // Always use a newline for synthesized code if the synthesizer desires it.
        if (ts.getStartsOnNewLine(node2)) {
            return true;
        }
        return !ts.nodeIsSynthesized(parent)
            && !ts.nodeIsSynthesized(node1)
            && !ts.nodeIsSynthesized(node2)
            && !ts.rangeEndIsOnSameLineAsRangeStart(node1, node2, (currentSourceFile!));
    }
    function isEmptyBlock(block: ts.BlockLike) {
        return block.statements.length === 0
            && ts.rangeEndIsOnSameLineAsRangeStart(block, block, (currentSourceFile!));
    }
    function skipSynthesizedParentheses(node: ts.Node) {
        while (node.kind === ts.SyntaxKind.ParenthesizedExpression && ts.nodeIsSynthesized(node)) {
            node = (<ts.ParenthesizedExpression>node).expression;
        }
        return node;
    }
    function getTextOfNode(node: ts.Node, includeTrivia?: boolean): string {
        if (ts.isGeneratedIdentifier(node)) {
            return generateName(node);
        }
        else if (ts.isIdentifier(node) && (ts.nodeIsSynthesized(node) || !node.parent || !currentSourceFile || (node.parent && currentSourceFile && ts.getSourceFileOfNode(node) !== ts.getOriginalNode(currentSourceFile)))) {
            return ts.idText(node);
        }
        else if (node.kind === ts.SyntaxKind.StringLiteral && (<ts.StringLiteral>node).textSourceNode) {
            return getTextOfNode(((<ts.StringLiteral>node).textSourceNode!), includeTrivia);
        }
        else if (ts.isLiteralExpression(node) && (ts.nodeIsSynthesized(node) || !node.parent)) {
            return node.text;
        }
        return ts.getSourceTextOfNodeFromSourceFile((currentSourceFile!), node, includeTrivia);
    }
    function getLiteralTextOfNode(node: ts.LiteralLikeNode, neverAsciiEscape: boolean | undefined): string {
        if (node.kind === ts.SyntaxKind.StringLiteral && (<ts.StringLiteral>node).textSourceNode) {
            const textSourceNode = ((<ts.StringLiteral>node).textSourceNode!);
            if (ts.isIdentifier(textSourceNode)) {
                return neverAsciiEscape || (ts.getEmitFlags(node) & ts.EmitFlags.NoAsciiEscaping) ?
                    `"${ts.escapeString(getTextOfNode(textSourceNode))}"` :
                    `"${ts.escapeNonAsciiString(getTextOfNode(textSourceNode))}"`;
            }
            else {
                return getLiteralTextOfNode(textSourceNode, neverAsciiEscape);
            }
        }
        return ts.getLiteralText(node, (currentSourceFile!), neverAsciiEscape);
    }
    /**
     * Push a new name generation scope.
     */
    function pushNameGenerationScope(node: ts.Node | undefined) {
        if (node && ts.getEmitFlags(node) & ts.EmitFlags.ReuseTempVariableScope) {
            return;
        }
        tempFlagsStack.push(tempFlags);
        tempFlags = 0;
        reservedNamesStack.push(reservedNames);
    }
    /**
     * Pop the current name generation scope.
     */
    function popNameGenerationScope(node: ts.Node | undefined) {
        if (node && ts.getEmitFlags(node) & ts.EmitFlags.ReuseTempVariableScope) {
            return;
        }
        tempFlags = tempFlagsStack.pop()!;
        reservedNames = reservedNamesStack.pop()!;
    }
    function reserveNameInNestedScopes(name: string) {
        if (!reservedNames || reservedNames === ts.lastOrUndefined(reservedNamesStack)) {
            reservedNames = ts.createMap<true>();
        }
        reservedNames.set(name, true);
    }
    function generateNames(node: ts.Node | undefined) {
        if (!node)
            return;
        switch (node.kind) {
            case ts.SyntaxKind.Block:
                ts.forEach((<ts.Block>node).statements, generateNames);
                break;
            case ts.SyntaxKind.LabeledStatement:
            case ts.SyntaxKind.WithStatement:
            case ts.SyntaxKind.DoStatement:
            case ts.SyntaxKind.WhileStatement:
                generateNames((<ts.LabeledStatement | ts.WithStatement | ts.DoStatement | ts.WhileStatement>node).statement);
                break;
            case ts.SyntaxKind.IfStatement:
                generateNames((<ts.IfStatement>node).thenStatement);
                generateNames((<ts.IfStatement>node).elseStatement);
                break;
            case ts.SyntaxKind.ForStatement:
            case ts.SyntaxKind.ForOfStatement:
            case ts.SyntaxKind.ForInStatement:
                generateNames((<ts.ForStatement | ts.ForInOrOfStatement>node).initializer);
                generateNames((<ts.ForStatement | ts.ForInOrOfStatement>node).statement);
                break;
            case ts.SyntaxKind.SwitchStatement:
                generateNames((<ts.SwitchStatement>node).caseBlock);
                break;
            case ts.SyntaxKind.CaseBlock:
                ts.forEach((<ts.CaseBlock>node).clauses, generateNames);
                break;
            case ts.SyntaxKind.CaseClause:
            case ts.SyntaxKind.DefaultClause:
                ts.forEach((<ts.CaseOrDefaultClause>node).statements, generateNames);
                break;
            case ts.SyntaxKind.TryStatement:
                generateNames((<ts.TryStatement>node).tryBlock);
                generateNames((<ts.TryStatement>node).catchClause);
                generateNames((<ts.TryStatement>node).finallyBlock);
                break;
            case ts.SyntaxKind.CatchClause:
                generateNames((<ts.CatchClause>node).variableDeclaration);
                generateNames((<ts.CatchClause>node).block);
                break;
            case ts.SyntaxKind.VariableStatement:
                generateNames((<ts.VariableStatement>node).declarationList);
                break;
            case ts.SyntaxKind.VariableDeclarationList:
                ts.forEach((<ts.VariableDeclarationList>node).declarations, generateNames);
                break;
            case ts.SyntaxKind.VariableDeclaration:
            case ts.SyntaxKind.Parameter:
            case ts.SyntaxKind.BindingElement:
            case ts.SyntaxKind.ClassDeclaration:
                generateNameIfNeeded((<ts.NamedDeclaration>node).name);
                break;
            case ts.SyntaxKind.FunctionDeclaration:
                generateNameIfNeeded((<ts.FunctionDeclaration>node).name);
                if (ts.getEmitFlags(node) & ts.EmitFlags.ReuseTempVariableScope) {
                    ts.forEach((<ts.FunctionDeclaration>node).parameters, generateNames);
                    generateNames((<ts.FunctionDeclaration>node).body);
                }
                break;
            case ts.SyntaxKind.ObjectBindingPattern:
            case ts.SyntaxKind.ArrayBindingPattern:
                ts.forEach((<ts.BindingPattern>node).elements, generateNames);
                break;
            case ts.SyntaxKind.ImportDeclaration:
                generateNames((<ts.ImportDeclaration>node).importClause);
                break;
            case ts.SyntaxKind.ImportClause:
                generateNameIfNeeded((<ts.ImportClause>node).name);
                generateNames((<ts.ImportClause>node).namedBindings);
                break;
            case ts.SyntaxKind.NamespaceImport:
                generateNameIfNeeded((<ts.NamespaceImport>node).name);
                break;
            case ts.SyntaxKind.NamedImports:
                ts.forEach((<ts.NamedImports>node).elements, generateNames);
                break;
            case ts.SyntaxKind.ImportSpecifier:
                generateNameIfNeeded((<ts.ImportSpecifier>node).propertyName || (<ts.ImportSpecifier>node).name);
                break;
        }
    }
    function generateMemberNames(node: ts.Node | undefined) {
        if (!node)
            return;
        switch (node.kind) {
            case ts.SyntaxKind.PropertyAssignment:
            case ts.SyntaxKind.ShorthandPropertyAssignment:
            case ts.SyntaxKind.PropertyDeclaration:
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
                generateNameIfNeeded((<ts.NamedDeclaration>node).name);
                break;
        }
    }
    function generateNameIfNeeded(name: ts.DeclarationName | undefined) {
        if (name) {
            if (ts.isGeneratedIdentifier(name)) {
                generateName(name);
            }
            else if (ts.isBindingPattern(name)) {
                generateNames(name);
            }
        }
    }
    /**
     * Generate the text for a generated identifier.
     */
    function generateName(name: ts.GeneratedIdentifier) {
        if ((name.autoGenerateFlags & ts.GeneratedIdentifierFlags.KindMask) === ts.GeneratedIdentifierFlags.Node) {
            // Node names generate unique names based on their original node
            // and are cached based on that node's id.
            return generateNameCached(getNodeForGeneratedName(name), name.autoGenerateFlags);
        }
        else {
            // Auto, Loop, and Unique names are cached based on their unique
            // autoGenerateId.
            const autoGenerateId = name.autoGenerateId!;
            return autoGeneratedIdToGeneratedName[autoGenerateId] || (autoGeneratedIdToGeneratedName[autoGenerateId] = makeName(name));
        }
    }
    function generateNameCached(node: ts.Node, flags?: ts.GeneratedIdentifierFlags) {
        const nodeId = ts.getNodeId(node);
        return nodeIdToGeneratedName[nodeId] || (nodeIdToGeneratedName[nodeId] = generateNameForNode(node, flags));
    }
    /**
     * Returns a value indicating whether a name is unique globally, within the current file,
     * or within the NameGenerator.
     */
    function isUniqueName(name: string): boolean {
        return isFileLevelUniqueName(name)
            && !generatedNames.has(name)
            && !(reservedNames && reservedNames.has(name));
    }
    /**
     * Returns a value indicating whether a name is unique globally or within the current file.
     */
    function isFileLevelUniqueName(name: string) {
        return currentSourceFile ? ts.isFileLevelUniqueName(currentSourceFile, name, hasGlobalName) : true;
    }
    /**
     * Returns a value indicating whether a name is unique within a container.
     */
    function isUniqueLocalName(name: string, container: ts.Node): boolean {
        for (let node = container; ts.isNodeDescendantOf(node, container); node = node.nextContainer!) {
            if (node.locals) {
                const local = node.locals.get(ts.escapeLeadingUnderscores(name));
                // We conservatively include alias symbols to cover cases where they're emitted as locals
                if (local && local.flags & (ts.SymbolFlags.Value | ts.SymbolFlags.ExportValue | ts.SymbolFlags.Alias)) {
                    return false;
                }
            }
        }
        return true;
    }
    /**
     * Return the next available name in the pattern _a ... _z, _0, _1, ...
     * TempFlags._i or TempFlags._n may be used to express a preference for that dedicated name.
     * Note that names generated by makeTempVariableName and makeUniqueName will never conflict.
     */
    function makeTempVariableName(flags: TempFlags, reservedInNestedScopes?: boolean): string {
        if (flags && !(tempFlags & flags)) {
            const name = flags === TempFlags._i ? "_i" : "_n";
            if (isUniqueName(name)) {
                tempFlags |= flags;
                if (reservedInNestedScopes) {
                    reserveNameInNestedScopes(name);
                }
                return name;
            }
        }
        while (true) {
            const count = tempFlags & TempFlags.CountMask;
            tempFlags++;
            // Skip over 'i' and 'n'
            if (count !== 8 && count !== 13) {
                const name = count < 26
                    ? "_" + String.fromCharCode(ts.CharacterCodes.a + count)
                    : "_" + (count - 26);
                if (isUniqueName(name)) {
                    if (reservedInNestedScopes) {
                        reserveNameInNestedScopes(name);
                    }
                    return name;
                }
            }
        }
    }
    /**
     * Generate a name that is unique within the current file and doesn't conflict with any names
     * in global scope. The name is formed by adding an '_n' suffix to the specified base name,
     * where n is a positive integer. Note that names generated by makeTempVariableName and
     * makeUniqueName are guaranteed to never conflict.
     * If `optimistic` is set, the first instance will use 'baseName' verbatim instead of 'baseName_1'
     */
    function makeUniqueName(baseName: string, checkFn: (name: string) => boolean = isUniqueName, optimistic?: boolean, scoped?: boolean): string {
        if (optimistic) {
            if (checkFn(baseName)) {
                if (scoped) {
                    reserveNameInNestedScopes(baseName);
                }
                else {
                    generatedNames.set(baseName, true);
                }
                return baseName;
            }
        }
        // Find the first unique 'name_n', where n is a positive number
        if (baseName.charCodeAt(baseName.length - 1) !== ts.CharacterCodes._) {
            baseName += "_";
        }
        let i = 1;
        while (true) {
            const generatedName = baseName + i;
            if (checkFn(generatedName)) {
                if (scoped) {
                    reserveNameInNestedScopes(generatedName);
                }
                else {
                    generatedNames.set(generatedName, true);
                }
                return generatedName;
            }
            i++;
        }
    }
    function makeFileLevelOptimisticUniqueName(name: string) {
        return makeUniqueName(name, isFileLevelUniqueName, /*optimistic*/ true);
    }
    /**
     * Generates a unique name for a ModuleDeclaration or EnumDeclaration.
     */
    function generateNameForModuleOrEnum(node: ts.ModuleDeclaration | ts.EnumDeclaration) {
        const name = getTextOfNode(node.name);
        // Use module/enum name itself if it is unique, otherwise make a unique variation
        return isUniqueLocalName(name, node) ? name : makeUniqueName(name);
    }
    /**
     * Generates a unique name for an ImportDeclaration or ExportDeclaration.
     */
    function generateNameForImportOrExportDeclaration(node: ts.ImportDeclaration | ts.ExportDeclaration) {
        const expr = (ts.getExternalModuleName(node)!); // TODO: GH#18217
        const baseName = ts.isStringLiteral(expr) ?
            ts.makeIdentifierFromModuleName(expr.text) : "module";
        return makeUniqueName(baseName);
    }
    /**
     * Generates a unique name for a default export.
     */
    function generateNameForExportDefault() {
        return makeUniqueName("default");
    }
    /**
     * Generates a unique name for a class expression.
     */
    function generateNameForClassExpression() {
        return makeUniqueName("class");
    }
    function generateNameForMethodOrAccessor(node: ts.MethodDeclaration | ts.AccessorDeclaration) {
        if (ts.isIdentifier(node.name)) {
            return generateNameCached(node.name);
        }
        return makeTempVariableName(TempFlags.Auto);
    }
    /**
     * Generates a unique name from a node.
     */
    function generateNameForNode(node: ts.Node, flags?: ts.GeneratedIdentifierFlags): string {
        switch (node.kind) {
            case ts.SyntaxKind.Identifier:
                return makeUniqueName(getTextOfNode(node), isUniqueName, !!((flags!) & ts.GeneratedIdentifierFlags.Optimistic), !!((flags!) & ts.GeneratedIdentifierFlags.ReservedInNestedScopes));
            case ts.SyntaxKind.ModuleDeclaration:
            case ts.SyntaxKind.EnumDeclaration:
                return generateNameForModuleOrEnum((<ts.ModuleDeclaration | ts.EnumDeclaration>node));
            case ts.SyntaxKind.ImportDeclaration:
            case ts.SyntaxKind.ExportDeclaration:
                return generateNameForImportOrExportDeclaration((<ts.ImportDeclaration | ts.ExportDeclaration>node));
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.ClassDeclaration:
            case ts.SyntaxKind.ExportAssignment:
                return generateNameForExportDefault();
            case ts.SyntaxKind.ClassExpression:
                return generateNameForClassExpression();
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
                return generateNameForMethodOrAccessor((<ts.MethodDeclaration | ts.AccessorDeclaration>node));
            case ts.SyntaxKind.ComputedPropertyName:
                return makeTempVariableName(TempFlags.Auto, /*reserveInNestedScopes*/ true);
            default:
                return makeTempVariableName(TempFlags.Auto);
        }
    }
    /**
     * Generates a unique identifier for a node.
     */
    function makeName(name: ts.GeneratedIdentifier) {
        switch (name.autoGenerateFlags & ts.GeneratedIdentifierFlags.KindMask) {
            case ts.GeneratedIdentifierFlags.Auto:
                return makeTempVariableName(TempFlags.Auto, !!(name.autoGenerateFlags & ts.GeneratedIdentifierFlags.ReservedInNestedScopes));
            case ts.GeneratedIdentifierFlags.Loop:
                return makeTempVariableName(TempFlags._i, !!(name.autoGenerateFlags & ts.GeneratedIdentifierFlags.ReservedInNestedScopes));
            case ts.GeneratedIdentifierFlags.Unique:
                return makeUniqueName(ts.idText(name), (name.autoGenerateFlags & ts.GeneratedIdentifierFlags.FileLevel) ? isFileLevelUniqueName : isUniqueName, !!(name.autoGenerateFlags & ts.GeneratedIdentifierFlags.Optimistic), !!(name.autoGenerateFlags & ts.GeneratedIdentifierFlags.ReservedInNestedScopes));
        }
        return ts.Debug.fail("Unsupported GeneratedIdentifierKind.");
    }
    /**
     * Gets the node from which a name should be generated.
     */
    function getNodeForGeneratedName(name: ts.GeneratedIdentifier) {
        const autoGenerateId = name.autoGenerateId;
        let node = (name as ts.Node);
        let original = node.original;
        while (original) {
            node = original;
            // if "node" is a different generated name (having a different
            // "autoGenerateId"), use it and stop traversing.
            if (ts.isIdentifier(node)
                && !!((node.autoGenerateFlags!) & ts.GeneratedIdentifierFlags.Node)
                && node.autoGenerateId !== autoGenerateId) {
                break;
            }
            original = node.original;
        }
        // otherwise, return the original node for the source;
        return node;
    }
    // Comments
    function pipelineEmitWithComments(hint: ts.EmitHint, node: ts.Node) {
        ts.Debug.assert(lastNode === node || lastSubstitution === node);
        enterComment();
        hasWrittenComment = false;
        const emitFlags = ts.getEmitFlags(node);
        const { pos, end } = ts.getCommentRange(node);
        const isEmittedNode = node.kind !== ts.SyntaxKind.NotEmittedStatement;
        // We have to explicitly check that the node is JsxText because if the compilerOptions.jsx is "preserve" we will not do any transformation.
        // It is expensive to walk entire tree just to set one kind of node to have no comments.
        const skipLeadingComments = pos < 0 || (emitFlags & ts.EmitFlags.NoLeadingComments) !== 0 || node.kind === ts.SyntaxKind.JsxText;
        const skipTrailingComments = end < 0 || (emitFlags & ts.EmitFlags.NoTrailingComments) !== 0 || node.kind === ts.SyntaxKind.JsxText;
        // Save current container state on the stack.
        const savedContainerPos = containerPos;
        const savedContainerEnd = containerEnd;
        const savedDeclarationListContainerEnd = declarationListContainerEnd;
        if ((pos > 0 || end > 0) && pos !== end) {
            // Emit leading comments if the position is not synthesized and the node
            // has not opted out from emitting leading comments.
            if (!skipLeadingComments) {
                emitLeadingComments(pos, isEmittedNode);
            }
            if (!skipLeadingComments || (pos >= 0 && (emitFlags & ts.EmitFlags.NoLeadingComments) !== 0)) {
                // Advance the container position if comments get emitted or if they've been disabled explicitly using NoLeadingComments.
                containerPos = pos;
            }
            if (!skipTrailingComments || (end >= 0 && (emitFlags & ts.EmitFlags.NoTrailingComments) !== 0)) {
                // As above.
                containerEnd = end;
                // To avoid invalid comment emit in a down-level binding pattern, we
                // keep track of the last declaration list container's end
                if (node.kind === ts.SyntaxKind.VariableDeclarationList) {
                    declarationListContainerEnd = end;
                }
            }
        }
        ts.forEach(ts.getSyntheticLeadingComments(node), emitLeadingSynthesizedComment);
        exitComment();
        const pipelinePhase = getNextPipelinePhase(PipelinePhase.Comments, node);
        if (emitFlags & ts.EmitFlags.NoNestedComments) {
            commentsDisabled = true;
            pipelinePhase(hint, node);
            commentsDisabled = false;
        }
        else {
            pipelinePhase(hint, node);
        }
        enterComment();
        ts.forEach(ts.getSyntheticTrailingComments(node), emitTrailingSynthesizedComment);
        if ((pos > 0 || end > 0) && pos !== end) {
            // Restore previous container state.
            containerPos = savedContainerPos;
            containerEnd = savedContainerEnd;
            declarationListContainerEnd = savedDeclarationListContainerEnd;
            // Emit trailing comments if the position is not synthesized and the node
            // has not opted out from emitting leading comments and is an emitted node.
            if (!skipTrailingComments && isEmittedNode) {
                emitTrailingComments(end);
            }
        }
        exitComment();
        ts.Debug.assert(lastNode === node || lastSubstitution === node);
    }
    function emitLeadingSynthesizedComment(comment: ts.SynthesizedComment) {
        if (comment.kind === ts.SyntaxKind.SingleLineCommentTrivia) {
            writer.writeLine();
        }
        writeSynthesizedComment(comment);
        if (comment.hasTrailingNewLine || comment.kind === ts.SyntaxKind.SingleLineCommentTrivia) {
            writer.writeLine();
        }
        else {
            writer.writeSpace(" ");
        }
    }
    function emitTrailingSynthesizedComment(comment: ts.SynthesizedComment) {
        if (!writer.isAtStartOfLine()) {
            writer.writeSpace(" ");
        }
        writeSynthesizedComment(comment);
        if (comment.hasTrailingNewLine) {
            writer.writeLine();
        }
    }
    function writeSynthesizedComment(comment: ts.SynthesizedComment) {
        const text = formatSynthesizedComment(comment);
        const lineMap = comment.kind === ts.SyntaxKind.MultiLineCommentTrivia ? ts.computeLineStarts(text) : undefined;
        ts.writeCommentRange(text, (lineMap!), writer, 0, text.length, newLine);
    }
    function formatSynthesizedComment(comment: ts.SynthesizedComment) {
        return comment.kind === ts.SyntaxKind.MultiLineCommentTrivia
            ? `/*${comment.text}*/`
            : `//${comment.text}`;
    }
    function emitBodyWithDetachedComments(node: ts.Node, detachedRange: ts.TextRange, emitCallback: (node: ts.Node) => void) {
        enterComment();
        const { pos, end } = detachedRange;
        const emitFlags = ts.getEmitFlags(node);
        const skipLeadingComments = pos < 0 || (emitFlags & ts.EmitFlags.NoLeadingComments) !== 0;
        const skipTrailingComments = commentsDisabled || end < 0 || (emitFlags & ts.EmitFlags.NoTrailingComments) !== 0;
        if (!skipLeadingComments) {
            emitDetachedCommentsAndUpdateCommentsInfo(detachedRange);
        }
        exitComment();
        if (emitFlags & ts.EmitFlags.NoNestedComments && !commentsDisabled) {
            commentsDisabled = true;
            emitCallback(node);
            commentsDisabled = false;
        }
        else {
            emitCallback(node);
        }
        enterComment();
        if (!skipTrailingComments) {
            emitLeadingComments(detachedRange.end, /*isEmittedNode*/ true);
            if (hasWrittenComment && !writer.isAtStartOfLine()) {
                writer.writeLine();
            }
        }
        exitComment();
    }
    function emitLeadingComments(pos: number, isEmittedNode: boolean) {
        hasWrittenComment = false;
        if (isEmittedNode) {
            forEachLeadingCommentToEmit(pos, emitLeadingComment);
        }
        else if (pos === 0) {
            // If the node will not be emitted in JS, remove all the comments(normal, pinned and ///) associated with the node,
            // unless it is a triple slash comment at the top of the file.
            // For Example:
            //      /// <reference-path ...>
            //      declare var x;
            //      /// <reference-path ...>
            //      interface F {}
            //  The first /// will NOT be removed while the second one will be removed even though both node will not be emitted
            forEachLeadingCommentToEmit(pos, emitTripleSlashLeadingComment);
        }
    }
    function emitTripleSlashLeadingComment(commentPos: number, commentEnd: number, kind: ts.SyntaxKind, hasTrailingNewLine: boolean, rangePos: number) {
        if (isTripleSlashComment(commentPos, commentEnd)) {
            emitLeadingComment(commentPos, commentEnd, kind, hasTrailingNewLine, rangePos);
        }
    }
    function shouldWriteComment(text: string, pos: number) {
        if (printerOptions.onlyPrintJsDocStyle) {
            return (ts.isJSDocLikeText(text, pos) || ts.isPinnedComment(text, pos));
        }
        return true;
    }
    function emitLeadingComment(commentPos: number, commentEnd: number, kind: ts.SyntaxKind, hasTrailingNewLine: boolean, rangePos: number) {
        if (!shouldWriteComment(currentSourceFile!.text, commentPos))
            return;
        if (!hasWrittenComment) {
            ts.emitNewLineBeforeLeadingCommentOfPosition(getCurrentLineMap(), writer, rangePos, commentPos);
            hasWrittenComment = true;
        }
        // Leading comments are emitted at /*leading comment1 */space/*leading comment*/space
        emitPos(commentPos);
        ts.writeCommentRange(currentSourceFile!.text, getCurrentLineMap(), writer, commentPos, commentEnd, newLine);
        emitPos(commentEnd);
        if (hasTrailingNewLine) {
            writer.writeLine();
        }
        else if (kind === ts.SyntaxKind.MultiLineCommentTrivia) {
            writer.writeSpace(" ");
        }
    }
    function emitLeadingCommentsOfPosition(pos: number) {
        if (commentsDisabled || pos === -1) {
            return;
        }
        emitLeadingComments(pos, /*isEmittedNode*/ true);
    }
    function emitTrailingComments(pos: number) {
        forEachTrailingCommentToEmit(pos, emitTrailingComment);
    }
    function emitTrailingComment(commentPos: number, commentEnd: number, _kind: ts.SyntaxKind, hasTrailingNewLine: boolean) {
        if (!shouldWriteComment(currentSourceFile!.text, commentPos))
            return;
        // trailing comments are emitted at space/*trailing comment1 */space/*trailing comment2*/
        if (!writer.isAtStartOfLine()) {
            writer.writeSpace(" ");
        }
        emitPos(commentPos);
        ts.writeCommentRange(currentSourceFile!.text, getCurrentLineMap(), writer, commentPos, commentEnd, newLine);
        emitPos(commentEnd);
        if (hasTrailingNewLine) {
            writer.writeLine();
        }
    }
    function emitTrailingCommentsOfPosition(pos: number, prefixSpace?: boolean) {
        if (commentsDisabled) {
            return;
        }
        enterComment();
        forEachTrailingCommentToEmit(pos, prefixSpace ? emitTrailingComment : emitTrailingCommentOfPosition);
        exitComment();
    }
    function emitTrailingCommentOfPosition(commentPos: number, commentEnd: number, _kind: ts.SyntaxKind, hasTrailingNewLine: boolean) {
        // trailing comments of a position are emitted at /*trailing comment1 */space/*trailing comment*/space
        emitPos(commentPos);
        ts.writeCommentRange(currentSourceFile!.text, getCurrentLineMap(), writer, commentPos, commentEnd, newLine);
        emitPos(commentEnd);
        if (hasTrailingNewLine) {
            writer.writeLine();
        }
        else {
            writer.writeSpace(" ");
        }
    }
    function forEachLeadingCommentToEmit(pos: number, cb: (commentPos: number, commentEnd: number, kind: ts.SyntaxKind, hasTrailingNewLine: boolean, rangePos: number) => void) {
        // Emit the leading comments only if the container's pos doesn't match because the container should take care of emitting these comments
        if (currentSourceFile && (containerPos === -1 || pos !== containerPos)) {
            if (hasDetachedComments(pos)) {
                forEachLeadingCommentWithoutDetachedComments(cb);
            }
            else {
                ts.forEachLeadingCommentRange(currentSourceFile.text, pos, cb, /*state*/ pos);
            }
        }
    }
    function forEachTrailingCommentToEmit(end: number, cb: (commentPos: number, commentEnd: number, kind: ts.SyntaxKind, hasTrailingNewLine: boolean) => void) {
        // Emit the trailing comments only if the container's end doesn't match because the container should take care of emitting these comments
        if (currentSourceFile && (containerEnd === -1 || (end !== containerEnd && end !== declarationListContainerEnd))) {
            ts.forEachTrailingCommentRange(currentSourceFile.text, end, cb);
        }
    }
    function hasDetachedComments(pos: number) {
        return detachedCommentsInfo !== undefined && ts.last(detachedCommentsInfo).nodePos === pos;
    }
    function forEachLeadingCommentWithoutDetachedComments(cb: (commentPos: number, commentEnd: number, kind: ts.SyntaxKind, hasTrailingNewLine: boolean, rangePos: number) => void) {
        // get the leading comments from detachedPos
        const pos = ts.last((detachedCommentsInfo!)).detachedCommentEndPos;
        if (detachedCommentsInfo!.length - 1) {
            detachedCommentsInfo!.pop();
        }
        else {
            detachedCommentsInfo = undefined;
        }
        ts.forEachLeadingCommentRange(currentSourceFile!.text, pos, cb, /*state*/ pos);
    }
    function emitDetachedCommentsAndUpdateCommentsInfo(range: ts.TextRange) {
        const currentDetachedCommentInfo = ts.emitDetachedComments(currentSourceFile!.text, getCurrentLineMap(), writer, emitComment, range, newLine, commentsDisabled);
        if (currentDetachedCommentInfo) {
            if (detachedCommentsInfo) {
                detachedCommentsInfo.push(currentDetachedCommentInfo);
            }
            else {
                detachedCommentsInfo = [currentDetachedCommentInfo];
            }
        }
    }
    function emitComment(text: string, lineMap: number[], writer: ts.EmitTextWriter, commentPos: number, commentEnd: number, newLine: string) {
        if (!shouldWriteComment(currentSourceFile!.text, commentPos))
            return;
        emitPos(commentPos);
        ts.writeCommentRange(text, lineMap, writer, commentPos, commentEnd, newLine);
        emitPos(commentEnd);
    }
    /**
     * Determine if the given comment is a triple-slash
     *
     * @return true if the comment is a triple-slash comment else false
     */
    function isTripleSlashComment(commentPos: number, commentEnd: number) {
        return ts.isRecognizedTripleSlashComment(currentSourceFile!.text, commentPos, commentEnd);
    }
    // Source Maps
    function getParsedSourceMap(node: ts.UnparsedSource) {
        if (node.parsedSourceMap === undefined && node.sourceMapText !== undefined) {
            node.parsedSourceMap = ts.tryParseRawSourceMap(node.sourceMapText) || false;
        }
        return node.parsedSourceMap || undefined;
    }
    function pipelineEmitWithSourceMap(hint: ts.EmitHint, node: ts.Node) {
        ts.Debug.assert(lastNode === node || lastSubstitution === node);
        const pipelinePhase = getNextPipelinePhase(PipelinePhase.SourceMaps, node);
        if (ts.isUnparsedSource(node) || ts.isUnparsedPrepend(node)) {
            pipelinePhase(hint, node);
        }
        else if (ts.isUnparsedNode(node)) {
            const parsed = getParsedSourceMap(node.parent);
            if (parsed && sourceMapGenerator) {
                sourceMapGenerator.appendSourceMap(writer.getLine(), writer.getColumn(), parsed, node.parent.sourceMapPath!, node.parent.getLineAndCharacterOfPosition(node.pos), node.parent.getLineAndCharacterOfPosition(node.end));
            }
            pipelinePhase(hint, node);
        }
        else {
            const { pos, end, source = sourceMapSource } = ts.getSourceMapRange(node);
            const emitFlags = ts.getEmitFlags(node);
            if (node.kind !== ts.SyntaxKind.NotEmittedStatement
                && (emitFlags & ts.EmitFlags.NoLeadingSourceMap) === 0
                && pos >= 0) {
                emitSourcePos(source, skipSourceTrivia(source, pos));
            }
            if (emitFlags & ts.EmitFlags.NoNestedSourceMaps) {
                sourceMapsDisabled = true;
                pipelinePhase(hint, node);
                sourceMapsDisabled = false;
            }
            else {
                pipelinePhase(hint, node);
            }
            if (node.kind !== ts.SyntaxKind.NotEmittedStatement
                && (emitFlags & ts.EmitFlags.NoTrailingSourceMap) === 0
                && end >= 0) {
                emitSourcePos(source, end);
            }
        }
        ts.Debug.assert(lastNode === node || lastSubstitution === node);
    }
    /**
     * Skips trivia such as comments and white-space that can be optionally overridden by the source-map source
     */
    function skipSourceTrivia(source: ts.SourceMapSource, pos: number): number {
        return source.skipTrivia ? source.skipTrivia(pos) : ts.skipTrivia(source.text, pos);
    }
    /**
     * Emits a mapping.
     *
     * If the position is synthetic (undefined or a negative value), no mapping will be
     * created.
     *
     * @param pos The position.
     */
    function emitPos(pos: number) {
        if (sourceMapsDisabled || ts.positionIsSynthesized(pos) || isJsonSourceMapSource(sourceMapSource)) {
            return;
        }
        const { line: sourceLine, character: sourceCharacter } = ts.getLineAndCharacterOfPosition(sourceMapSource, pos);
        sourceMapGenerator!.addMapping(writer.getLine(), writer.getColumn(), sourceMapSourceIndex, sourceLine, sourceCharacter, 
        /*nameIndex*/ undefined);
    }
    function emitSourcePos(source: ts.SourceMapSource, pos: number) {
        if (source !== sourceMapSource) {
            const savedSourceMapSource = sourceMapSource;
            setSourceMapSource(source);
            emitPos(pos);
            setSourceMapSource(savedSourceMapSource);
        }
        else {
            emitPos(pos);
        }
    }
    /**
     * Emits a token of a node with possible leading and trailing source maps.
     *
     * @param node The node containing the token.
     * @param token The token to emit.
     * @param tokenStartPos The start pos of the token.
     * @param emitCallback The callback used to emit the token.
     */
    function emitTokenWithSourceMap(node: ts.Node | undefined, token: ts.SyntaxKind, writer: (s: string) => void, tokenPos: number, emitCallback: (token: ts.SyntaxKind, writer: (s: string) => void, tokenStartPos: number) => number) {
        if (sourceMapsDisabled || node && ts.isInJsonFile(node)) {
            return emitCallback(token, writer, tokenPos);
        }
        const emitNode = node && node.emitNode;
        const emitFlags = emitNode && emitNode.flags || ts.EmitFlags.None;
        const range = emitNode && emitNode.tokenSourceMapRanges && emitNode.tokenSourceMapRanges[token];
        const source = range && range.source || sourceMapSource;
        tokenPos = skipSourceTrivia(source, range ? range.pos : tokenPos);
        if ((emitFlags & ts.EmitFlags.NoTokenLeadingSourceMaps) === 0 && tokenPos >= 0) {
            emitSourcePos(source, tokenPos);
        }
        tokenPos = emitCallback(token, writer, tokenPos);
        if (range)
            tokenPos = range.end;
        if ((emitFlags & ts.EmitFlags.NoTokenTrailingSourceMaps) === 0 && tokenPos >= 0) {
            emitSourcePos(source, tokenPos);
        }
        return tokenPos;
    }
    function setSourceMapSource(source: ts.SourceMapSource) {
        if (sourceMapsDisabled) {
            return;
        }
        sourceMapSource = source;
        if (isJsonSourceMapSource(source)) {
            return;
        }
        sourceMapSourceIndex = sourceMapGenerator!.addSource(source.fileName);
        if (printerOptions.inlineSources) {
            sourceMapGenerator!.setSourceContent(sourceMapSourceIndex, source.text);
        }
    }
    function isJsonSourceMapSource(sourceFile: ts.SourceMapSource) {
        return ts.fileExtensionIs(sourceFile.fileName, ts.Extension.Json);
    }
}
function createBracketsMap() {
    const brackets: string[][] = [];
    brackets[ts.ListFormat.Braces] = ["{", "}"];
    brackets[ts.ListFormat.Parenthesis] = ["(", ")"];
    brackets[ts.ListFormat.AngleBrackets] = ["<", ">"];
    brackets[ts.ListFormat.SquareBrackets] = ["[", "]"];
    return brackets;
}
function getOpeningBracket(format: ts.ListFormat) {
    return brackets[format & ts.ListFormat.BracketsMask][0];
}
function getClosingBracket(format: ts.ListFormat) {
    return brackets[format & ts.ListFormat.BracketsMask][1];
}
// Flags enum to track count of temp variables and a few dedicated names
const enum TempFlags {
    Auto = 0x00000000,
    CountMask = 0x0FFFFFFF,
    _i = 0x10000000
}
