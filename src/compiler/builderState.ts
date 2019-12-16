/*@internal*/
namespace ts {
    export function getFileEmitOutput(program: ts.Program, sourceFile: ts.SourceFile, emitOnlyDtsFiles: boolean, cancellationToken?: ts.CancellationToken, customTransformers?: ts.CustomTransformers, forceDtsEmit?: boolean): ts.EmitOutput {
        const outputFiles: ts.OutputFile[] = [];
        const emitResult = program.emit(sourceFile, writeFile, cancellationToken, emitOnlyDtsFiles, customTransformers, forceDtsEmit);
        return { outputFiles, emitSkipped: emitResult.emitSkipped, exportedModulesFromDeclarationEmit: emitResult.exportedModulesFromDeclarationEmit };
        function writeFile(fileName: string, text: string, writeByteOrderMark: boolean) {
            outputFiles.push({ name: fileName, writeByteOrderMark, text });
        }
    }
    export interface ReusableBuilderState {
        /**
         * Information of the file eg. its version, signature etc
         */
        fileInfos: ts.ReadonlyMap<BuilderState.FileInfo>;
        /**
         * Contains the map of ReferencedSet=Referenced files of the file if module emit is enabled
         * Otherwise undefined
         * Thus non undefined value indicates, module emit
         */
        readonly referencedMap?: ts.ReadonlyMap<BuilderState.ReferencedSet> | undefined;
        /**
         * Contains the map of exported modules ReferencedSet=exported module files from the file if module emit is enabled
         * Otherwise undefined
         */
        readonly exportedModulesMap?: ts.ReadonlyMap<BuilderState.ReferencedSet> | undefined;
    }
    export interface BuilderState {
        /**
         * Information of the file eg. its version, signature etc
         */
        fileInfos: ts.Map<BuilderState.FileInfo>;
        /**
         * Contains the map of ReferencedSet=Referenced files of the file if module emit is enabled
         * Otherwise undefined
         * Thus non undefined value indicates, module emit
         */
        readonly referencedMap: ts.ReadonlyMap<BuilderState.ReferencedSet> | undefined;
        /**
         * Contains the map of exported modules ReferencedSet=exported module files from the file if module emit is enabled
         * Otherwise undefined
         */
        readonly exportedModulesMap: ts.Map<BuilderState.ReferencedSet> | undefined;
        /**
         * Map of files that have already called update signature.
         * That means hence forth these files are assumed to have
         * no change in their signature for this version of the program
         */
        hasCalledUpdateShapeSignature: ts.Map<true>;
        /**
         * Cache of all files excluding default library file for the current program
         */
        allFilesExcludingDefaultLibraryFile?: readonly ts.SourceFile[];
        /**
         * Cache of all the file names
         */
        allFileNames?: readonly string[];
    }
    export namespace BuilderState {
        /**
         * Information about the source file: Its version and optional signature from last emit
         */
        export interface FileInfo {
            readonly version: string;
            signature: string | undefined;
        }
        /**
         * Referenced files with values for the keys as referenced file's path to be true
         */
        export type ReferencedSet = ts.ReadonlyMap<true>;
        /**
         * Compute the hash to store the shape of the file
         */
        export type ComputeHash = (data: string) => string;
        /**
         * Exported modules to from declaration emit being computed.
         * This can contain false in the affected file path to specify that there are no exported module(types from other modules) for this file
         */
        export type ComputingExportedModulesMap = ts.Map<ReferencedSet | false>;
        /**
         * Get the referencedFile from the imported module symbol
         */
        function getReferencedFileFromImportedModuleSymbol(symbol: ts.Symbol) {
            if (symbol.declarations && symbol.declarations[0]) {
                const declarationSourceFile = ts.getSourceFileOfNode(symbol.declarations[0]);
                return declarationSourceFile && declarationSourceFile.resolvedPath;
            }
        }
        /**
         * Get the referencedFile from the import name node from file
         */
        function getReferencedFileFromImportLiteral(checker: ts.TypeChecker, importName: ts.StringLiteralLike) {
            const symbol = checker.getSymbolAtLocation(importName);
            return symbol && getReferencedFileFromImportedModuleSymbol(symbol);
        }
        /**
         * Gets the path to reference file from file name, it could be resolvedPath if present otherwise path
         */
        function getReferencedFileFromFileName(program: ts.Program, fileName: string, sourceFileDirectory: ts.Path, getCanonicalFileName: ts.GetCanonicalFileName): ts.Path {
            return ts.toPath(program.getProjectReferenceRedirect(fileName) || fileName, sourceFileDirectory, getCanonicalFileName);
        }
        /**
         * Gets the referenced files for a file from the program with values for the keys as referenced file's path to be true
         */
        function getReferencedFiles(program: ts.Program, sourceFile: ts.SourceFile, getCanonicalFileName: ts.GetCanonicalFileName): ts.Map<true> | undefined {
            let referencedFiles: ts.Map<true> | undefined;
            // We need to use a set here since the code can contain the same import twice,
            // but that will only be one dependency.
            // To avoid invernal conversion, the key of the referencedFiles map must be of type Path
            if (sourceFile.imports && sourceFile.imports.length > 0) {
                const checker: ts.TypeChecker = program.getTypeChecker();
                for (const importName of sourceFile.imports) {
                    const declarationSourceFilePath = getReferencedFileFromImportLiteral(checker, importName);
                    if (declarationSourceFilePath) {
                        addReferencedFile(declarationSourceFilePath);
                    }
                }
            }
            const sourceFileDirectory = ts.getDirectoryPath(sourceFile.path);
            // Handle triple slash references
            if (sourceFile.referencedFiles && sourceFile.referencedFiles.length > 0) {
                for (const referencedFile of sourceFile.referencedFiles) {
                    const referencedPath = getReferencedFileFromFileName(program, referencedFile.fileName, sourceFileDirectory, getCanonicalFileName);
                    addReferencedFile(referencedPath);
                }
            }
            // Handle type reference directives
            if (sourceFile.resolvedTypeReferenceDirectiveNames) {
                sourceFile.resolvedTypeReferenceDirectiveNames.forEach((resolvedTypeReferenceDirective) => {
                    if (!resolvedTypeReferenceDirective) {
                        return;
                    }
                    const fileName = resolvedTypeReferenceDirective.resolvedFileName!; // TODO: GH#18217
                    const typeFilePath = getReferencedFileFromFileName(program, fileName, sourceFileDirectory, getCanonicalFileName);
                    addReferencedFile(typeFilePath);
                });
            }
            // Add module augmentation as references
            if (sourceFile.moduleAugmentations.length) {
                const checker = program.getTypeChecker();
                for (const moduleName of sourceFile.moduleAugmentations) {
                    if (!ts.isStringLiteral(moduleName)) {
                        continue;
                    }
                    const symbol = checker.getSymbolAtLocation(moduleName);
                    if (!symbol) {
                        continue;
                    }
                    // Add any file other than our own as reference
                    addReferenceFromAmbientModule(symbol);
                }
            }
            // From ambient modules
            for (const ambientModule of program.getTypeChecker().getAmbientModules()) {
                if (ambientModule.declarations.length > 1) {
                    addReferenceFromAmbientModule(ambientModule);
                }
            }
            return referencedFiles;
            function addReferenceFromAmbientModule(symbol: ts.Symbol) {
                // Add any file other than our own as reference
                for (const declaration of symbol.declarations) {
                    const declarationSourceFile = ts.getSourceFileOfNode(declaration);
                    if (declarationSourceFile &&
                        declarationSourceFile !== sourceFile) {
                        addReferencedFile(declarationSourceFile.resolvedPath);
                    }
                }
            }
            function addReferencedFile(referencedPath: ts.Path) {
                if (!referencedFiles) {
                    referencedFiles = ts.createMap<true>();
                }
                referencedFiles.set(referencedPath, true);
            }
        }
        /**
         * Returns true if oldState is reusable, that is the emitKind = module/non module has not changed
         */
        export function canReuseOldState(newReferencedMap: ts.ReadonlyMap<ReferencedSet> | undefined, oldState: Readonly<ReusableBuilderState> | undefined) {
            return oldState && !oldState.referencedMap === !newReferencedMap;
        }
        /**
         * Creates the state of file references and signature for the new program from oldState if it is safe
         */
        export function create(newProgram: ts.Program, getCanonicalFileName: ts.GetCanonicalFileName, oldState?: Readonly<ReusableBuilderState>): BuilderState {
            const fileInfos = ts.createMap<FileInfo>();
            const referencedMap = newProgram.getCompilerOptions().module !== ts.ModuleKind.None ? ts.createMap<ReferencedSet>() : undefined;
            const exportedModulesMap = referencedMap ? ts.createMap<ReferencedSet>() : undefined;
            const hasCalledUpdateShapeSignature = ts.createMap<true>();
            const useOldState = canReuseOldState(referencedMap, oldState);
            // Create the reference map, and set the file infos
            for (const sourceFile of newProgram.getSourceFiles()) {
                const version = ts.Debug.assertDefined(sourceFile.version, "Program intended to be used with Builder should have source files with versions set");
                const oldInfo = useOldState ? oldState!.fileInfos.get(sourceFile.path) : undefined;
                if (referencedMap) {
                    const newReferences = getReferencedFiles(newProgram, sourceFile, getCanonicalFileName);
                    if (newReferences) {
                        referencedMap.set(sourceFile.path, newReferences);
                    }
                    // Copy old visible to outside files map
                    if (useOldState) {
                        const exportedModules = oldState!.exportedModulesMap!.get(sourceFile.path);
                        if (exportedModules) {
                            exportedModulesMap!.set(sourceFile.path, exportedModules);
                        }
                    }
                }
                fileInfos.set(sourceFile.path, { version, signature: oldInfo && oldInfo.signature });
            }
            return {
                fileInfos,
                referencedMap,
                exportedModulesMap,
                hasCalledUpdateShapeSignature
            };
        }
        /**
         * Releases needed properties
         */
        export function releaseCache(state: BuilderState) {
            state.allFilesExcludingDefaultLibraryFile = undefined;
            state.allFileNames = undefined;
        }
        /**
         * Creates a clone of the state
         */
        export function clone(state: Readonly<BuilderState>): BuilderState {
            const fileInfos = ts.createMap<FileInfo>();
            state.fileInfos.forEach((value, key) => {
                fileInfos.set(key, { ...value });
            });
            // Dont need to backup allFiles info since its cache anyway
            return {
                fileInfos,
                referencedMap: cloneMapOrUndefined(state.referencedMap),
                exportedModulesMap: cloneMapOrUndefined(state.exportedModulesMap),
                hasCalledUpdateShapeSignature: ts.cloneMap(state.hasCalledUpdateShapeSignature),
            };
        }
        /**
         * Gets the files affected by the path from the program
         */
        export function getFilesAffectedBy(state: BuilderState, programOfThisState: ts.Program, path: ts.Path, cancellationToken: ts.CancellationToken | undefined, computeHash: ComputeHash, cacheToUpdateSignature?: ts.Map<string>, exportedModulesMapCache?: ComputingExportedModulesMap): readonly ts.SourceFile[] {
            // Since the operation could be cancelled, the signatures are always stored in the cache
            // They will be committed once it is safe to use them
            // eg when calling this api from tsserver, if there is no cancellation of the operation
            // In the other cases the affected files signatures are committed only after the iteration through the result is complete
            const signatureCache = cacheToUpdateSignature || ts.createMap();
            const sourceFile = programOfThisState.getSourceFileByPath(path);
            if (!sourceFile) {
                return ts.emptyArray;
            }
            if (!updateShapeSignature(state, programOfThisState, sourceFile, signatureCache, cancellationToken, computeHash, exportedModulesMapCache)) {
                return [sourceFile];
            }
            const result = (state.referencedMap ? getFilesAffectedByUpdatedShapeWhenModuleEmit : getFilesAffectedByUpdatedShapeWhenNonModuleEmit)(state, programOfThisState, sourceFile, signatureCache, cancellationToken, computeHash, exportedModulesMapCache);
            if (!cacheToUpdateSignature) {
                // Commit all the signatures in the signature cache
                updateSignaturesFromCache(state, signatureCache);
            }
            return result;
        }
        /**
         * Updates the signatures from the cache into state's fileinfo signatures
         * This should be called whenever it is safe to commit the state of the builder
         */
        export function updateSignaturesFromCache(state: BuilderState, signatureCache: ts.Map<string>) {
            signatureCache.forEach((signature, path) => {
                state.fileInfos.get(path)!.signature = signature;
                state.hasCalledUpdateShapeSignature.set(path, true);
            });
        }
        /**
         * Returns if the shape of the signature has changed since last emit
         */
        export function updateShapeSignature(state: Readonly<BuilderState>, programOfThisState: ts.Program, sourceFile: ts.SourceFile, cacheToUpdateSignature: ts.Map<string>, cancellationToken: ts.CancellationToken | undefined, computeHash: ComputeHash, exportedModulesMapCache?: ComputingExportedModulesMap) {
            ts.Debug.assert(!!sourceFile);
            ts.Debug.assert(!exportedModulesMapCache || !!state.exportedModulesMap, "Compute visible to outside map only if visibleToOutsideReferencedMap present in the state");
            // If we have cached the result for this file, that means hence forth we should assume file shape is uptodate
            if (state.hasCalledUpdateShapeSignature.has(sourceFile.path) || cacheToUpdateSignature.has(sourceFile.path)) {
                return false;
            }
            const info = state.fileInfos.get(sourceFile.path);
            if (!info)
                return ts.Debug.fail();
            const prevSignature = info.signature;
            let latestSignature: string;
            if (sourceFile.isDeclarationFile) {
                latestSignature = sourceFile.version;
                if (exportedModulesMapCache && latestSignature !== prevSignature) {
                    // All the references in this file are exported
                    const references = state.referencedMap ? state.referencedMap.get(sourceFile.path) : undefined;
                    exportedModulesMapCache.set(sourceFile.path, references || false);
                }
            }
            else {
                const emitOutput = getFileEmitOutput(programOfThisState, sourceFile, 
                /*emitOnlyDtsFiles*/ true, cancellationToken, 
                /*customTransformers*/ undefined, 
                /*forceDtsEmit*/ true);
                const firstDts = emitOutput.outputFiles &&
                    programOfThisState.getCompilerOptions().declarationMap ?
                    emitOutput.outputFiles.length > 1 ? emitOutput.outputFiles[1] : undefined :
                    emitOutput.outputFiles.length > 0 ? emitOutput.outputFiles[0] : undefined;
                if (firstDts) {
                    ts.Debug.assert(ts.fileExtensionIs(firstDts.name, ts.Extension.Dts), "File extension for signature expected to be dts", () => `Found: ${ts.getAnyExtensionFromPath(firstDts.name)} for ${firstDts.name}:: All output files: ${JSON.stringify(emitOutput.outputFiles.map(f => f.name))}`);
                    latestSignature = computeHash(firstDts.text);
                    if (exportedModulesMapCache && latestSignature !== prevSignature) {
                        updateExportedModules(sourceFile, emitOutput.exportedModulesFromDeclarationEmit, exportedModulesMapCache);
                    }
                }
                else {
                    latestSignature = prevSignature!; // TODO: GH#18217
                }
            }
            cacheToUpdateSignature.set(sourceFile.path, latestSignature);
            return !prevSignature || latestSignature !== prevSignature;
        }
        /**
         * Coverts the declaration emit result into exported modules map
         */
        function updateExportedModules(sourceFile: ts.SourceFile, exportedModulesFromDeclarationEmit: ts.ExportedModulesFromDeclarationEmit | undefined, exportedModulesMapCache: ComputingExportedModulesMap) {
            if (!exportedModulesFromDeclarationEmit) {
                exportedModulesMapCache.set(sourceFile.path, false);
                return;
            }
            let exportedModules: ts.Map<true> | undefined;
            exportedModulesFromDeclarationEmit.forEach(symbol => addExportedModule(getReferencedFileFromImportedModuleSymbol(symbol)));
            exportedModulesMapCache.set(sourceFile.path, exportedModules || false);
            function addExportedModule(exportedModulePath: ts.Path | undefined) {
                if (exportedModulePath) {
                    if (!exportedModules) {
                        exportedModules = ts.createMap<true>();
                    }
                    exportedModules.set(exportedModulePath, true);
                }
            }
        }
        /**
         * Updates the exported modules from cache into state's exported modules map
         * This should be called whenever it is safe to commit the state of the builder
         */
        export function updateExportedFilesMapFromCache(state: BuilderState, exportedModulesMapCache: ComputingExportedModulesMap | undefined) {
            if (exportedModulesMapCache) {
                ts.Debug.assert(!!state.exportedModulesMap);
                exportedModulesMapCache.forEach((exportedModules, path) => {
                    if (exportedModules) {
                        state.exportedModulesMap!.set(path, exportedModules);
                    }
                    else {
                        state.exportedModulesMap!.delete(path);
                    }
                });
            }
        }
        /**
         * Get all the dependencies of the sourceFile
         */
        export function getAllDependencies(state: BuilderState, programOfThisState: ts.Program, sourceFile: ts.SourceFile): readonly string[] {
            const compilerOptions = programOfThisState.getCompilerOptions();
            // With --out or --outFile all outputs go into single file, all files depend on each other
            if (compilerOptions.outFile || compilerOptions.out) {
                return getAllFileNames(state, programOfThisState);
            }
            // If this is non module emit, or its a global file, it depends on all the source files
            if (!state.referencedMap || isFileAffectingGlobalScope(sourceFile)) {
                return getAllFileNames(state, programOfThisState);
            }
            // Get the references, traversing deep from the referenceMap
            const seenMap = ts.createMap<true>();
            const queue = [sourceFile.path];
            while (queue.length) {
                const path = queue.pop()!;
                if (!seenMap.has(path)) {
                    seenMap.set(path, true);
                    const references = state.referencedMap.get(path);
                    if (references) {
                        const iterator = references.keys();
                        for (let iterResult = iterator.next(); !iterResult.done; iterResult = iterator.next()) {
                            queue.push((iterResult.value as ts.Path));
                        }
                    }
                }
            }
            return ts.arrayFrom(ts.mapDefinedIterator(seenMap.keys(), path => {
                const file = programOfThisState.getSourceFileByPath((path as ts.Path));
                return file ? file.fileName : path;
            }));
        }
        /**
         * Gets the names of all files from the program
         */
        function getAllFileNames(state: BuilderState, programOfThisState: ts.Program): readonly string[] {
            if (!state.allFileNames) {
                const sourceFiles = programOfThisState.getSourceFiles();
                state.allFileNames = sourceFiles === ts.emptyArray ? ts.emptyArray : sourceFiles.map(file => file.fileName);
            }
            return state.allFileNames;
        }
        /**
         * Gets the files referenced by the the file path
         */
        export function getReferencedByPaths(state: Readonly<BuilderState>, referencedFilePath: ts.Path) {
            return ts.arrayFrom(ts.mapDefinedIterator(state.referencedMap!.entries(), ([filePath, referencesInFile]) => referencesInFile.has(referencedFilePath) ? filePath as ts.Path : undefined));
        }
        /**
         * For script files that contains only ambient external modules, although they are not actually external module files,
         * they can only be consumed via importing elements from them. Regular script files cannot consume them. Therefore,
         * there are no point to rebuild all script files if these special files have changed. However, if any statement
         * in the file is not ambient external module, we treat it as a regular script file.
         */
        function containsOnlyAmbientModules(sourceFile: ts.SourceFile) {
            for (const statement of sourceFile.statements) {
                if (!ts.isModuleWithStringLiteralName(statement)) {
                    return false;
                }
            }
            return true;
        }
        /**
         * Return true if file contains anything that augments to global scope we need to build them as if
         * they are global files as well as module
         */
        function containsGlobalScopeAugmentation(sourceFile: ts.SourceFile) {
            return ts.some(sourceFile.moduleAugmentations, augmentation => ts.isGlobalScopeAugmentation((augmentation.parent as ts.ModuleDeclaration)));
        }
        /**
         * Return true if the file will invalidate all files because it affectes global scope
         */
        function isFileAffectingGlobalScope(sourceFile: ts.SourceFile) {
            return containsGlobalScopeAugmentation(sourceFile) ||
                !ts.isExternalModule(sourceFile) && !containsOnlyAmbientModules(sourceFile);
        }
        /**
         * Gets all files of the program excluding the default library file
         */
        function getAllFilesExcludingDefaultLibraryFile(state: BuilderState, programOfThisState: ts.Program, firstSourceFile: ts.SourceFile): readonly ts.SourceFile[] {
            // Use cached result
            if (state.allFilesExcludingDefaultLibraryFile) {
                return state.allFilesExcludingDefaultLibraryFile;
            }
            let result: ts.SourceFile[] | undefined;
            addSourceFile(firstSourceFile);
            for (const sourceFile of programOfThisState.getSourceFiles()) {
                if (sourceFile !== firstSourceFile) {
                    addSourceFile(sourceFile);
                }
            }
            state.allFilesExcludingDefaultLibraryFile = result || ts.emptyArray;
            return state.allFilesExcludingDefaultLibraryFile;
            function addSourceFile(sourceFile: ts.SourceFile) {
                if (!programOfThisState.isSourceFileDefaultLibrary(sourceFile)) {
                    (result || (result = [])).push(sourceFile);
                }
            }
        }
        /**
         * When program emits non modular code, gets the files affected by the sourceFile whose shape has changed
         */
        function getFilesAffectedByUpdatedShapeWhenNonModuleEmit(state: BuilderState, programOfThisState: ts.Program, sourceFileWithUpdatedShape: ts.SourceFile) {
            const compilerOptions = programOfThisState.getCompilerOptions();
            // If `--out` or `--outFile` is specified, any new emit will result in re-emitting the entire project,
            // so returning the file itself is good enough.
            if (compilerOptions && (compilerOptions.out || compilerOptions.outFile)) {
                return [sourceFileWithUpdatedShape];
            }
            return getAllFilesExcludingDefaultLibraryFile(state, programOfThisState, sourceFileWithUpdatedShape);
        }
        /**
         * When program emits modular code, gets the files affected by the sourceFile whose shape has changed
         */
        function getFilesAffectedByUpdatedShapeWhenModuleEmit(state: BuilderState, programOfThisState: ts.Program, sourceFileWithUpdatedShape: ts.SourceFile, cacheToUpdateSignature: ts.Map<string>, cancellationToken: ts.CancellationToken | undefined, computeHash: ComputeHash | undefined, exportedModulesMapCache: ComputingExportedModulesMap | undefined) {
            if (isFileAffectingGlobalScope(sourceFileWithUpdatedShape)) {
                return getAllFilesExcludingDefaultLibraryFile(state, programOfThisState, sourceFileWithUpdatedShape);
            }
            const compilerOptions = programOfThisState.getCompilerOptions();
            if (compilerOptions && (compilerOptions.isolatedModules || compilerOptions.out || compilerOptions.outFile)) {
                return [sourceFileWithUpdatedShape];
            }
            // Now we need to if each file in the referencedBy list has a shape change as well.
            // Because if so, its own referencedBy files need to be saved as well to make the
            // emitting result consistent with files on disk.
            const seenFileNamesMap = ts.createMap<ts.SourceFile>();
            // Start with the paths this file was referenced by
            seenFileNamesMap.set(sourceFileWithUpdatedShape.path, sourceFileWithUpdatedShape);
            const queue = getReferencedByPaths(state, sourceFileWithUpdatedShape.resolvedPath);
            while (queue.length > 0) {
                const currentPath = queue.pop()!;
                if (!seenFileNamesMap.has(currentPath)) {
                    const currentSourceFile = programOfThisState.getSourceFileByPath(currentPath)!;
                    seenFileNamesMap.set(currentPath, currentSourceFile);
                    if (currentSourceFile && updateShapeSignature(state, programOfThisState, currentSourceFile, cacheToUpdateSignature, cancellationToken, computeHash!, exportedModulesMapCache)) { // TODO: GH#18217
                        queue.push(...getReferencedByPaths(state, currentSourceFile.resolvedPath));
                    }
                }
            }
            // Return array of values that needs emit
            // Return array of values that needs emit
            return ts.arrayFrom(ts.mapDefinedIterator(seenFileNamesMap.values(), value => value));
        }
    }
    export function cloneMapOrUndefined<T>(map: ts.ReadonlyMap<T> | undefined) {
        return map ? ts.cloneMap(map) : undefined;
    }
}
