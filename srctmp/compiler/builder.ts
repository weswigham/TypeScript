import * as ts from "./ts";
/*@internal*/
export interface ReusableDiagnostic extends ReusableDiagnosticRelatedInformation {
    /** May store more in future. For now, this will simply be `true` to indicate when a diagnostic is an unused-identifier diagnostic. */
    reportsUnnecessary?: {};
    source?: string;
    relatedInformation?: ReusableDiagnosticRelatedInformation[];
}
/* @internal */
export interface ReusableDiagnosticRelatedInformation {
    category: ts.DiagnosticCategory;
    code: number;
    file: string | undefined;
    start: number | undefined;
    length: number | undefined;
    messageText: string | ReusableDiagnosticMessageChain;
}
/* @internal */
export type ReusableDiagnosticMessageChain = ts.DiagnosticMessageChain;
/* @internal */
export interface ReusableBuilderProgramState extends ts.ReusableBuilderState {
    /**
     * Cache of bind and check diagnostics for files with their Path being the key
     */
    semanticDiagnosticsPerFile?: ts.ReadonlyMap<readonly ReusableDiagnostic[] | readonly ts.Diagnostic[]> | undefined;
    /**
     * The map has key by source file's path that has been changed
     */
    changedFilesSet?: ts.ReadonlyMap<true>;
    /**
     * Set of affected files being iterated
     */
    affectedFiles?: readonly ts.SourceFile[] | undefined;
    /**
     * Current changed file for iterating over affected files
     */
    currentChangedFilePath?: ts.Path | undefined;
    /**
     * Map of file signatures, with key being file path, calculated while getting current changed file's affected files
     * These will be committed whenever the iteration through affected files of current changed file is complete
     */
    currentAffectedFilesSignatures?: ts.ReadonlyMap<string> | undefined;
    /**
     * Newly computed visible to outside referencedSet
     */
    currentAffectedFilesExportedModulesMap?: Readonly<ts.BuilderState.ComputingExportedModulesMap> | undefined;
    /**
     * True if the semantic diagnostics were copied from the old state
     */
    semanticDiagnosticsFromOldState?: ts.Map<true>;
    /**
     * program corresponding to this state
     */
    program?: ts.Program | undefined;
    /**
     * compilerOptions for the program
     */
    compilerOptions: ts.CompilerOptions;
    /**
     * Files pending to be emitted
     */
    affectedFilesPendingEmit?: readonly ts.Path[] | undefined;
    /**
     * Files pending to be emitted kind.
     */
    affectedFilesPendingEmitKind?: ts.ReadonlyMap<BuilderFileEmit> | undefined;
    /**
     * Current index to retrieve pending affected file
     */
    affectedFilesPendingEmitIndex?: number | undefined;
    /*
     * true if semantic diagnostics are ReusableDiagnostic instead of Diagnostic
     */
    hasReusableDiagnostic?: true;
}
/* @internal */
export const enum BuilderFileEmit {
    DtsOnly,
    Full
}
/**
 * State to store the changed files, affected files and cache semantic diagnostics
 */
// TODO: GH#18217 Properties of this interface are frequently asserted to be defined.
/* @internal */
export interface BuilderProgramState extends ts.BuilderState {
    /**
     * Cache of bind and check diagnostics for files with their Path being the key
     */
    semanticDiagnosticsPerFile: ts.Map<readonly ts.Diagnostic[]> | undefined;
    /**
     * The map has key by source file's path that has been changed
     */
    changedFilesSet: ts.Map<true>;
    /**
     * Set of affected files being iterated
     */
    affectedFiles: readonly ts.SourceFile[] | undefined;
    /**
     * Current index to retrieve affected file from
     */
    affectedFilesIndex: number | undefined;
    /**
     * Current changed file for iterating over affected files
     */
    currentChangedFilePath: ts.Path | undefined;
    /**
     * Map of file signatures, with key being file path, calculated while getting current changed file's affected files
     * These will be committed whenever the iteration through affected files of current changed file is complete
     */
    currentAffectedFilesSignatures: ts.Map<string> | undefined;
    /**
     * Newly computed visible to outside referencedSet
     */
    currentAffectedFilesExportedModulesMap: ts.BuilderState.ComputingExportedModulesMap | undefined;
    /**
     * Already seen affected files
     */
    seenAffectedFiles: ts.Map<true> | undefined;
    /**
     * whether this program has cleaned semantic diagnostics cache for lib files
     */
    cleanedDiagnosticsOfLibFiles?: boolean;
    /**
     * True if the semantic diagnostics were copied from the old state
     */
    semanticDiagnosticsFromOldState?: ts.Map<true>;
    /**
     * program corresponding to this state
     */
    program: ts.Program | undefined;
    /**
     * compilerOptions for the program
     */
    compilerOptions: ts.CompilerOptions;
    /**
     * Files pending to be emitted
     */
    affectedFilesPendingEmit: ts.Path[] | undefined;
    /**
     * Files pending to be emitted kind.
     */
    affectedFilesPendingEmitKind: ts.Map<BuilderFileEmit> | undefined;
    /**
     * Current index to retrieve pending affected file
     */
    affectedFilesPendingEmitIndex: number | undefined;
    /**
     * true if build info is emitted
     */
    emittedBuildInfo?: boolean;
    /**
     * Already seen emitted files
     */
    seenEmittedFiles: ts.Map<BuilderFileEmit> | undefined;
    /**
     * true if program has been emitted
     */
    programEmitComplete?: true;
}
/* @internal */
function hasSameKeys<T, U>(map1: ts.ReadonlyMap<T> | undefined, map2: ts.ReadonlyMap<U> | undefined): boolean {
    // Has same size and every key is present in both maps
    return (map1 as ts.ReadonlyMap<T | U>) === map2 || map1 !== undefined && map2 !== undefined && map1.size === map2.size && !ts.forEachKey(map1, key => !map2.has(key));
}
/**
 * Create the state so that we can iterate on changedFiles/affected files
 */
/* @internal */
function createBuilderProgramState(newProgram: ts.Program, getCanonicalFileName: ts.GetCanonicalFileName, oldState?: Readonly<ReusableBuilderProgramState>): BuilderProgramState {
    const state = (ts.BuilderState.create(newProgram, getCanonicalFileName, oldState) as BuilderProgramState);
    state.program = newProgram;
    const compilerOptions = newProgram.getCompilerOptions();
    state.compilerOptions = compilerOptions;
    // With --out or --outFile, any change affects all semantic diagnostics so no need to cache them
    if (!compilerOptions.outFile && !compilerOptions.out) {
        state.semanticDiagnosticsPerFile = ts.createMap<readonly ts.Diagnostic[]>();
    }
    state.changedFilesSet = ts.createMap<true>();
    const useOldState = ts.BuilderState.canReuseOldState(state.referencedMap, oldState);
    const oldCompilerOptions = useOldState ? oldState!.compilerOptions : undefined;
    const canCopySemanticDiagnostics = useOldState && oldState!.semanticDiagnosticsPerFile && !!state.semanticDiagnosticsPerFile &&
        !ts.compilerOptionsAffectSemanticDiagnostics(compilerOptions, (oldCompilerOptions!));
    if (useOldState) {
        // Verify the sanity of old state
        if (!oldState!.currentChangedFilePath) {
            const affectedSignatures = oldState!.currentAffectedFilesSignatures;
            ts.Debug.assert(!oldState!.affectedFiles && (!affectedSignatures || !affectedSignatures.size), "Cannot reuse if only few affected files of currentChangedFile were iterated");
        }
        const changedFilesSet = oldState!.changedFilesSet;
        if (canCopySemanticDiagnostics) {
            ts.Debug.assert(!changedFilesSet || !ts.forEachKey(changedFilesSet, path => oldState!.semanticDiagnosticsPerFile!.has(path)), "Semantic diagnostics shouldnt be available for changed files");
        }
        // Copy old state's changed files set
        if (changedFilesSet) {
            ts.copyEntries(changedFilesSet, state.changedFilesSet);
        }
        if (!compilerOptions.outFile && !compilerOptions.out && oldState!.affectedFilesPendingEmit) {
            state.affectedFilesPendingEmit = oldState!.affectedFilesPendingEmit.slice();
            state.affectedFilesPendingEmitKind = ts.cloneMapOrUndefined(oldState!.affectedFilesPendingEmitKind);
            state.affectedFilesPendingEmitIndex = oldState!.affectedFilesPendingEmitIndex;
        }
    }
    // Update changed files and copy semantic diagnostics if we can
    const referencedMap = state.referencedMap;
    const oldReferencedMap = useOldState ? oldState!.referencedMap : undefined;
    const copyDeclarationFileDiagnostics = canCopySemanticDiagnostics && !compilerOptions.skipLibCheck === !oldCompilerOptions!.skipLibCheck;
    const copyLibFileDiagnostics = copyDeclarationFileDiagnostics && !compilerOptions.skipDefaultLibCheck === !oldCompilerOptions!.skipDefaultLibCheck;
    state.fileInfos.forEach((info, sourceFilePath) => {
        let oldInfo: Readonly<ts.BuilderState.FileInfo> | undefined;
        let newReferences: ts.BuilderState.ReferencedSet | undefined;
        // if not using old state, every file is changed
        if (!useOldState ||
            // File wasnt present in old state
            !(oldInfo = oldState!.fileInfos.get(sourceFilePath)) ||
            // versions dont match
            oldInfo.version !== info.version ||
            // Referenced files changed
            !hasSameKeys(newReferences = referencedMap && referencedMap.get(sourceFilePath), oldReferencedMap && oldReferencedMap.get(sourceFilePath)) ||
            // Referenced file was deleted in the new program
            newReferences && ts.forEachKey(newReferences, path => !state.fileInfos.has(path) && oldState!.fileInfos.has(path))) {
            // Register file as changed file and do not copy semantic diagnostics, since all changed files need to be re-evaluated
            state.changedFilesSet.set(sourceFilePath, true);
        }
        else if (canCopySemanticDiagnostics) {
            const sourceFile = (newProgram.getSourceFileByPath((sourceFilePath as ts.Path))!);
            if (sourceFile.isDeclarationFile && !copyDeclarationFileDiagnostics) {
                return;
            }
            if (sourceFile.hasNoDefaultLib && !copyLibFileDiagnostics) {
                return;
            }
            // Unchanged file copy diagnostics
            const diagnostics = oldState!.semanticDiagnosticsPerFile!.get(sourceFilePath);
            if (diagnostics) {
                state.semanticDiagnosticsPerFile!.set(sourceFilePath, oldState!.hasReusableDiagnostic ? convertToDiagnostics(diagnostics as readonly ReusableDiagnostic[], newProgram, getCanonicalFileName) : diagnostics as readonly ts.Diagnostic[]);
                if (!state.semanticDiagnosticsFromOldState) {
                    state.semanticDiagnosticsFromOldState = ts.createMap<true>();
                }
                state.semanticDiagnosticsFromOldState.set(sourceFilePath, true);
            }
        }
    });
    if (oldCompilerOptions && ts.compilerOptionsAffectEmit(compilerOptions, oldCompilerOptions)) {
        // Add all files to affectedFilesPendingEmit since emit changed
        newProgram.getSourceFiles().forEach(f => addToAffectedFilesPendingEmit(state, f.path, BuilderFileEmit.Full));
        ts.Debug.assert(state.seenAffectedFiles === undefined);
        state.seenAffectedFiles = ts.createMap<true>();
    }
    state.emittedBuildInfo = !state.changedFilesSet.size && !state.affectedFilesPendingEmit;
    return state;
}
/* @internal */
function convertToDiagnostics(diagnostics: readonly ReusableDiagnostic[], newProgram: ts.Program, getCanonicalFileName: ts.GetCanonicalFileName): readonly ts.Diagnostic[] {
    if (!diagnostics.length)
        return ts.emptyArray;
    const buildInfoDirectory = ts.getDirectoryPath(ts.getNormalizedAbsolutePath((ts.getTsBuildInfoEmitOutputFilePath(newProgram.getCompilerOptions())!), newProgram.getCurrentDirectory()));
    return diagnostics.map(diagnostic => {
        const result: ts.Diagnostic = convertToDiagnosticRelatedInformation(diagnostic, newProgram, toPath);
        result.reportsUnnecessary = diagnostic.reportsUnnecessary;
        result.source = diagnostic.source;
        const { relatedInformation } = diagnostic;
        result.relatedInformation = relatedInformation ?
            relatedInformation.length ?
                relatedInformation.map(r => convertToDiagnosticRelatedInformation(r, newProgram, toPath)) : ts.emptyArray :
            undefined;
        return result;
    });
    function toPath(path: string) {
        return ts.toPath(path, buildInfoDirectory, getCanonicalFileName);
    }
}
/* @internal */
function convertToDiagnosticRelatedInformation(diagnostic: ReusableDiagnosticRelatedInformation, newProgram: ts.Program, toPath: (path: string) => ts.Path): ts.DiagnosticRelatedInformation {
    const { file } = diagnostic;
    return {
        ...diagnostic,
        file: file ? newProgram.getSourceFileByPath(toPath(file)) : undefined
    };
}
/**
 * Releases program and other related not needed properties
 */
/* @internal */
function releaseCache(state: BuilderProgramState) {
    ts.BuilderState.releaseCache(state);
    state.program = undefined;
}
/**
 * Creates a clone of the state
 */
/* @internal */
function cloneBuilderProgramState(state: Readonly<BuilderProgramState>): BuilderProgramState {
    const newState = (ts.BuilderState.clone(state) as BuilderProgramState);
    newState.semanticDiagnosticsPerFile = ts.cloneMapOrUndefined(state.semanticDiagnosticsPerFile);
    newState.changedFilesSet = ts.cloneMap(state.changedFilesSet);
    newState.affectedFiles = state.affectedFiles;
    newState.affectedFilesIndex = state.affectedFilesIndex;
    newState.currentChangedFilePath = state.currentChangedFilePath;
    newState.currentAffectedFilesSignatures = ts.cloneMapOrUndefined(state.currentAffectedFilesSignatures);
    newState.currentAffectedFilesExportedModulesMap = ts.cloneMapOrUndefined(state.currentAffectedFilesExportedModulesMap);
    newState.seenAffectedFiles = ts.cloneMapOrUndefined(state.seenAffectedFiles);
    newState.cleanedDiagnosticsOfLibFiles = state.cleanedDiagnosticsOfLibFiles;
    newState.semanticDiagnosticsFromOldState = ts.cloneMapOrUndefined(state.semanticDiagnosticsFromOldState);
    newState.program = state.program;
    newState.compilerOptions = state.compilerOptions;
    newState.affectedFilesPendingEmit = state.affectedFilesPendingEmit && state.affectedFilesPendingEmit.slice();
    newState.affectedFilesPendingEmitKind = ts.cloneMapOrUndefined(state.affectedFilesPendingEmitKind);
    newState.affectedFilesPendingEmitIndex = state.affectedFilesPendingEmitIndex;
    newState.seenEmittedFiles = ts.cloneMapOrUndefined(state.seenEmittedFiles);
    newState.programEmitComplete = state.programEmitComplete;
    return newState;
}
/**
 * Verifies that source file is ok to be used in calls that arent handled by next
 */
/* @internal */
function assertSourceFileOkWithoutNextAffectedCall(state: BuilderProgramState, sourceFile: ts.SourceFile | undefined) {
    ts.Debug.assert(!sourceFile || !state.affectedFiles || state.affectedFiles[state.affectedFilesIndex! - 1] !== sourceFile || !state.semanticDiagnosticsPerFile!.has(sourceFile.path));
}
/**
 * This function returns the next affected file to be processed.
 * Note that until doneAffected is called it would keep reporting same result
 * This is to allow the callers to be able to actually remove affected file only when the operation is complete
 * eg. if during diagnostics check cancellation token ends up cancelling the request, the affected file should be retained
 */
/* @internal */
function getNextAffectedFile(state: BuilderProgramState, cancellationToken: ts.CancellationToken | undefined, computeHash: ts.BuilderState.ComputeHash): ts.SourceFile | ts.Program | undefined {
    while (true) {
        const { affectedFiles } = state;
        if (affectedFiles) {
            const seenAffectedFiles = state.seenAffectedFiles!;
            let affectedFilesIndex = state.affectedFilesIndex!; // TODO: GH#18217
            while (affectedFilesIndex < affectedFiles.length) {
                const affectedFile = affectedFiles[affectedFilesIndex];
                if (!seenAffectedFiles.has(affectedFile.path)) {
                    // Set the next affected file as seen and remove the cached semantic diagnostics
                    state.affectedFilesIndex = affectedFilesIndex;
                    handleDtsMayChangeOfAffectedFile(state, affectedFile, cancellationToken, computeHash);
                    return affectedFile;
                }
                affectedFilesIndex++;
            }
            // Remove the changed file from the change set
            state.changedFilesSet.delete(state.currentChangedFilePath!);
            state.currentChangedFilePath = undefined;
            // Commit the changes in file signature
            ts.BuilderState.updateSignaturesFromCache(state, (state.currentAffectedFilesSignatures!));
            state.currentAffectedFilesSignatures!.clear();
            ts.BuilderState.updateExportedFilesMapFromCache(state, state.currentAffectedFilesExportedModulesMap);
            state.affectedFiles = undefined;
        }
        // Get next changed file
        const nextKey = state.changedFilesSet.keys().next();
        if (nextKey.done) {
            // Done
            return undefined;
        }
        // With --out or --outFile all outputs go into single file
        // so operations are performed directly on program, return program
        const program = ts.Debug.assertDefined(state.program);
        const compilerOptions = program.getCompilerOptions();
        if (compilerOptions.outFile || compilerOptions.out) {
            ts.Debug.assert(!state.semanticDiagnosticsPerFile);
            return program;
        }
        // Get next batch of affected files
        state.currentAffectedFilesSignatures = state.currentAffectedFilesSignatures || ts.createMap();
        if (state.exportedModulesMap) {
            state.currentAffectedFilesExportedModulesMap = state.currentAffectedFilesExportedModulesMap || ts.createMap<ts.BuilderState.ReferencedSet | false>();
        }
        state.affectedFiles = ts.BuilderState.getFilesAffectedBy(state, program, (nextKey.value as ts.Path), cancellationToken, computeHash, state.currentAffectedFilesSignatures, state.currentAffectedFilesExportedModulesMap);
        state.currentChangedFilePath = (nextKey.value as ts.Path);
        state.affectedFilesIndex = 0;
        state.seenAffectedFiles = state.seenAffectedFiles || ts.createMap<true>();
    }
}
/**
 * Returns next file to be emitted from files that retrieved semantic diagnostics but did not emit yet
 */
/* @internal */
function getNextAffectedFilePendingEmit(state: BuilderProgramState) {
    const { affectedFilesPendingEmit } = state;
    if (affectedFilesPendingEmit) {
        const seenEmittedFiles = state.seenEmittedFiles || (state.seenEmittedFiles = ts.createMap());
        for (let i = state.affectedFilesPendingEmitIndex!; i < affectedFilesPendingEmit.length; i++) {
            const affectedFile = ts.Debug.assertDefined(state.program).getSourceFileByPath(affectedFilesPendingEmit[i]);
            if (affectedFile) {
                const seenKind = seenEmittedFiles.get(affectedFile.path);
                const emitKind = ts.Debug.assertDefined(ts.Debug.assertDefined(state.affectedFilesPendingEmitKind).get(affectedFile.path));
                if (seenKind === undefined || seenKind < emitKind) {
                    // emit this file
                    state.affectedFilesPendingEmitIndex = i;
                    return { affectedFile, emitKind };
                }
            }
        }
        state.affectedFilesPendingEmit = undefined;
        state.affectedFilesPendingEmitKind = undefined;
        state.affectedFilesPendingEmitIndex = undefined;
    }
    return undefined;
}
/**
 *  Handles semantic diagnostics and dts emit for affectedFile and files, that are referencing modules that export entities from affected file
 *  This is because even though js emit doesnt change, dts emit / type used can change resulting in need for dts emit and js change
 */
/* @internal */
function handleDtsMayChangeOfAffectedFile(state: BuilderProgramState, affectedFile: ts.SourceFile, cancellationToken: ts.CancellationToken | undefined, computeHash: ts.BuilderState.ComputeHash) {
    removeSemanticDiagnosticsOf(state, affectedFile.path);
    // If affected files is everything except default library, then nothing more to do
    if (state.allFilesExcludingDefaultLibraryFile === state.affectedFiles) {
        if (!state.cleanedDiagnosticsOfLibFiles) {
            state.cleanedDiagnosticsOfLibFiles = true;
            const program = ts.Debug.assertDefined(state.program);
            const options = program.getCompilerOptions();
            ts.forEach(program.getSourceFiles(), f => program.isSourceFileDefaultLibrary(f) &&
                !ts.skipTypeChecking(f, options, program) &&
                removeSemanticDiagnosticsOf(state, f.path));
        }
        return;
    }
    forEachReferencingModulesOfExportOfAffectedFile(state, affectedFile, (state, path) => handleDtsMayChangeOf(state, path, cancellationToken, computeHash));
}
/**
 * Handle the dts may change, so they need to be added to pending emit if dts emit is enabled,
 * Also we need to make sure signature is updated for these files
 */
/* @internal */
function handleDtsMayChangeOf(state: BuilderProgramState, path: ts.Path, cancellationToken: ts.CancellationToken | undefined, computeHash: ts.BuilderState.ComputeHash) {
    removeSemanticDiagnosticsOf(state, path);
    if (!state.changedFilesSet.has(path)) {
        const program = ts.Debug.assertDefined(state.program);
        const sourceFile = program.getSourceFileByPath(path);
        if (sourceFile) {
            // Even though the js emit doesnt change and we are already handling dts emit and semantic diagnostics
            // we need to update the signature to reflect correctness of the signature(which is output d.ts emit) of this file
            // This ensures that we dont later during incremental builds considering wrong signature.
            // Eg where this also is needed to ensure that .tsbuildinfo generated by incremental build should be same as if it was first fresh build
            ts.BuilderState.updateShapeSignature(state, program, sourceFile, ts.Debug.assertDefined(state.currentAffectedFilesSignatures), cancellationToken, computeHash, state.currentAffectedFilesExportedModulesMap);
            // If not dts emit, nothing more to do
            if (ts.getEmitDeclarations(state.compilerOptions)) {
                addToAffectedFilesPendingEmit(state, path, BuilderFileEmit.DtsOnly);
            }
        }
    }
    return false;
}
/**
 * Removes semantic diagnostics for path and
 * returns true if there are no more semantic diagnostics from the old state
 */
/* @internal */
function removeSemanticDiagnosticsOf(state: BuilderProgramState, path: ts.Path) {
    if (!state.semanticDiagnosticsFromOldState) {
        return true;
    }
    state.semanticDiagnosticsFromOldState.delete(path);
    state.semanticDiagnosticsPerFile!.delete(path);
    return !state.semanticDiagnosticsFromOldState.size;
}
/* @internal */
function isChangedSignagure(state: BuilderProgramState, path: ts.Path) {
    const newSignature = ts.Debug.assertDefined(state.currentAffectedFilesSignatures).get(path);
    const oldSignagure = ts.Debug.assertDefined(state.fileInfos.get(path)).signature;
    return newSignature !== oldSignagure;
}
/**
 * Iterate on referencing modules that export entities from affected file
 */
/* @internal */
function forEachReferencingModulesOfExportOfAffectedFile(state: BuilderProgramState, affectedFile: ts.SourceFile, fn: (state: BuilderProgramState, filePath: ts.Path) => boolean) {
    // If there was change in signature (dts output) for the changed file,
    // then only we need to handle pending file emit
    if (!state.exportedModulesMap || !state.changedFilesSet.has(affectedFile.path)) {
        return;
    }
    if (!isChangedSignagure(state, affectedFile.path))
        return;
    // Since isolated modules dont change js files, files affected by change in signature is itself
    // But we need to cleanup semantic diagnostics and queue dts emit for affected files
    if (state.compilerOptions.isolatedModules) {
        const seenFileNamesMap = ts.createMap<true>();
        seenFileNamesMap.set(affectedFile.path, true);
        const queue = ts.BuilderState.getReferencedByPaths(state, affectedFile.resolvedPath);
        while (queue.length > 0) {
            const currentPath = queue.pop()!;
            if (!seenFileNamesMap.has(currentPath)) {
                seenFileNamesMap.set(currentPath, true);
                const result = fn(state, currentPath);
                if (result && isChangedSignagure(state, currentPath)) {
                    const currentSourceFile = (ts.Debug.assertDefined(state.program).getSourceFileByPath(currentPath)!);
                    queue.push(...ts.BuilderState.getReferencedByPaths(state, currentSourceFile.resolvedPath));
                }
            }
        }
    }
    ts.Debug.assert(!!state.currentAffectedFilesExportedModulesMap);
    const seenFileAndExportsOfFile = ts.createMap<true>();
    // Go through exported modules from cache first
    // If exported modules has path, all files referencing file exported from are affected
    if (ts.forEachEntry((state.currentAffectedFilesExportedModulesMap!), (exportedModules, exportedFromPath) => exportedModules &&
        exportedModules.has(affectedFile.path) &&
        forEachFilesReferencingPath(state, (exportedFromPath as ts.Path), seenFileAndExportsOfFile, fn))) {
        return;
    }
    // If exported from path is not from cache and exported modules has path, all files referencing file exported from are affected
    ts.forEachEntry(state.exportedModulesMap, (exportedModules, exportedFromPath) => !state.currentAffectedFilesExportedModulesMap!.has(exportedFromPath) && // If we already iterated this through cache, ignore it
        exportedModules.has(affectedFile.path) &&
        forEachFilesReferencingPath(state, (exportedFromPath as ts.Path), seenFileAndExportsOfFile, fn));
}
/**
 * Iterate on files referencing referencedPath
 */
/* @internal */
function forEachFilesReferencingPath(state: BuilderProgramState, referencedPath: ts.Path, seenFileAndExportsOfFile: ts.Map<true>, fn: (state: BuilderProgramState, filePath: ts.Path) => boolean) {
    return ts.forEachEntry((state.referencedMap!), (referencesInFile, filePath) => referencesInFile.has(referencedPath) && forEachFileAndExportsOfFile(state, (filePath as ts.Path), seenFileAndExportsOfFile, fn));
}
/**
 * fn on file and iterate on anything that exports this file
 */
/* @internal */
function forEachFileAndExportsOfFile(state: BuilderProgramState, filePath: ts.Path, seenFileAndExportsOfFile: ts.Map<true>, fn: (state: BuilderProgramState, filePath: ts.Path) => boolean): boolean {
    if (!ts.addToSeen(seenFileAndExportsOfFile, filePath)) {
        return false;
    }
    if (fn(state, filePath)) {
        // If there are no more diagnostics from old cache, done
        return true;
    }
    ts.Debug.assert(!!state.currentAffectedFilesExportedModulesMap);
    // Go through exported modules from cache first
    // If exported modules has path, all files referencing file exported from are affected
    if (ts.forEachEntry((state.currentAffectedFilesExportedModulesMap!), (exportedModules, exportedFromPath) => exportedModules &&
        exportedModules.has(filePath) &&
        forEachFileAndExportsOfFile(state, (exportedFromPath as ts.Path), seenFileAndExportsOfFile, fn))) {
        return true;
    }
    // If exported from path is not from cache and exported modules has path, all files referencing file exported from are affected
    if (ts.forEachEntry((state.exportedModulesMap!), (exportedModules, exportedFromPath) => !state.currentAffectedFilesExportedModulesMap!.has(exportedFromPath) && // If we already iterated this through cache, ignore it
        exportedModules.has(filePath) &&
        forEachFileAndExportsOfFile(state, (exportedFromPath as ts.Path), seenFileAndExportsOfFile, fn))) {
        return true;
    }
    // Remove diagnostics of files that import this file (without going to exports of referencing files)
    return !!ts.forEachEntry((state.referencedMap!), (referencesInFile, referencingFilePath) => referencesInFile.has(filePath) &&
        !seenFileAndExportsOfFile.has(referencingFilePath) && // Not already removed diagnostic file
        fn(state, (referencingFilePath as ts.Path)) // Dont add to seen since this is not yet done with the export removal
    );
}
/**
 * This is called after completing operation on the next affected file.
 * The operations here are postponed to ensure that cancellation during the iteration is handled correctly
 */
/* @internal */
function doneWithAffectedFile(state: BuilderProgramState, affected: ts.SourceFile | ts.Program, emitKind?: BuilderFileEmit, isPendingEmit?: boolean, isBuildInfoEmit?: boolean) {
    if (isBuildInfoEmit) {
        state.emittedBuildInfo = true;
    }
    else if (affected === state.program) {
        state.changedFilesSet.clear();
        state.programEmitComplete = true;
    }
    else {
        state.seenAffectedFiles!.set((affected as ts.SourceFile).path, true);
        if (emitKind !== undefined) {
            (state.seenEmittedFiles || (state.seenEmittedFiles = ts.createMap())).set((affected as ts.SourceFile).path, emitKind);
        }
        if (isPendingEmit) {
            state.affectedFilesPendingEmitIndex!++;
        }
        else {
            state.affectedFilesIndex!++;
        }
    }
}
/**
 * Returns the result with affected file
 */
/* @internal */
function toAffectedFileResult<T>(state: BuilderProgramState, result: T, affected: ts.SourceFile | ts.Program): ts.AffectedFileResult<T> {
    doneWithAffectedFile(state, affected);
    return { result, affected };
}
/**
 * Returns the result with affected file
 */
/* @internal */
function toAffectedFileEmitResult(state: BuilderProgramState, result: ts.EmitResult, affected: ts.SourceFile | ts.Program, emitKind: BuilderFileEmit, isPendingEmit?: boolean, isBuildInfoEmit?: boolean): ts.AffectedFileResult<ts.EmitResult> {
    doneWithAffectedFile(state, affected, emitKind, isPendingEmit, isBuildInfoEmit);
    return { result, affected };
}
/**
 * Gets semantic diagnostics for the file which are
 * bindAndCheckDiagnostics (from cache) and program diagnostics
 */
/* @internal */
function getSemanticDiagnosticsOfFile(state: BuilderProgramState, sourceFile: ts.SourceFile, cancellationToken?: ts.CancellationToken): readonly ts.Diagnostic[] {
    return ts.concatenate(getBinderAndCheckerDiagnosticsOfFile(state, sourceFile, cancellationToken), ts.Debug.assertDefined(state.program).getProgramDiagnostics(sourceFile));
}
/**
 * Gets the binder and checker diagnostics either from cache if present, or otherwise from program and caches it
 * Note that it is assumed that when asked about binder and checker diagnostics, the file has been taken out of affected files/changed file set
 */
/* @internal */
function getBinderAndCheckerDiagnosticsOfFile(state: BuilderProgramState, sourceFile: ts.SourceFile, cancellationToken?: ts.CancellationToken): readonly ts.Diagnostic[] {
    const path = sourceFile.path;
    if (state.semanticDiagnosticsPerFile) {
        const cachedDiagnostics = state.semanticDiagnosticsPerFile.get(path);
        // Report the bind and check diagnostics from the cache if we already have those diagnostics present
        if (cachedDiagnostics) {
            return cachedDiagnostics;
        }
    }
    // Diagnostics werent cached, get them from program, and cache the result
    const diagnostics = ts.Debug.assertDefined(state.program).getBindAndCheckDiagnostics(sourceFile, cancellationToken);
    if (state.semanticDiagnosticsPerFile) {
        state.semanticDiagnosticsPerFile.set(path, diagnostics);
    }
    return diagnostics;
}
/* @internal */
export type ProgramBuildInfoDiagnostic = string | [string, readonly ReusableDiagnostic[]];
/* @internal */
export interface ProgramBuildInfo {
    fileInfos: ts.MapLike<ts.BuilderState.FileInfo>;
    options: ts.CompilerOptions;
    referencedMap?: ts.MapLike<string[]>;
    exportedModulesMap?: ts.MapLike<string[]>;
    semanticDiagnosticsPerFile?: ProgramBuildInfoDiagnostic[];
}
/**
 * Gets the program information to be emitted in buildInfo so that we can use it to create new program
 */
/* @internal */
function getProgramBuildInfo(state: Readonly<ReusableBuilderProgramState>, getCanonicalFileName: ts.GetCanonicalFileName): ProgramBuildInfo | undefined {
    if (state.compilerOptions.outFile || state.compilerOptions.out)
        return undefined;
    const currentDirectory = ts.Debug.assertDefined(state.program).getCurrentDirectory();
    const buildInfoDirectory = ts.getDirectoryPath(ts.getNormalizedAbsolutePath((ts.getTsBuildInfoEmitOutputFilePath(state.compilerOptions)!), currentDirectory));
    const fileInfos: ts.MapLike<ts.BuilderState.FileInfo> = {};
    state.fileInfos.forEach((value, key) => {
        const signature = state.currentAffectedFilesSignatures && state.currentAffectedFilesSignatures.get(key);
        fileInfos[relativeToBuildInfo(key)] = signature === undefined ? value : { version: value.version, signature };
    });
    const result: ProgramBuildInfo = {
        fileInfos,
        options: convertToReusableCompilerOptions(state.compilerOptions, relativeToBuildInfoEnsuringAbsolutePath)
    };
    if (state.referencedMap) {
        const referencedMap: ts.MapLike<string[]> = {};
        state.referencedMap.forEach((value, key) => {
            referencedMap[relativeToBuildInfo(key)] = ts.arrayFrom(value.keys(), relativeToBuildInfo);
        });
        result.referencedMap = referencedMap;
    }
    if (state.exportedModulesMap) {
        const exportedModulesMap: ts.MapLike<string[]> = {};
        state.exportedModulesMap.forEach((value, key) => {
            const newValue = state.currentAffectedFilesExportedModulesMap && state.currentAffectedFilesExportedModulesMap.get(key);
            // Not in temporary cache, use existing value
            if (newValue === undefined)
                exportedModulesMap[relativeToBuildInfo(key)] = ts.arrayFrom(value.keys(), relativeToBuildInfo);
            // Value in cache and has updated value map, use that
            else if (newValue)
                exportedModulesMap[relativeToBuildInfo(key)] = ts.arrayFrom(newValue.keys(), relativeToBuildInfo);
        });
        result.exportedModulesMap = exportedModulesMap;
    }
    if (state.semanticDiagnosticsPerFile) {
        const semanticDiagnosticsPerFile: ProgramBuildInfoDiagnostic[] = [];
        // Currently not recording actual errors since those mean no emit for tsc --build
        state.semanticDiagnosticsPerFile.forEach((value, key) => semanticDiagnosticsPerFile.push(value.length ?
            [
                relativeToBuildInfo(key),
                state.hasReusableDiagnostic ?
                    value as readonly ReusableDiagnostic[] :
                    convertToReusableDiagnostics((value as readonly ts.Diagnostic[]), relativeToBuildInfo)
            ] :
            relativeToBuildInfo(key)));
        result.semanticDiagnosticsPerFile = semanticDiagnosticsPerFile;
    }
    return result;
    function relativeToBuildInfoEnsuringAbsolutePath(path: string) {
        return relativeToBuildInfo(ts.getNormalizedAbsolutePath(path, currentDirectory));
    }
    function relativeToBuildInfo(path: string) {
        return ts.ensurePathIsNonModuleName(ts.getRelativePathFromDirectory(buildInfoDirectory, path, getCanonicalFileName));
    }
}
/* @internal */
function convertToReusableCompilerOptions(options: ts.CompilerOptions, relativeToBuildInfo: (path: string) => string) {
    const result: ts.CompilerOptions = {};
    const { optionsNameMap } = ts.getOptionsNameMap();
    for (const name in options) {
        if (ts.hasProperty(options, name)) {
            result[name] = convertToReusableCompilerOptionValue(optionsNameMap.get(name.toLowerCase()), (options[name] as ts.CompilerOptionsValue), relativeToBuildInfo);
        }
    }
    if (result.configFilePath) {
        result.configFilePath = relativeToBuildInfo(result.configFilePath);
    }
    return result;
}
/* @internal */
function convertToReusableCompilerOptionValue(option: ts.CommandLineOption | undefined, value: ts.CompilerOptionsValue, relativeToBuildInfo: (path: string) => string) {
    if (option) {
        if (option.type === "list") {
            const values = value as readonly (string | number)[];
            if (option.element.isFilePath && values.length) {
                return values.map(relativeToBuildInfo);
            }
        }
        else if (option.isFilePath) {
            return relativeToBuildInfo(value as string);
        }
    }
    return value;
}
/* @internal */
function convertToReusableDiagnostics(diagnostics: readonly ts.Diagnostic[], relativeToBuildInfo: (path: string) => string): readonly ReusableDiagnostic[] {
    ts.Debug.assert(!!diagnostics.length);
    return diagnostics.map(diagnostic => {
        const result: ReusableDiagnostic = convertToReusableDiagnosticRelatedInformation(diagnostic, relativeToBuildInfo);
        result.reportsUnnecessary = diagnostic.reportsUnnecessary;
        result.source = diagnostic.source;
        const { relatedInformation } = diagnostic;
        result.relatedInformation = relatedInformation ?
            relatedInformation.length ?
                relatedInformation.map(r => convertToReusableDiagnosticRelatedInformation(r, relativeToBuildInfo)) : ts.emptyArray :
            undefined;
        return result;
    });
}
/* @internal */
function convertToReusableDiagnosticRelatedInformation(diagnostic: ts.DiagnosticRelatedInformation, relativeToBuildInfo: (path: string) => string): ReusableDiagnosticRelatedInformation {
    const { file } = diagnostic;
    return {
        ...diagnostic,
        file: file ? relativeToBuildInfo(file.path) : undefined
    };
}
/* @internal */
export enum BuilderProgramKind {
    SemanticDiagnosticsBuilderProgram,
    EmitAndSemanticDiagnosticsBuilderProgram
}
/* @internal */
export interface BuilderCreationParameters {
    newProgram: ts.Program;
    host: ts.BuilderProgramHost;
    oldProgram: ts.BuilderProgram | undefined;
    configFileParsingDiagnostics: readonly ts.Diagnostic[];
}
/* @internal */
export function getBuilderCreationParameters(newProgramOrRootNames: ts.Program | readonly string[] | undefined, hostOrOptions: ts.BuilderProgramHost | ts.CompilerOptions | undefined, oldProgramOrHost?: ts.BuilderProgram | ts.CompilerHost, configFileParsingDiagnosticsOrOldProgram?: readonly ts.Diagnostic[] | ts.BuilderProgram, configFileParsingDiagnostics?: readonly ts.Diagnostic[], projectReferences?: readonly ts.ProjectReference[]): BuilderCreationParameters {
    let host: ts.BuilderProgramHost;
    let newProgram: ts.Program;
    let oldProgram: ts.BuilderProgram;
    if (newProgramOrRootNames === undefined) {
        ts.Debug.assert(hostOrOptions === undefined);
        host = (oldProgramOrHost as ts.CompilerHost);
        oldProgram = (configFileParsingDiagnosticsOrOldProgram as ts.BuilderProgram);
        ts.Debug.assert(!!oldProgram);
        newProgram = oldProgram.getProgram();
    }
    else if (ts.isArray(newProgramOrRootNames)) {
        oldProgram = (configFileParsingDiagnosticsOrOldProgram as ts.BuilderProgram);
        newProgram = ts.createProgram({
            rootNames: newProgramOrRootNames,
            options: (hostOrOptions as ts.CompilerOptions),
            host: (oldProgramOrHost as ts.CompilerHost),
            oldProgram: oldProgram && oldProgram.getProgramOrUndefined(),
            configFileParsingDiagnostics,
            projectReferences
        });
        host = (oldProgramOrHost as ts.CompilerHost);
    }
    else {
        newProgram = newProgramOrRootNames;
        host = (hostOrOptions as ts.BuilderProgramHost);
        oldProgram = (oldProgramOrHost as ts.BuilderProgram);
        configFileParsingDiagnostics = (configFileParsingDiagnosticsOrOldProgram as readonly ts.Diagnostic[]);
    }
    return { host, newProgram, oldProgram, configFileParsingDiagnostics: configFileParsingDiagnostics || ts.emptyArray };
}
/* @internal */
export function createBuilderProgram(kind: BuilderProgramKind.SemanticDiagnosticsBuilderProgram, builderCreationParameters: BuilderCreationParameters): ts.SemanticDiagnosticsBuilderProgram;
/* @internal */
export function createBuilderProgram(kind: BuilderProgramKind.EmitAndSemanticDiagnosticsBuilderProgram, builderCreationParameters: BuilderCreationParameters): ts.EmitAndSemanticDiagnosticsBuilderProgram;
/* @internal */
export function createBuilderProgram(kind: BuilderProgramKind, { newProgram, host, oldProgram, configFileParsingDiagnostics }: BuilderCreationParameters) {
    // Return same program if underlying program doesnt change
    let oldState = oldProgram && oldProgram.getState();
    if (oldState && newProgram === oldState.program && configFileParsingDiagnostics === newProgram.getConfigFileParsingDiagnostics()) {
        newProgram = undefined!; // TODO: GH#18217
        oldState = undefined;
        return oldProgram;
    }
    /**
     * Create the canonical file name for identity
     */
    const getCanonicalFileName = ts.createGetCanonicalFileName(host.useCaseSensitiveFileNames());
    /**
     * Computing hash to for signature verification
     */
    const computeHash = host.createHash || ts.generateDjb2Hash;
    let state = createBuilderProgramState(newProgram, getCanonicalFileName, oldState);
    let backupState: BuilderProgramState | undefined;
    newProgram.getProgramBuildInfo = () => getProgramBuildInfo(state, getCanonicalFileName);
    // To ensure that we arent storing any references to old program or new program without state
    newProgram = undefined!; // TODO: GH#18217
    oldProgram = undefined;
    oldState = undefined;
    const builderProgram = createRedirectedBuilderProgram(state, configFileParsingDiagnostics);
    builderProgram.getState = () => state;
    builderProgram.backupState = () => {
        ts.Debug.assert(backupState === undefined);
        backupState = cloneBuilderProgramState(state);
    };
    builderProgram.restoreState = () => {
        state = ts.Debug.assertDefined(backupState);
        backupState = undefined;
    };
    builderProgram.getAllDependencies = sourceFile => ts.BuilderState.getAllDependencies(state, ts.Debug.assertDefined(state.program), sourceFile);
    builderProgram.getSemanticDiagnostics = getSemanticDiagnostics;
    builderProgram.emit = emit;
    builderProgram.releaseProgram = () => {
        releaseCache(state);
        backupState = undefined;
    };
    if (kind === BuilderProgramKind.SemanticDiagnosticsBuilderProgram) {
        (builderProgram as ts.SemanticDiagnosticsBuilderProgram).getSemanticDiagnosticsOfNextAffectedFile = getSemanticDiagnosticsOfNextAffectedFile;
    }
    else if (kind === BuilderProgramKind.EmitAndSemanticDiagnosticsBuilderProgram) {
        (builderProgram as ts.EmitAndSemanticDiagnosticsBuilderProgram).getSemanticDiagnosticsOfNextAffectedFile = getSemanticDiagnosticsOfNextAffectedFile;
        (builderProgram as ts.EmitAndSemanticDiagnosticsBuilderProgram).emitNextAffectedFile = emitNextAffectedFile;
    }
    else {
        ts.notImplemented();
    }
    return builderProgram;
    /**
     * Emits the next affected file's emit result (EmitResult and sourceFiles emitted) or returns undefined if iteration is complete
     * The first of writeFile if provided, writeFile of BuilderProgramHost if provided, writeFile of compiler host
     * in that order would be used to write the files
     */
    function emitNextAffectedFile(writeFile?: ts.WriteFileCallback, cancellationToken?: ts.CancellationToken, emitOnlyDtsFiles?: boolean, customTransformers?: ts.CustomTransformers): ts.AffectedFileResult<ts.EmitResult> {
        let affected = getNextAffectedFile(state, cancellationToken, computeHash);
        let emitKind = BuilderFileEmit.Full;
        let isPendingEmitFile = false;
        if (!affected) {
            if (!state.compilerOptions.out && !state.compilerOptions.outFile) {
                const pendingAffectedFile = getNextAffectedFilePendingEmit(state);
                if (!pendingAffectedFile) {
                    if (state.emittedBuildInfo) {
                        return undefined;
                    }
                    const affected = ts.Debug.assertDefined(state.program);
                    return toAffectedFileEmitResult(state, 
                    // When whole program is affected, do emit only once (eg when --out or --outFile is specified)
                    // Otherwise just affected file
                    affected.emitBuildInfo(writeFile || ts.maybeBind(host, host.writeFile), cancellationToken), affected, 
                    /*emitKind*/ BuilderFileEmit.Full, 
                    /*isPendingEmitFile*/ false, 
                    /*isBuildInfoEmit*/ true);
                }
                ({ affectedFile: affected, emitKind } = pendingAffectedFile);
                isPendingEmitFile = true;
            }
            else {
                const program = ts.Debug.assertDefined(state.program);
                // Check if program uses any prepend project references, if thats the case we cant track of the js files of those, so emit even though there are no changes
                if (state.programEmitComplete || !ts.some(program.getProjectReferences(), ref => !!ref.prepend)) {
                    state.programEmitComplete = true;
                    return undefined;
                }
                affected = program;
            }
        }
        return toAffectedFileEmitResult(state, 
        // When whole program is affected, do emit only once (eg when --out or --outFile is specified)
        // Otherwise just affected file
        ts.Debug.assertDefined(state.program).emit(affected === state.program ? undefined : affected as ts.SourceFile, writeFile || ts.maybeBind(host, host.writeFile), cancellationToken, emitOnlyDtsFiles || emitKind === BuilderFileEmit.DtsOnly, customTransformers), affected, emitKind, isPendingEmitFile);
    }
    /**
     * Emits the JavaScript and declaration files.
     * When targetSource file is specified, emits the files corresponding to that source file,
     * otherwise for the whole program.
     * In case of EmitAndSemanticDiagnosticsBuilderProgram, when targetSourceFile is specified,
     * it is assumed that that file is handled from affected file list. If targetSourceFile is not specified,
     * it will only emit all the affected files instead of whole program
     *
     * The first of writeFile if provided, writeFile of BuilderProgramHost if provided, writeFile of compiler host
     * in that order would be used to write the files
     */
    function emit(targetSourceFile?: ts.SourceFile, writeFile?: ts.WriteFileCallback, cancellationToken?: ts.CancellationToken, emitOnlyDtsFiles?: boolean, customTransformers?: ts.CustomTransformers): ts.EmitResult {
        if (kind === BuilderProgramKind.EmitAndSemanticDiagnosticsBuilderProgram) {
            assertSourceFileOkWithoutNextAffectedCall(state, targetSourceFile);
            const result = ts.handleNoEmitOptions(builderProgram, targetSourceFile, cancellationToken);
            if (result)
                return result;
            if (!targetSourceFile) {
                // Emit and report any errors we ran into.
                let sourceMaps: ts.SourceMapEmitResult[] = [];
                let emitSkipped = false;
                let diagnostics: ts.Diagnostic[] | undefined;
                let emittedFiles: string[] = [];
                let affectedEmitResult: ts.AffectedFileResult<ts.EmitResult>;
                while (affectedEmitResult = emitNextAffectedFile(writeFile, cancellationToken, emitOnlyDtsFiles, customTransformers)) {
                    emitSkipped = emitSkipped || affectedEmitResult.result.emitSkipped;
                    diagnostics = ts.addRange(diagnostics, affectedEmitResult.result.diagnostics);
                    emittedFiles = ts.addRange(emittedFiles, affectedEmitResult.result.emittedFiles);
                    sourceMaps = ts.addRange(sourceMaps, affectedEmitResult.result.sourceMaps);
                }
                return {
                    emitSkipped,
                    diagnostics: diagnostics || ts.emptyArray,
                    emittedFiles,
                    sourceMaps
                };
            }
        }
        return ts.Debug.assertDefined(state.program).emit(targetSourceFile, writeFile || ts.maybeBind(host, host.writeFile), cancellationToken, emitOnlyDtsFiles, customTransformers);
    }
    /**
     * Return the semantic diagnostics for the next affected file or undefined if iteration is complete
     * If provided ignoreSourceFile would be called before getting the diagnostics and would ignore the sourceFile if the returned value was true
     */
    function getSemanticDiagnosticsOfNextAffectedFile(cancellationToken?: ts.CancellationToken, ignoreSourceFile?: (sourceFile: ts.SourceFile) => boolean): ts.AffectedFileResult<readonly ts.Diagnostic[]> {
        while (true) {
            const affected = getNextAffectedFile(state, cancellationToken, computeHash);
            if (!affected) {
                // Done
                return undefined;
            }
            else if (affected === state.program) {
                // When whole program is affected, get all semantic diagnostics (eg when --out or --outFile is specified)
                return toAffectedFileResult(state, state.program.getSemanticDiagnostics(/*targetSourceFile*/ undefined, cancellationToken), affected);
            }
            // Add file to affected file pending emit to handle for later emit time
            if (kind === BuilderProgramKind.EmitAndSemanticDiagnosticsBuilderProgram) {
                addToAffectedFilesPendingEmit(state, (affected as ts.SourceFile).path, BuilderFileEmit.Full);
            }
            // Get diagnostics for the affected file if its not ignored
            if (ignoreSourceFile && ignoreSourceFile((affected as ts.SourceFile))) {
                // Get next affected file
                doneWithAffectedFile(state, affected);
                continue;
            }
            return toAffectedFileResult(state, getSemanticDiagnosticsOfFile(state, (affected as ts.SourceFile), cancellationToken), affected);
        }
    }
    /**
     * Gets the semantic diagnostics from the program corresponding to this state of file (if provided) or whole program
     * The semantic diagnostics are cached and managed here
     * Note that it is assumed that when asked about semantic diagnostics through this API,
     * the file has been taken out of affected files so it is safe to use cache or get from program and cache the diagnostics
     * In case of SemanticDiagnosticsBuilderProgram if the source file is not provided,
     * it will iterate through all the affected files, to ensure that cache stays valid and yet provide a way to get all semantic diagnostics
     */
    function getSemanticDiagnostics(sourceFile?: ts.SourceFile, cancellationToken?: ts.CancellationToken): readonly ts.Diagnostic[] {
        assertSourceFileOkWithoutNextAffectedCall(state, sourceFile);
        const compilerOptions = ts.Debug.assertDefined(state.program).getCompilerOptions();
        if (compilerOptions.outFile || compilerOptions.out) {
            ts.Debug.assert(!state.semanticDiagnosticsPerFile);
            // We dont need to cache the diagnostics just return them from program
            return ts.Debug.assertDefined(state.program).getSemanticDiagnostics(sourceFile, cancellationToken);
        }
        if (sourceFile) {
            return getSemanticDiagnosticsOfFile(state, sourceFile, cancellationToken);
        }
        // When semantic builder asks for diagnostics of the whole program,
        // ensure that all the affected files are handled
        // eslint-disable-next-line no-empty
        while (getSemanticDiagnosticsOfNextAffectedFile(cancellationToken)) {
        }
        let diagnostics: ts.Diagnostic[] | undefined;
        for (const sourceFile of ts.Debug.assertDefined(state.program).getSourceFiles()) {
            diagnostics = ts.addRange(diagnostics, getSemanticDiagnosticsOfFile(state, sourceFile, cancellationToken));
        }
        return diagnostics || ts.emptyArray;
    }
}
/* @internal */
function addToAffectedFilesPendingEmit(state: BuilderProgramState, affectedFilePendingEmit: ts.Path, kind: BuilderFileEmit) {
    if (!state.affectedFilesPendingEmit)
        state.affectedFilesPendingEmit = [];
    if (!state.affectedFilesPendingEmitKind)
        state.affectedFilesPendingEmitKind = ts.createMap();
    const existingKind = state.affectedFilesPendingEmitKind.get(affectedFilePendingEmit);
    state.affectedFilesPendingEmit.push(affectedFilePendingEmit);
    state.affectedFilesPendingEmitKind.set(affectedFilePendingEmit, existingKind || kind);
    // affectedFilesPendingEmitIndex === undefined
    // - means the emit state.affectedFilesPendingEmit was undefined before adding current affected files
    //   so start from 0 as array would be affectedFilesPendingEmit
    // else, continue to iterate from existing index, the current set is appended to existing files
    if (state.affectedFilesPendingEmitIndex === undefined) {
        state.affectedFilesPendingEmitIndex = 0;
    }
}
/* @internal */
function getMapOfReferencedSet(mapLike: ts.MapLike<readonly string[]> | undefined, toPath: (path: string) => ts.Path): ts.ReadonlyMap<ts.BuilderState.ReferencedSet> | undefined {
    if (!mapLike)
        return undefined;
    const map = ts.createMap<ts.BuilderState.ReferencedSet>();
    // Copies keys/values from template. Note that for..in will not throw if
    // template is undefined, and instead will just exit the loop.
    for (const key in mapLike) {
        if (ts.hasProperty(mapLike, key)) {
            map.set(toPath(key), ts.arrayToSet(mapLike[key], toPath));
        }
    }
    return map;
}
/* @internal */
export function createBuildProgramUsingProgramBuildInfo(program: ProgramBuildInfo, buildInfoPath: string, host: ts.ReadBuildProgramHost): ts.EmitAndSemanticDiagnosticsBuilderProgram {
    const buildInfoDirectory = ts.getDirectoryPath(ts.getNormalizedAbsolutePath(buildInfoPath, host.getCurrentDirectory()));
    const getCanonicalFileName = ts.createGetCanonicalFileName(host.useCaseSensitiveFileNames());
    const fileInfos = ts.createMap<ts.BuilderState.FileInfo>();
    for (const key in program.fileInfos) {
        if (ts.hasProperty(program.fileInfos, key)) {
            fileInfos.set(toPath(key), program.fileInfos[key]);
        }
    }
    const state: ReusableBuilderProgramState = {
        fileInfos,
        compilerOptions: ts.convertToOptionsWithAbsolutePaths(program.options, toAbsolutePath),
        referencedMap: getMapOfReferencedSet(program.referencedMap, toPath),
        exportedModulesMap: getMapOfReferencedSet(program.exportedModulesMap, toPath),
        semanticDiagnosticsPerFile: program.semanticDiagnosticsPerFile && ts.arrayToMap(program.semanticDiagnosticsPerFile, value => toPath(ts.isString(value) ? value : value[0]), value => ts.isString(value) ? ts.emptyArray : value[1]),
        hasReusableDiagnostic: true
    };
    return {
        getState: () => state,
        backupState: ts.noop,
        restoreState: ts.noop,
        getProgram: ts.notImplemented,
        getProgramOrUndefined: ts.returnUndefined,
        releaseProgram: ts.noop,
        getCompilerOptions: () => state.compilerOptions,
        getSourceFile: ts.notImplemented,
        getSourceFiles: ts.notImplemented,
        getOptionsDiagnostics: ts.notImplemented,
        getGlobalDiagnostics: ts.notImplemented,
        getConfigFileParsingDiagnostics: ts.notImplemented,
        getSyntacticDiagnostics: ts.notImplemented,
        getDeclarationDiagnostics: ts.notImplemented,
        getSemanticDiagnostics: ts.notImplemented,
        emit: ts.notImplemented,
        getAllDependencies: ts.notImplemented,
        getCurrentDirectory: ts.notImplemented,
        emitNextAffectedFile: ts.notImplemented,
        getSemanticDiagnosticsOfNextAffectedFile: ts.notImplemented,
    };
    function toPath(path: string) {
        return ts.toPath(path, buildInfoDirectory, getCanonicalFileName);
    }
    function toAbsolutePath(path: string) {
        return ts.getNormalizedAbsolutePath(path, buildInfoDirectory);
    }
}
/* @internal */
export function createRedirectedBuilderProgram(state: {
    program: ts.Program | undefined;
    compilerOptions: ts.CompilerOptions;
}, configFileParsingDiagnostics: readonly ts.Diagnostic[]): ts.BuilderProgram {
    return {
        getState: ts.notImplemented,
        backupState: ts.noop,
        restoreState: ts.noop,
        getProgram,
        getProgramOrUndefined: () => state.program,
        releaseProgram: () => state.program = undefined,
        getCompilerOptions: () => state.compilerOptions,
        getSourceFile: fileName => getProgram().getSourceFile(fileName),
        getSourceFiles: () => getProgram().getSourceFiles(),
        getOptionsDiagnostics: cancellationToken => getProgram().getOptionsDiagnostics(cancellationToken),
        getGlobalDiagnostics: cancellationToken => getProgram().getGlobalDiagnostics(cancellationToken),
        getConfigFileParsingDiagnostics: () => configFileParsingDiagnostics,
        getSyntacticDiagnostics: (sourceFile, cancellationToken) => getProgram().getSyntacticDiagnostics(sourceFile, cancellationToken),
        getDeclarationDiagnostics: (sourceFile, cancellationToken) => getProgram().getDeclarationDiagnostics(sourceFile, cancellationToken),
        getSemanticDiagnostics: (sourceFile, cancellationToken) => getProgram().getSemanticDiagnostics(sourceFile, cancellationToken),
        emit: (sourceFile, writeFile, cancellationToken, emitOnlyDts, customTransformers) => getProgram().emit(sourceFile, writeFile, cancellationToken, emitOnlyDts, customTransformers),
        getAllDependencies: ts.notImplemented,
        getCurrentDirectory: () => getProgram().getCurrentDirectory(),
    };
    function getProgram() {
        return ts.Debug.assertDefined(state.program);
    }
}
