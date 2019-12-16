import * as ts from "./ts";
interface StackTraceError extends Error {
    stack?: string;
}
export interface ServerCancellationToken extends ts.HostCancellationToken {
    setRequest(requestId: number): void;
    resetRequest(requestId: number): void;
}
export const nullCancellationToken: ServerCancellationToken = {
    isCancellationRequested: () => false,
    setRequest: () => void 0,
    resetRequest: () => void 0
};
function hrTimeToMilliseconds(time: number[]): number {
    const seconds = time[0];
    const nanoseconds = time[1];
    return ((1e9 * seconds) + nanoseconds) / 1000000.0;
}
function isDeclarationFileInJSOnlyNonConfiguredProject(project: ts.server.Project, file: ts.server.NormalizedPath) {
    // Checking for semantic diagnostics is an expensive process. We want to avoid it if we
    // know for sure it is not needed.
    // For instance, .d.ts files injected by ATA automatically do not produce any relevant
    // errors to a JS- only project.
    //
    // Note that configured projects can set skipLibCheck (on by default in jsconfig.json) to
    // disable checking for declaration files. We only need to verify for inferred projects (e.g.
    // miscellaneous context in VS) and external projects(e.g.VS.csproj project) with only JS
    // files.
    //
    // We still want to check .js files in a JS-only inferred or external project (e.g. if the
    // file has '// @ts-check').
    if ((ts.server.isInferredProject(project) || ts.server.isExternalProject(project)) &&
        project.isJsOnlyProject()) {
        const scriptInfo = project.getScriptInfoForNormalizedPath(file);
        return scriptInfo && !scriptInfo.isJavaScript();
    }
    return false;
}
function dtsChangeCanAffectEmit(compilationSettings: ts.CompilerOptions) {
    return ts.getEmitDeclarations(compilationSettings) || !!compilationSettings.emitDecoratorMetadata;
}
function formatDiag(fileName: ts.server.NormalizedPath, project: ts.server.Project, diag: ts.Diagnostic): ts.server.protocol.Diagnostic {
    const scriptInfo = project.getScriptInfoForNormalizedPath(fileName)!; // TODO: GH#18217
    return {
        start: scriptInfo.positionToLineOffset(diag.start!),
        end: scriptInfo.positionToLineOffset(diag.start! + diag.length!),
        text: ts.flattenDiagnosticMessageText(diag.messageText, "\n"),
        code: diag.code,
        category: ts.diagnosticCategoryName(diag),
        reportsUnnecessary: diag.reportsUnnecessary,
        source: diag.source,
        relatedInformation: ts.map(diag.relatedInformation, formatRelatedInformation),
    };
}
function formatRelatedInformation(info: ts.DiagnosticRelatedInformation): ts.server.protocol.DiagnosticRelatedInformation {
    if (!info.file) {
        return {
            message: ts.flattenDiagnosticMessageText(info.messageText, "\n"),
            category: ts.diagnosticCategoryName(info),
            code: info.code
        };
    }
    return {
        span: {
            start: convertToLocation(ts.getLineAndCharacterOfPosition(info.file, (info.start!))),
            end: convertToLocation(ts.getLineAndCharacterOfPosition(info.file, info.start! + info.length!)),
            file: info.file.fileName
        },
        message: ts.flattenDiagnosticMessageText(info.messageText, "\n"),
        category: ts.diagnosticCategoryName(info),
        code: info.code
    };
}
function convertToLocation(lineAndCharacter: ts.LineAndCharacter): ts.server.protocol.Location {
    return { line: lineAndCharacter.line + 1, offset: lineAndCharacter.character + 1 };
}
function formatConfigFileDiag(diag: ts.Diagnostic, includeFileName: true): ts.server.protocol.DiagnosticWithFileName;
function formatConfigFileDiag(diag: ts.Diagnostic, includeFileName: false): ts.server.protocol.Diagnostic;
function formatConfigFileDiag(diag: ts.Diagnostic, includeFileName: boolean): ts.server.protocol.Diagnostic | ts.server.protocol.DiagnosticWithFileName {
    const start = ((diag.file && convertToLocation(ts.getLineAndCharacterOfPosition(diag.file, (diag.start!))))!); // TODO: GH#18217
    const end = ((diag.file && convertToLocation(ts.getLineAndCharacterOfPosition(diag.file, diag.start! + diag.length!)))!); // TODO: GH#18217
    const text = ts.flattenDiagnosticMessageText(diag.messageText, "\n");
    const { code, source } = diag;
    const category = ts.diagnosticCategoryName(diag);
    const common = {
        start,
        end,
        text,
        code,
        category,
        reportsUnnecessary: diag.reportsUnnecessary,
        source,
        relatedInformation: ts.map(diag.relatedInformation, formatRelatedInformation),
    };
    return includeFileName
        ? { ...common, fileName: diag.file && diag.file.fileName }
        : common;
}
export interface PendingErrorCheck {
    fileName: ts.server.NormalizedPath;
    project: ts.server.Project;
}
function allEditsBeforePos(edits: readonly ts.TextChange[], pos: number): boolean {
    return edits.every(edit => ts.textSpanEnd(edit.span) < pos);
}
// CommandNames used to be exposed before TS 2.4 as a namespace
// In TS 2.4 we switched to an enum, keep this for backward compatibility
// The var assignment ensures that even though CommandTypes are a const enum
// we want to ensure the value is maintained in the out since the file is
// built using --preseveConstEnum.
export type CommandNames = ts.server.protocol.CommandTypes;
export const CommandNames = (<any>ts.server.protocol).CommandTypes;
export function formatMessage<T extends ts.server.protocol.Message>(msg: T, logger: ts.server.Logger, byteLength: (s: string, encoding: string) => number, newLine: string): string {
    const verboseLogging = logger.hasLevel(ts.server.LogLevel.verbose);
    const json = JSON.stringify(msg);
    if (verboseLogging) {
        logger.info(`${msg.type}:${ts.server.indent(json)}`);
    }
    const len = byteLength(json, "utf8");
    return `Content-Length: ${1 + len}\r\n\r\n${json}${newLine}`;
}
/**
 * Allows to schedule next step in multistep operation
 */
interface NextStep {
    immediate(action: () => void): void;
    delay(ms: number, action: () => void): void;
}
/**
 * External capabilities used by multistep operation
 */
interface MultistepOperationHost {
    getCurrentRequestId(): number;
    sendRequestCompletedEvent(requestId: number): void;
    getServerHost(): ts.server.ServerHost;
    isCancellationRequested(): boolean;
    executeWithRequestId(requestId: number, action: () => void): void;
    logError(error: Error, message: string): void;
}
/**
 * Represents operation that can schedule its next step to be executed later.
 * Scheduling is done via instance of NextStep. If on current step subsequent step was not scheduled - operation is assumed to be completed.
 */
class MultistepOperation implements NextStep {
    private requestId: number | undefined;
    private timerHandle: any;
    private immediateId: number | undefined;
    constructor(private readonly operationHost: MultistepOperationHost) { }
    public startNew(action: (next: NextStep) => void) {
        this.complete();
        this.requestId = this.operationHost.getCurrentRequestId();
        this.executeAction(action);
    }
    private complete() {
        if (this.requestId !== undefined) {
            this.operationHost.sendRequestCompletedEvent(this.requestId);
            this.requestId = undefined;
        }
        this.setTimerHandle(undefined);
        this.setImmediateId(undefined);
    }
    public immediate(action: () => void) {
        const requestId = this.requestId!;
        ts.Debug.assert(requestId === this.operationHost.getCurrentRequestId(), "immediate: incorrect request id");
        this.setImmediateId(this.operationHost.getServerHost().setImmediate(() => {
            this.immediateId = undefined;
            this.operationHost.executeWithRequestId(requestId, () => this.executeAction(action));
        }));
    }
    public delay(ms: number, action: () => void) {
        const requestId = this.requestId!;
        ts.Debug.assert(requestId === this.operationHost.getCurrentRequestId(), "delay: incorrect request id");
        this.setTimerHandle(this.operationHost.getServerHost().setTimeout(() => {
            this.timerHandle = undefined;
            this.operationHost.executeWithRequestId(requestId, () => this.executeAction(action));
        }, ms));
    }
    private executeAction(action: (next: NextStep) => void) {
        let stop = false;
        try {
            if (this.operationHost.isCancellationRequested()) {
                stop = true;
            }
            else {
                action(this);
            }
        }
        catch (e) {
            stop = true;
            // ignore cancellation request
            if (!(e instanceof ts.OperationCanceledException)) {
                this.operationHost.logError(e, `delayed processing of request ${this.requestId}`);
            }
        }
        if (stop || !this.hasPendingWork()) {
            this.complete();
        }
    }
    private setTimerHandle(timerHandle: any) {
        if (this.timerHandle !== undefined) {
            this.operationHost.getServerHost().clearTimeout(this.timerHandle);
        }
        this.timerHandle = timerHandle;
    }
    private setImmediateId(immediateId: number | undefined) {
        if (this.immediateId !== undefined) {
            this.operationHost.getServerHost().clearImmediate(this.immediateId);
        }
        this.immediateId = immediateId;
    }
    private hasPendingWork() {
        return !!this.timerHandle || !!this.immediateId;
    }
}
export type Event = <T extends object>(body: T, eventName: string) => void;
export interface EventSender {
    event: Event;
}
/** @internal */
export function toEvent(eventName: string, body: object): ts.server.protocol.Event {
    return {
        seq: 0,
        type: "event",
        event: eventName,
        body
    };
}
type Projects = readonly ts.server.Project[] | {
    readonly projects: readonly ts.server.Project[];
    readonly symLinkedProjects: ts.MultiMap<ts.server.Project>;
};
/**
 * This helper function processes a list of projects and return the concatenated, sortd and deduplicated output of processing each project.
 */
function combineProjectOutput<T, U>(defaultValue: T, getValue: (path: ts.Path) => T, projects: Projects, action: (project: ts.server.Project, value: T) => readonly U[] | U | undefined): U[] {
    const outputs = ts.flatMapToMutable(ts.isArray(projects) ? projects : projects.projects, project => action(project, defaultValue));
    if (!ts.isArray(projects) && projects.symLinkedProjects) {
        projects.symLinkedProjects.forEach((projects, path) => {
            const value = getValue((path as ts.Path));
            outputs.push(...ts.flatMap(projects, project => action(project, value)));
        });
    }
    return ts.deduplicate(outputs, ts.equateValues);
}
function combineProjectOutputFromEveryProject<T>(projectService: ts.server.ProjectService, action: (project: ts.server.Project) => readonly T[], areEqual: (a: T, b: T) => boolean) {
    const outputs: T[] = [];
    projectService.loadAncestorProjectTree();
    projectService.forEachEnabledProject(project => {
        const theseOutputs = action(project);
        outputs.push(...theseOutputs.filter(output => !outputs.some(o => areEqual(o, output))));
    });
    return outputs;
}
function combineProjectOutputWhileOpeningReferencedProjects<T>(projects: Projects, defaultProject: ts.server.Project, action: (project: ts.server.Project) => readonly T[], getLocation: (t: T) => ts.DocumentPosition, resultsEqual: (a: T, b: T) => boolean): T[] {
    const outputs: T[] = [];
    combineProjectOutputWorker(projects, defaultProject, 
    /*initialLocation*/ undefined, ({ project }, tryAddToTodo) => {
        for (const output of action(project)) {
            if (!ts.contains(outputs, output, resultsEqual) && !tryAddToTodo(project, getLocation(output))) {
                outputs.push(output);
            }
        }
    });
    return outputs;
}
function combineProjectOutputForRenameLocations(projects: Projects, defaultProject: ts.server.Project, initialLocation: ts.DocumentPosition, findInStrings: boolean, findInComments: boolean, hostPreferences: ts.UserPreferences): readonly ts.RenameLocation[] {
    const outputs: ts.RenameLocation[] = [];
    combineProjectOutputWorker(projects, defaultProject, initialLocation, ({ project, location }, tryAddToTodo) => {
        for (const output of project.getLanguageService().findRenameLocations(location.fileName, location.pos, findInStrings, findInComments, hostPreferences.providePrefixAndSuffixTextForRename) || ts.server.emptyArray) {
            if (!ts.contains(outputs, output, ts.documentSpansEqual) && !tryAddToTodo(project, documentSpanLocation(output))) {
                outputs.push(output);
            }
        }
    });
    return outputs;
}
function getDefinitionLocation(defaultProject: ts.server.Project, initialLocation: ts.DocumentPosition): ts.DocumentPosition | undefined {
    const infos = defaultProject.getLanguageService().getDefinitionAtPosition(initialLocation.fileName, initialLocation.pos);
    const info = infos && ts.firstOrUndefined(infos);
    return info && !info.isLocal ? { fileName: info.fileName, pos: info.textSpan.start } : undefined;
}
function combineProjectOutputForReferences(projects: Projects, defaultProject: ts.server.Project, initialLocation: ts.DocumentPosition): readonly ts.ReferencedSymbol[] {
    const outputs: ts.ReferencedSymbol[] = [];
    combineProjectOutputWorker(projects, defaultProject, initialLocation, ({ project, location }, getMappedLocation) => {
        for (const outputReferencedSymbol of project.getLanguageService().findReferences(location.fileName, location.pos) || ts.server.emptyArray) {
            const mappedDefinitionFile = getMappedLocation(project, documentSpanLocation(outputReferencedSymbol.definition));
            const definition: ts.ReferencedSymbolDefinitionInfo = mappedDefinitionFile === undefined ?
                outputReferencedSymbol.definition :
                {
                    ...outputReferencedSymbol.definition,
                    textSpan: ts.createTextSpan(mappedDefinitionFile.pos, outputReferencedSymbol.definition.textSpan.length),
                    fileName: mappedDefinitionFile.fileName,
                    contextSpan: getMappedContextSpan(outputReferencedSymbol.definition, project)
                };
            let symbolToAddTo = ts.find(outputs, o => ts.documentSpansEqual(o.definition, definition));
            if (!symbolToAddTo) {
                symbolToAddTo = { definition, references: [] };
                outputs.push(symbolToAddTo);
            }
            for (const ref of outputReferencedSymbol.references) {
                // If it's in a mapped file, that is added to the todo list by `getMappedLocation`.
                if (!ts.contains(symbolToAddTo.references, ref, ts.documentSpansEqual) && !getMappedLocation(project, documentSpanLocation(ref))) {
                    symbolToAddTo.references.push(ref);
                }
            }
        }
    });
    return outputs.filter(o => o.references.length !== 0);
}
interface ProjectAndLocation<TLocation extends ts.DocumentPosition | undefined> {
    readonly project: ts.server.Project;
    readonly location: TLocation;
}
function forEachProjectInProjects(projects: Projects, path: string | undefined, cb: (project: ts.server.Project, path: string | undefined) => void): void {
    for (const project of ts.isArray(projects) ? projects : projects.projects) {
        cb(project, path);
    }
    if (!ts.isArray(projects) && projects.symLinkedProjects) {
        projects.symLinkedProjects.forEach((symlinkedProjects, symlinkedPath) => {
            for (const project of symlinkedProjects) {
                cb(project, symlinkedPath);
            }
        });
    }
}
type CombineProjectOutputCallback<TLocation extends ts.DocumentPosition | undefined> = (where: ProjectAndLocation<TLocation>, getMappedLocation: (project: ts.server.Project, location: ts.DocumentPosition) => ts.DocumentPosition | undefined) => void;
function combineProjectOutputWorker<TLocation extends ts.DocumentPosition | undefined>(projects: Projects, defaultProject: ts.server.Project, initialLocation: TLocation, cb: CombineProjectOutputCallback<TLocation>): void {
    const projectService = defaultProject.projectService;
    let toDo: ProjectAndLocation<TLocation>[] | undefined;
    const seenProjects = ts.createMap<true>();
    forEachProjectInProjects(projects, initialLocation && initialLocation.fileName, (project, path) => {
        // TLocation shoud be either `DocumentPosition` or `undefined`. Since `initialLocation` is `TLocation` this cast should be valid.
        const location = (initialLocation ? { fileName: path, pos: initialLocation.pos } : undefined) as TLocation;
        toDo = callbackProjectAndLocation({ project, location }, projectService, toDo, seenProjects, cb);
    });
    // After initial references are collected, go over every other project and see if it has a reference for the symbol definition.
    if (initialLocation) {
        const defaultDefinition = getDefinitionLocation(defaultProject, initialLocation!);
        if (defaultDefinition) {
            projectService.loadAncestorProjectTree(seenProjects);
            projectService.forEachEnabledProject(project => {
                if (!addToSeen(seenProjects, project))
                    return;
                const definition = mapDefinitionInProject(defaultDefinition, defaultProject, project);
                if (definition) {
                    toDo = callbackProjectAndLocation<TLocation>({ project, location: definition as TLocation }, projectService, toDo, seenProjects, cb);
                }
            });
        }
    }
    while (toDo && toDo.length) {
        toDo = callbackProjectAndLocation(ts.Debug.assertDefined(toDo.pop()), projectService, toDo, seenProjects, cb);
    }
}
function mapDefinitionInProject(definition: ts.DocumentPosition | undefined, definingProject: ts.server.Project, project: ts.server.Project): ts.DocumentPosition | undefined {
    // If the definition is actually from the project, definition is correct as is
    if (!definition ||
        project.containsFile(ts.server.toNormalizedPath(definition.fileName)) &&
            !isLocationProjectReferenceRedirect(project, definition)) {
        return definition;
    }
    const mappedDefinition = definingProject.isSourceOfProjectReferenceRedirect(definition.fileName) ?
        definition :
        definingProject.getLanguageService().getSourceMapper().tryGetGeneratedPosition(definition);
    return mappedDefinition && project.containsFile(ts.server.toNormalizedPath(mappedDefinition.fileName)) ? mappedDefinition : undefined;
}
function isLocationProjectReferenceRedirect(project: ts.server.Project, location: ts.DocumentPosition | undefined) {
    if (!location)
        return false;
    const program = project.getLanguageService().getProgram();
    if (!program)
        return false;
    const sourceFile = program.getSourceFile(location.fileName);
    // It is possible that location is attached to project but
    // the program actually includes its redirect instead.
    // This happens when rootFile in project is one of the file from referenced project
    // Thus root is attached but program doesnt have the actual .ts file but .d.ts
    // If this is not the file we were actually looking, return rest of the toDo
    return !!sourceFile &&
        sourceFile.resolvedPath !== sourceFile.path &&
        sourceFile.resolvedPath !== project.toPath(location.fileName);
}
function callbackProjectAndLocation<TLocation extends ts.DocumentPosition | undefined>(projectAndLocation: ProjectAndLocation<TLocation>, projectService: ts.server.ProjectService, toDo: ProjectAndLocation<TLocation>[] | undefined, seenProjects: ts.Map<true>, cb: CombineProjectOutputCallback<TLocation>): ProjectAndLocation<TLocation>[] | undefined {
    const { project, location } = projectAndLocation;
    if (project.getCancellationToken().isCancellationRequested())
        return undefined; // Skip rest of toDo if cancelled
    // If this is not the file we were actually looking, return rest of the toDo
    if (isLocationProjectReferenceRedirect(project, location))
        return toDo;
    cb(projectAndLocation, (project, location) => {
        addToSeen(seenProjects, projectAndLocation.project);
        const originalLocation = projectService.getOriginalLocationEnsuringConfiguredProject(project, location);
        if (!originalLocation)
            return undefined;
        const originalScriptInfo = projectService.getScriptInfo(originalLocation.fileName)!;
        toDo = toDo || [];
        for (const project of originalScriptInfo.containingProjects) {
            addToTodo({ project, location: originalLocation as TLocation }, toDo, seenProjects);
        }
        const symlinkedProjectsMap = projectService.getSymlinkedProjects(originalScriptInfo);
        if (symlinkedProjectsMap) {
            symlinkedProjectsMap.forEach((symlinkedProjects, symlinkedPath) => {
                for (const symlinkedProject of symlinkedProjects)
                    addToTodo({ project: symlinkedProject, location: { fileName: symlinkedPath, pos: originalLocation.pos } as TLocation }, toDo!, seenProjects);
            });
        }
        return originalLocation === location ? undefined : originalLocation;
    });
    return toDo;
}
function addToTodo<TLocation extends ts.DocumentPosition | undefined>(projectAndLocation: ProjectAndLocation<TLocation>, toDo: ts.Push<ProjectAndLocation<TLocation>>, seenProjects: ts.Map<true>): void {
    if (addToSeen(seenProjects, projectAndLocation.project))
        toDo.push(projectAndLocation);
}
function addToSeen(seenProjects: ts.Map<true>, project: ts.server.Project) {
    return ts.addToSeen(seenProjects, getProjectKey(project));
}
function getProjectKey(project: ts.server.Project) {
    return ts.server.isConfiguredProject(project) ? project.canonicalConfigFilePath : project.getProjectName();
}
function documentSpanLocation({ fileName, textSpan }: ts.DocumentSpan): ts.DocumentPosition {
    return { fileName, pos: textSpan.start };
}
function getMappedLocation(location: ts.DocumentPosition, project: ts.server.Project): ts.DocumentPosition | undefined {
    const mapsTo = project.getSourceMapper().tryGetSourcePosition(location);
    return mapsTo && project.projectService.fileExists(ts.server.toNormalizedPath(mapsTo.fileName)) ? mapsTo : undefined;
}
function getMappedDocumentSpan(documentSpan: ts.DocumentSpan, project: ts.server.Project): ts.DocumentSpan | undefined {
    const newPosition = getMappedLocation(documentSpanLocation(documentSpan), project);
    if (!newPosition)
        return undefined;
    return {
        fileName: newPosition.fileName,
        textSpan: {
            start: newPosition.pos,
            length: documentSpan.textSpan.length
        },
        originalFileName: documentSpan.fileName,
        originalTextSpan: documentSpan.textSpan,
        contextSpan: getMappedContextSpan(documentSpan, project),
        originalContextSpan: documentSpan.contextSpan
    };
}
function getMappedContextSpan(documentSpan: ts.DocumentSpan, project: ts.server.Project): ts.TextSpan | undefined {
    const contextSpanStart = documentSpan.contextSpan && getMappedLocation({ fileName: documentSpan.fileName, pos: documentSpan.contextSpan.start }, project);
    const contextSpanEnd = documentSpan.contextSpan && getMappedLocation({ fileName: documentSpan.fileName, pos: documentSpan.contextSpan.start + documentSpan.contextSpan.length }, project);
    return contextSpanStart && contextSpanEnd ?
        { start: contextSpanStart.pos, length: contextSpanEnd.pos - contextSpanStart.pos } :
        undefined;
}
export interface SessionOptions {
    host: ts.server.ServerHost;
    cancellationToken: ServerCancellationToken;
    useSingleInferredProject: boolean;
    useInferredProjectPerProjectRoot: boolean;
    typingsInstaller: ts.server.ITypingsInstaller;
    byteLength: (buf: string, encoding?: string) => number;
    hrtime: (start?: number[]) => number[];
    logger: ts.server.Logger;
    /**
     * If falsy, all events are suppressed.
     */
    canUseEvents: boolean;
    eventHandler?: ts.server.ProjectServiceEventHandler;
    /** Has no effect if eventHandler is also specified. */
    suppressDiagnosticEvents?: boolean;
    syntaxOnly?: boolean;
    throttleWaitMilliseconds?: number;
    noGetErrOnBackgroundUpdate?: boolean;
    globalPlugins?: readonly string[];
    pluginProbeLocations?: readonly string[];
    allowLocalPluginLoads?: boolean;
    typesMapLocation?: string;
}
export class Session implements EventSender {
    private readonly gcTimer: ts.server.GcTimer;
    protected projectService: ts.server.ProjectService;
    private changeSeq = 0;
    private currentRequestId!: number;
    private errorCheck: MultistepOperation;
    protected host: ts.server.ServerHost;
    private readonly cancellationToken: ServerCancellationToken;
    protected readonly typingsInstaller: ts.server.ITypingsInstaller;
    protected byteLength: (buf: string, encoding?: string) => number;
    private hrtime: (start?: number[]) => number[];
    protected logger: ts.server.Logger;
    protected canUseEvents: boolean;
    private suppressDiagnosticEvents?: boolean;
    private eventHandler: ts.server.ProjectServiceEventHandler | undefined;
    private readonly noGetErrOnBackgroundUpdate?: boolean;
    constructor(opts: SessionOptions) {
        this.host = opts.host;
        this.cancellationToken = opts.cancellationToken;
        this.typingsInstaller = opts.typingsInstaller;
        this.byteLength = opts.byteLength;
        this.hrtime = opts.hrtime;
        this.logger = opts.logger;
        this.canUseEvents = opts.canUseEvents;
        this.suppressDiagnosticEvents = opts.suppressDiagnosticEvents;
        this.noGetErrOnBackgroundUpdate = opts.noGetErrOnBackgroundUpdate;
        const { throttleWaitMilliseconds } = opts;
        this.eventHandler = this.canUseEvents
            ? opts.eventHandler || (event => this.defaultEventHandler(event))
            : undefined;
        const multistepOperationHost: MultistepOperationHost = {
            executeWithRequestId: (requestId, action) => this.executeWithRequestId(requestId, action),
            getCurrentRequestId: () => this.currentRequestId,
            getServerHost: () => this.host,
            logError: (err, cmd) => this.logError(err, cmd),
            sendRequestCompletedEvent: requestId => this.sendRequestCompletedEvent(requestId),
            isCancellationRequested: () => this.cancellationToken.isCancellationRequested()
        };
        this.errorCheck = new MultistepOperation(multistepOperationHost);
        const settings: ts.server.ProjectServiceOptions = {
            host: this.host,
            logger: this.logger,
            cancellationToken: this.cancellationToken,
            useSingleInferredProject: opts.useSingleInferredProject,
            useInferredProjectPerProjectRoot: opts.useInferredProjectPerProjectRoot,
            typingsInstaller: this.typingsInstaller,
            throttleWaitMilliseconds,
            eventHandler: this.eventHandler,
            suppressDiagnosticEvents: this.suppressDiagnosticEvents,
            globalPlugins: opts.globalPlugins,
            pluginProbeLocations: opts.pluginProbeLocations,
            allowLocalPluginLoads: opts.allowLocalPluginLoads,
            typesMapLocation: opts.typesMapLocation,
            syntaxOnly: opts.syntaxOnly,
        };
        this.projectService = new ts.server.ProjectService(settings);
        this.gcTimer = new ts.server.GcTimer(this.host, /*delay*/ 7000, this.logger);
    }
    private sendRequestCompletedEvent(requestId: number): void {
        this.event<ts.server.protocol.RequestCompletedEventBody>({ request_seq: requestId }, "requestCompleted");
    }
    private defaultEventHandler(event: ts.server.ProjectServiceEvent) {
        switch (event.eventName) {
            case ts.server.ProjectsUpdatedInBackgroundEvent:
                const { openFiles } = event.data;
                this.projectsUpdatedInBackgroundEvent(openFiles);
                break;
            case ts.server.ProjectLoadingStartEvent:
                const { project, reason } = event.data;
                this.event<ts.server.protocol.ProjectLoadingStartEventBody>({ projectName: project.getProjectName(), reason }, ts.server.ProjectLoadingStartEvent);
                break;
            case ts.server.ProjectLoadingFinishEvent:
                const { project: finishProject } = event.data;
                this.event<ts.server.protocol.ProjectLoadingFinishEventBody>({ projectName: finishProject.getProjectName() }, ts.server.ProjectLoadingFinishEvent);
                break;
            case ts.server.LargeFileReferencedEvent:
                const { file, fileSize, maxFileSize } = event.data;
                this.event<ts.server.protocol.LargeFileReferencedEventBody>({ file, fileSize, maxFileSize }, ts.server.LargeFileReferencedEvent);
                break;
            case ts.server.ConfigFileDiagEvent:
                const { triggerFile, configFileName: configFile, diagnostics } = event.data;
                const bakedDiags = ts.map(diagnostics, diagnostic => formatConfigFileDiag(diagnostic, /*includeFileName*/ true));
                this.event<ts.server.protocol.ConfigFileDiagnosticEventBody>({
                    triggerFile,
                    configFile,
                    diagnostics: bakedDiags
                }, ts.server.ConfigFileDiagEvent);
                break;
            case ts.server.ProjectLanguageServiceStateEvent: {
                const eventName: ts.server.protocol.ProjectLanguageServiceStateEventName = ts.server.ProjectLanguageServiceStateEvent;
                this.event<ts.server.protocol.ProjectLanguageServiceStateEventBody>({
                    projectName: event.data.project.getProjectName(),
                    languageServiceEnabled: event.data.languageServiceEnabled
                }, eventName);
                break;
            }
            case ts.server.ProjectInfoTelemetryEvent: {
                const eventName: ts.server.protocol.TelemetryEventName = "telemetry";
                this.event<ts.server.protocol.TelemetryEventBody>({
                    telemetryEventName: event.eventName,
                    payload: event.data,
                }, eventName);
                break;
            }
        }
    }
    private projectsUpdatedInBackgroundEvent(openFiles: string[]): void {
        this.projectService.logger.info(`got projects updated in background, updating diagnostics for ${openFiles}`);
        if (openFiles.length) {
            if (!this.suppressDiagnosticEvents && !this.noGetErrOnBackgroundUpdate) {
                const checkList = this.createCheckList(openFiles);
                // For now only queue error checking for open files. We can change this to include non open files as well
                this.errorCheck.startNew(next => this.updateErrorCheck(next, checkList, 100, /*requireOpen*/ true));
            }
            // Send project changed event
            this.event<ts.server.protocol.ProjectsUpdatedInBackgroundEventBody>({
                openFiles
            }, ts.server.ProjectsUpdatedInBackgroundEvent);
        }
    }
    public logError(err: Error, cmd: string): void {
        this.logErrorWorker(err, cmd);
    }
    private logErrorWorker(err: Error & ts.PossibleProgramFileInfo, cmd: string, fileRequest?: ts.server.protocol.FileRequestArgs): void {
        let msg = "Exception on executing command " + cmd;
        if (err.message) {
            msg += ":\n" + ts.server.indent(err.message);
            if ((<StackTraceError>err).stack) {
                msg += "\n" + ts.server.indent(((<StackTraceError>err).stack!));
            }
        }
        if (this.logger.hasLevel(ts.server.LogLevel.verbose)) {
            if (fileRequest) {
                try {
                    const { file, project } = this.getFileAndProject(fileRequest);
                    const scriptInfo = project.getScriptInfoForNormalizedPath(file);
                    if (scriptInfo) {
                        const text = ts.getSnapshotText(scriptInfo.getSnapshot());
                        msg += `\n\nFile text of ${fileRequest.file}:${ts.server.indent(text)}\n`;
                    }
                }
                catch { } // eslint-disable-line no-empty
            }
            if (err.ProgramFiles) {
                msg += `\n\nProgram files: ${JSON.stringify(err.ProgramFiles)}\n`;
                msg += `\n\nProjects::\n`;
                let counter = 0;
                const addProjectInfo = (project: ts.server.Project) => {
                    msg += `\nProject '${project.projectName}' (${ts.server.ProjectKind[project.projectKind]}) ${counter}\n`;
                    msg += project.filesToString(/*writeProjectFileNames*/ true);
                    msg += "\n-----------------------------------------------\n";
                    counter++;
                };
                this.projectService.externalProjects.forEach(addProjectInfo);
                this.projectService.configuredProjects.forEach(addProjectInfo);
                this.projectService.inferredProjects.forEach(addProjectInfo);
            }
        }
        this.logger.msg(msg, ts.server.Msg.Err);
    }
    public send(msg: ts.server.protocol.Message) {
        if (msg.type === "event" && !this.canUseEvents) {
            if (this.logger.hasLevel(ts.server.LogLevel.verbose)) {
                this.logger.info(`Session does not support events: ignored event: ${JSON.stringify(msg)}`);
            }
            return;
        }
        const msgText = formatMessage(msg, this.logger, this.byteLength, this.host.newLine);
        ts.perfLogger.logEvent(`Response message size: ${msgText.length}`);
        this.host.write(msgText);
    }
    public event<T extends object>(body: T, eventName: string): void {
        this.send(toEvent(eventName, body));
    }
    // For backwards-compatibility only.
    /** @deprecated */
    public output(info: any, cmdName: string, reqSeq?: number, errorMsg?: string): void {
        this.doOutput(info, cmdName, reqSeq!, /*success*/ !errorMsg, errorMsg); // TODO: GH#18217
    }
    private doOutput(info: {} | undefined, cmdName: string, reqSeq: number, success: boolean, message?: string): void {
        const res: ts.server.protocol.Response = {
            seq: 0,
            type: "response",
            command: cmdName,
            request_seq: reqSeq,
            success,
        };
        if (success) {
            let metadata: unknown;
            if (ts.isArray(info)) {
                res.body = info;
                metadata = (info as ts.WithMetadata<readonly any[]>).metadata;
                delete (info as ts.WithMetadata<readonly any[]>).metadata;
            }
            else if (typeof info === "object") {
                if ((info as ts.WithMetadata<{}>).metadata) {
                    const { metadata: infoMetadata, ...body } = (info as ts.WithMetadata<{}>);
                    res.body = body;
                    metadata = infoMetadata;
                }
                else {
                    res.body = info;
                }
            }
            else {
                res.body = info;
            }
            if (metadata)
                res.metadata = metadata;
        }
        else {
            ts.Debug.assert(info === undefined);
        }
        if (message) {
            res.message = message;
        }
        this.send(res);
    }
    private semanticCheck(file: ts.server.NormalizedPath, project: ts.server.Project) {
        const diags = isDeclarationFileInJSOnlyNonConfiguredProject(project, file)
            ? ts.server.emptyArray : project.getLanguageService().getSemanticDiagnostics(file);
        this.sendDiagnosticsEvent(file, project, diags, "semanticDiag");
    }
    private syntacticCheck(file: ts.server.NormalizedPath, project: ts.server.Project) {
        this.sendDiagnosticsEvent(file, project, project.getLanguageService().getSyntacticDiagnostics(file), "syntaxDiag");
    }
    private suggestionCheck(file: ts.server.NormalizedPath, project: ts.server.Project) {
        this.sendDiagnosticsEvent(file, project, project.getLanguageService().getSuggestionDiagnostics(file), "suggestionDiag");
    }
    private sendDiagnosticsEvent(file: ts.server.NormalizedPath, project: ts.server.Project, diagnostics: readonly ts.Diagnostic[], kind: ts.server.protocol.DiagnosticEventKind): void {
        try {
            this.event<ts.server.protocol.DiagnosticEventBody>({ file, diagnostics: diagnostics.map(diag => formatDiag(file, project, diag)) }, kind);
        }
        catch (err) {
            this.logError(err, kind);
        }
    }
    /** It is the caller's responsibility to verify that `!this.suppressDiagnosticEvents`. */
    private updateErrorCheck(next: NextStep, checkList: PendingErrorCheck[], ms: number, requireOpen = true) {
        ts.Debug.assert(!this.suppressDiagnosticEvents); // Caller's responsibility
        const seq = this.changeSeq;
        const followMs = Math.min(ms, 200);
        let index = 0;
        const checkOne = () => {
            if (this.changeSeq !== seq) {
                return;
            }
            const { fileName, project } = checkList[index];
            index++;
            // Ensure the project is upto date before checking if this file is present in the project
            ts.server.updateProjectIfDirty(project);
            if (!project.containsFile(fileName, requireOpen)) {
                return;
            }
            this.syntacticCheck(fileName, project);
            if (this.changeSeq !== seq) {
                return;
            }
            next.immediate(() => {
                this.semanticCheck(fileName, project);
                if (this.changeSeq !== seq) {
                    return;
                }
                const goNext = () => {
                    if (checkList.length > index) {
                        next.delay(followMs, checkOne);
                    }
                };
                if (this.getPreferences(fileName).disableSuggestions) {
                    goNext();
                }
                else {
                    next.immediate(() => {
                        this.suggestionCheck(fileName, project);
                        goNext();
                    });
                }
            });
        };
        if (checkList.length > index && this.changeSeq === seq) {
            next.delay(ms, checkOne);
        }
    }
    private cleanProjects(caption: string, projects: ts.server.Project[]) {
        if (!projects) {
            return;
        }
        this.logger.info(`cleaning ${caption}`);
        for (const p of projects) {
            p.getLanguageService(/*ensureSynchronized*/ false).cleanupSemanticCache();
        }
    }
    private cleanup() {
        this.cleanProjects("inferred projects", this.projectService.inferredProjects);
        this.cleanProjects("configured projects", ts.arrayFrom(this.projectService.configuredProjects.values()));
        this.cleanProjects("external projects", this.projectService.externalProjects);
        if (this.host.gc) {
            this.logger.info(`host.gc()`);
            this.host.gc();
        }
    }
    private getEncodedSyntacticClassifications(args: ts.server.protocol.EncodedSyntacticClassificationsRequestArgs) {
        const { file, languageService } = this.getFileAndLanguageServiceForSyntacticOperation(args);
        return languageService.getEncodedSyntacticClassifications(file, args);
    }
    private getEncodedSemanticClassifications(args: ts.server.protocol.EncodedSemanticClassificationsRequestArgs) {
        const { file, project } = this.getFileAndProject(args);
        return project.getLanguageService().getEncodedSemanticClassifications(file, args);
    }
    private getProject(projectFileName: string | undefined): ts.server.Project | undefined {
        return projectFileName === undefined ? undefined : this.projectService.findProject(projectFileName);
    }
    private getConfigFileAndProject(args: ts.server.protocol.FileRequestArgs): {
        configFile: ts.server.NormalizedPath | undefined;
        project: ts.server.Project | undefined;
    } {
        const project = this.getProject(args.projectFileName);
        const file = ts.server.toNormalizedPath(args.file);
        return {
            configFile: project && project.hasConfigFile(file) ? file : undefined,
            project
        };
    }
    private getConfigFileDiagnostics(configFile: ts.server.NormalizedPath, project: ts.server.Project, includeLinePosition: boolean) {
        const projectErrors = project.getAllProjectErrors();
        const optionsErrors = project.getLanguageService().getCompilerOptionsDiagnostics();
        const diagnosticsForConfigFile = ts.filter(ts.concatenate(projectErrors, optionsErrors), diagnostic => !!diagnostic.file && diagnostic.file.fileName === configFile);
        return includeLinePosition ?
            this.convertToDiagnosticsWithLinePositionFromDiagnosticFile(diagnosticsForConfigFile) :
            ts.map(diagnosticsForConfigFile, diagnostic => formatConfigFileDiag(diagnostic, /*includeFileName*/ false));
    }
    private convertToDiagnosticsWithLinePositionFromDiagnosticFile(diagnostics: readonly ts.Diagnostic[]): ts.server.protocol.DiagnosticWithLinePosition[] {
        return diagnostics.map<ts.server.protocol.DiagnosticWithLinePosition>(d => ({
            message: ts.flattenDiagnosticMessageText(d.messageText, this.host.newLine),
            start: d.start!,
            length: d.length!,
            category: ts.diagnosticCategoryName(d),
            code: d.code,
            startLocation: ((d.file && convertToLocation(ts.getLineAndCharacterOfPosition(d.file, (d.start!))))!),
            endLocation: ((d.file && convertToLocation(ts.getLineAndCharacterOfPosition(d.file, d.start! + d.length!)))!),
            relatedInformation: ts.map(d.relatedInformation, formatRelatedInformation)
        }));
    }
    private getCompilerOptionsDiagnostics(args: ts.server.protocol.CompilerOptionsDiagnosticsRequestArgs) {
        const project = this.getProject(args.projectFileName)!;
        // Get diagnostics that dont have associated file with them
        // The diagnostics which have file would be in config file and
        // would be reported as part of configFileDiagnostics
        return this.convertToDiagnosticsWithLinePosition(ts.filter(project.getLanguageService().getCompilerOptionsDiagnostics(), diagnostic => !diagnostic.file), 
        /*scriptInfo*/ undefined);
    }
    private convertToDiagnosticsWithLinePosition(diagnostics: readonly ts.Diagnostic[], scriptInfo: ts.server.ScriptInfo | undefined): ts.server.protocol.DiagnosticWithLinePosition[] {
        return diagnostics.map(d => <ts.server.protocol.DiagnosticWithLinePosition>{
            message: ts.flattenDiagnosticMessageText(d.messageText, this.host.newLine),
            start: d.start,
            length: d.length,
            category: ts.diagnosticCategoryName(d),
            code: d.code,
            source: d.source,
            startLocation: scriptInfo && scriptInfo.positionToLineOffset(d.start!),
            endLocation: scriptInfo && scriptInfo.positionToLineOffset(d.start! + d.length!),
            reportsUnnecessary: d.reportsUnnecessary,
            relatedInformation: ts.map(d.relatedInformation, formatRelatedInformation),
        });
    }
    private getDiagnosticsWorker(args: ts.server.protocol.FileRequestArgs, isSemantic: boolean, selector: (project: ts.server.Project, file: string) => readonly ts.Diagnostic[], includeLinePosition: boolean): readonly ts.server.protocol.DiagnosticWithLinePosition[] | readonly ts.server.protocol.Diagnostic[] {
        const { project, file } = this.getFileAndProject(args);
        if (isSemantic && isDeclarationFileInJSOnlyNonConfiguredProject(project, file)) {
            return ts.server.emptyArray;
        }
        const scriptInfo = project.getScriptInfoForNormalizedPath(file);
        const diagnostics = selector(project, file);
        return includeLinePosition
            ? this.convertToDiagnosticsWithLinePosition(diagnostics, scriptInfo)
            : diagnostics.map(d => formatDiag(file, project, d));
    }
    private getDefinition(args: ts.server.protocol.FileLocationRequestArgs, simplifiedResult: boolean): readonly ts.server.protocol.FileSpanWithContext[] | readonly ts.DefinitionInfo[] {
        const { file, project } = this.getFileAndProject(args);
        const position = this.getPositionInFile(args, file);
        const definitions = this.mapDefinitionInfoLocations(project.getLanguageService().getDefinitionAtPosition(file, position) || ts.server.emptyArray, project);
        return simplifiedResult ? this.mapDefinitionInfo(definitions, project) : definitions.map(Session.mapToOriginalLocation);
    }
    private mapDefinitionInfoLocations(definitions: readonly ts.DefinitionInfo[], project: ts.server.Project): readonly ts.DefinitionInfo[] {
        return definitions.map((info): ts.DefinitionInfo => {
            const newDocumentSpan = getMappedDocumentSpan(info, project);
            return !newDocumentSpan ? info : {
                ...newDocumentSpan,
                containerKind: info.containerKind,
                containerName: info.containerName,
                kind: info.kind,
                name: info.name,
            };
        });
    }
    private getDefinitionAndBoundSpan(args: ts.server.protocol.FileLocationRequestArgs, simplifiedResult: boolean): ts.server.protocol.DefinitionInfoAndBoundSpan | ts.DefinitionInfoAndBoundSpan {
        const { file, project } = this.getFileAndProject(args);
        const position = this.getPositionInFile(args, file);
        const scriptInfo = ts.Debug.assertDefined(project.getScriptInfo(file));
        const unmappedDefinitionAndBoundSpan = project.getLanguageService().getDefinitionAndBoundSpan(file, position);
        if (!unmappedDefinitionAndBoundSpan || !unmappedDefinitionAndBoundSpan.definitions) {
            return {
                definitions: ts.server.emptyArray,
                textSpan: undefined! // TODO: GH#18217
            };
        }
        const definitions = this.mapDefinitionInfoLocations(unmappedDefinitionAndBoundSpan.definitions, project);
        const { textSpan } = unmappedDefinitionAndBoundSpan;
        if (simplifiedResult) {
            return {
                definitions: this.mapDefinitionInfo(definitions, project),
                textSpan: toProcolTextSpan(textSpan, scriptInfo)
            };
        }
        return {
            definitions: definitions.map(Session.mapToOriginalLocation),
            textSpan,
        };
    }
    private getEmitOutput(args: ts.server.protocol.FileRequestArgs): ts.EmitOutput {
        const { file, project } = this.getFileAndProject(args);
        return project.shouldEmitFile(project.getScriptInfo(file)) ?
            project.getLanguageService().getEmitOutput(file) :
            { emitSkipped: true, outputFiles: [] };
    }
    private mapDefinitionInfo(definitions: readonly ts.DefinitionInfo[], project: ts.server.Project): readonly ts.server.protocol.FileSpanWithContext[] {
        return definitions.map(def => this.toFileSpanWithContext(def.fileName, def.textSpan, def.contextSpan, project));
    }
    /*
     * When we map a .d.ts location to .ts, Visual Studio gets confused because there's no associated Roslyn Document in
     * the same project which corresponds to the file. VS Code has no problem with this, and luckily we have two protocols.
     * This retains the existing behavior for the "simplified" (VS Code) protocol but stores the .d.ts location in a
     * set of additional fields, and does the reverse for VS (store the .d.ts location where
     * it used to be and stores the .ts location in the additional fields).
    */
    private static mapToOriginalLocation<T extends ts.DocumentSpan>(def: T): T {
        if (def.originalFileName) {
            ts.Debug.assert(def.originalTextSpan !== undefined, "originalTextSpan should be present if originalFileName is");
            return {
                ...<any>def,
                fileName: def.originalFileName,
                textSpan: def.originalTextSpan,
                targetFileName: def.fileName,
                targetTextSpan: def.textSpan,
                contextSpan: def.originalContextSpan,
                targetContextSpan: def.contextSpan
            };
        }
        return def;
    }
    private toFileSpan(fileName: string, textSpan: ts.TextSpan, project: ts.server.Project): ts.server.protocol.FileSpan {
        const ls = project.getLanguageService();
        const start = ls.toLineColumnOffset!(fileName, textSpan.start); // TODO: GH#18217
        const end = ls.toLineColumnOffset!(fileName, ts.textSpanEnd(textSpan));
        return {
            file: fileName,
            start: { line: start.line + 1, offset: start.character + 1 },
            end: { line: end.line + 1, offset: end.character + 1 }
        };
    }
    private toFileSpanWithContext(fileName: string, textSpan: ts.TextSpan, contextSpan: ts.TextSpan | undefined, project: ts.server.Project): ts.server.protocol.FileSpanWithContext {
        const fileSpan = this.toFileSpan(fileName, textSpan, project);
        const context = contextSpan && this.toFileSpan(fileName, contextSpan, project);
        return context ?
            { ...fileSpan, contextStart: context.start, contextEnd: context.end } :
            fileSpan;
    }
    private getTypeDefinition(args: ts.server.protocol.FileLocationRequestArgs): readonly ts.server.protocol.FileSpanWithContext[] {
        const { file, project } = this.getFileAndProject(args);
        const position = this.getPositionInFile(args, file);
        const definitions = this.mapDefinitionInfoLocations(project.getLanguageService().getTypeDefinitionAtPosition(file, position) || ts.server.emptyArray, project);
        return this.mapDefinitionInfo(definitions, project);
    }
    private mapImplementationLocations(implementations: readonly ts.ImplementationLocation[], project: ts.server.Project): readonly ts.ImplementationLocation[] {
        return implementations.map((info): ts.ImplementationLocation => {
            const newDocumentSpan = getMappedDocumentSpan(info, project);
            return !newDocumentSpan ? info : {
                ...newDocumentSpan,
                kind: info.kind,
                displayParts: info.displayParts,
            };
        });
    }
    private getImplementation(args: ts.server.protocol.FileLocationRequestArgs, simplifiedResult: boolean): readonly ts.server.protocol.FileSpanWithContext[] | readonly ts.ImplementationLocation[] {
        const { file, project } = this.getFileAndProject(args);
        const position = this.getPositionInFile(args, file);
        const implementations = this.mapImplementationLocations(project.getLanguageService().getImplementationAtPosition(file, position) || ts.server.emptyArray, project);
        return simplifiedResult ?
            implementations.map(({ fileName, textSpan, contextSpan }) => this.toFileSpanWithContext(fileName, textSpan, contextSpan, project)) :
            implementations.map(Session.mapToOriginalLocation);
    }
    private getOccurrences(args: ts.server.protocol.FileLocationRequestArgs): readonly ts.server.protocol.OccurrencesResponseItem[] {
        const { file, project } = this.getFileAndProject(args);
        const position = this.getPositionInFile(args, file);
        const occurrences = project.getLanguageService().getOccurrencesAtPosition(file, position);
        return occurrences ?
            occurrences.map<ts.server.protocol.OccurrencesResponseItem>(occurrence => {
                const { fileName, isWriteAccess, textSpan, isInString, contextSpan } = occurrence;
                const scriptInfo = project.getScriptInfo(fileName)!;
                return {
                    ...toProtocolTextSpanWithContext(textSpan, contextSpan, scriptInfo),
                    file: fileName,
                    isWriteAccess,
                    ...(isInString ? { isInString } : undefined)
                };
            }) : ts.server.emptyArray;
    }
    private getSyntacticDiagnosticsSync(args: ts.server.protocol.SyntacticDiagnosticsSyncRequestArgs): readonly ts.server.protocol.Diagnostic[] | readonly ts.server.protocol.DiagnosticWithLinePosition[] {
        const { configFile } = this.getConfigFileAndProject(args);
        if (configFile) {
            // all the config file errors are reported as part of semantic check so nothing to report here
            return ts.server.emptyArray;
        }
        return this.getDiagnosticsWorker(args, /*isSemantic*/ false, (project, file) => project.getLanguageService().getSyntacticDiagnostics(file), !!args.includeLinePosition);
    }
    private getSemanticDiagnosticsSync(args: ts.server.protocol.SemanticDiagnosticsSyncRequestArgs): readonly ts.server.protocol.Diagnostic[] | readonly ts.server.protocol.DiagnosticWithLinePosition[] {
        const { configFile, project } = this.getConfigFileAndProject(args);
        if (configFile) {
            return this.getConfigFileDiagnostics(configFile, project!, !!args.includeLinePosition); // TODO: GH#18217
        }
        return this.getDiagnosticsWorker(args, /*isSemantic*/ true, (project, file) => project.getLanguageService().getSemanticDiagnostics(file), !!args.includeLinePosition);
    }
    private getSuggestionDiagnosticsSync(args: ts.server.protocol.SuggestionDiagnosticsSyncRequestArgs): readonly ts.server.protocol.Diagnostic[] | readonly ts.server.protocol.DiagnosticWithLinePosition[] {
        const { configFile } = this.getConfigFileAndProject(args);
        if (configFile) {
            // Currently there are no info diagnostics for config files.
            return ts.server.emptyArray;
        }
        // isSemantic because we don't want to info diagnostics in declaration files for JS-only users
        return this.getDiagnosticsWorker(args, /*isSemantic*/ true, (project, file) => project.getLanguageService().getSuggestionDiagnostics(file), !!args.includeLinePosition);
    }
    private getJsxClosingTag(args: ts.server.protocol.JsxClosingTagRequestArgs): ts.TextInsertion | undefined {
        const { file, project } = this.getFileAndProject(args);
        const position = this.getPositionInFile(args, file);
        const tag = project.getLanguageService().getJsxClosingTagAtPosition(file, position);
        return tag === undefined ? undefined : { newText: tag.newText, caretOffset: 0 };
    }
    private getDocumentHighlights(args: ts.server.protocol.DocumentHighlightsRequestArgs, simplifiedResult: boolean): readonly ts.server.protocol.DocumentHighlightsItem[] | readonly ts.DocumentHighlights[] {
        const { file, project } = this.getFileAndProject(args);
        const position = this.getPositionInFile(args, file);
        const documentHighlights = project.getLanguageService().getDocumentHighlights(file, position, args.filesToSearch);
        if (!documentHighlights)
            return ts.server.emptyArray;
        if (!simplifiedResult)
            return documentHighlights;
        return documentHighlights.map<ts.server.protocol.DocumentHighlightsItem>(({ fileName, highlightSpans }) => {
            const scriptInfo = project.getScriptInfo(fileName)!;
            return {
                file: fileName,
                highlightSpans: highlightSpans.map(({ textSpan, kind, contextSpan }) => ({
                    ...toProtocolTextSpanWithContext(textSpan, contextSpan, scriptInfo),
                    kind
                }))
            };
        });
    }
    private setCompilerOptionsForInferredProjects(args: ts.server.protocol.SetCompilerOptionsForInferredProjectsArgs): void {
        this.projectService.setCompilerOptionsForInferredProjects(args.options, args.projectRootPath);
    }
    private getProjectInfo(args: ts.server.protocol.ProjectInfoRequestArgs): ts.server.protocol.ProjectInfo {
        return this.getProjectInfoWorker(args.file, args.projectFileName, args.needFileNameList, /*excludeConfigFiles*/ false);
    }
    private getProjectInfoWorker(uncheckedFileName: string, projectFileName: string | undefined, needFileNameList: boolean, excludeConfigFiles: boolean) {
        const { project } = this.getFileAndProjectWorker(uncheckedFileName, projectFileName);
        ts.server.updateProjectIfDirty(project);
        const projectInfo = {
            configFileName: project.getProjectName(),
            languageServiceDisabled: !project.languageServiceEnabled,
            fileNames: needFileNameList ? project.getFileNames(/*excludeFilesFromExternalLibraries*/ false, excludeConfigFiles) : undefined
        };
        return projectInfo;
    }
    private getRenameInfo(args: ts.server.protocol.FileLocationRequestArgs): ts.RenameInfo {
        const { file, project } = this.getFileAndProject(args);
        const position = this.getPositionInFile(args, file);
        return project.getLanguageService().getRenameInfo(file, position, { allowRenameOfImportPath: this.getPreferences(file).allowRenameOfImportPath });
    }
    private getProjects(args: ts.server.protocol.FileRequestArgs, getScriptInfoEnsuringProjectsUptoDate?: boolean, ignoreNoProjectError?: boolean): Projects {
        let projects: readonly ts.server.Project[] | undefined;
        let symLinkedProjects: ts.MultiMap<ts.server.Project> | undefined;
        if (args.projectFileName) {
            const project = this.getProject(args.projectFileName);
            if (project) {
                projects = [project];
            }
        }
        else {
            const scriptInfo = getScriptInfoEnsuringProjectsUptoDate ?
                this.projectService.getScriptInfoEnsuringProjectsUptoDate(args.file) :
                this.projectService.getScriptInfo(args.file);
            if (!scriptInfo) {
                if (ignoreNoProjectError)
                    return ts.server.emptyArray;
                this.projectService.logErrorForScriptInfoNotFound(args.file);
                return ts.server.Errors.ThrowNoProject();
            }
            projects = scriptInfo.containingProjects;
            symLinkedProjects = this.projectService.getSymlinkedProjects(scriptInfo);
        }
        // filter handles case when 'projects' is undefined
        projects = ts.filter(projects, p => p.languageServiceEnabled && !p.isOrphan());
        if (!ignoreNoProjectError && (!projects || !projects.length) && !symLinkedProjects) {
            this.projectService.logErrorForScriptInfoNotFound(args.file);
            return ts.server.Errors.ThrowNoProject();
        }
        return symLinkedProjects ? { projects: projects!, symLinkedProjects } : projects!; // TODO: GH#18217
    }
    private getDefaultProject(args: ts.server.protocol.FileRequestArgs) {
        if (args.projectFileName) {
            const project = this.getProject(args.projectFileName);
            if (project) {
                return project;
            }
        }
        const info = this.projectService.getScriptInfo(args.file)!;
        return info.getDefaultProject();
    }
    private getRenameLocations(args: ts.server.protocol.RenameRequestArgs, simplifiedResult: boolean): ts.server.protocol.RenameResponseBody | readonly ts.RenameLocation[] {
        const file = ts.server.toNormalizedPath(args.file);
        const position = this.getPositionInFile(args, file);
        const projects = this.getProjects(args);
        const locations = combineProjectOutputForRenameLocations(projects, this.getDefaultProject(args), { fileName: args.file, pos: position }, !!args.findInStrings, !!args.findInComments, this.getPreferences(file));
        if (!simplifiedResult)
            return locations;
        const defaultProject = this.getDefaultProject(args);
        const renameInfo: ts.server.protocol.RenameInfo = this.mapRenameInfo(defaultProject.getLanguageService().getRenameInfo(file, position, { allowRenameOfImportPath: this.getPreferences(file).allowRenameOfImportPath }), ts.Debug.assertDefined(this.projectService.getScriptInfo(file)));
        return { info: renameInfo, locs: this.toSpanGroups(locations) };
    }
    private mapRenameInfo(info: ts.RenameInfo, scriptInfo: ts.server.ScriptInfo): ts.server.protocol.RenameInfo {
        if (info.canRename) {
            const { canRename, fileToRename, displayName, fullDisplayName, kind, kindModifiers, triggerSpan } = info;
            return ts.identity<ts.server.protocol.RenameInfoSuccess>({ canRename, fileToRename, displayName, fullDisplayName, kind, kindModifiers, triggerSpan: toProcolTextSpan(triggerSpan, scriptInfo) });
        }
        else {
            return info;
        }
    }
    private toSpanGroups(locations: readonly ts.RenameLocation[]): readonly ts.server.protocol.SpanGroup[] {
        const map = ts.createMap<ts.server.protocol.SpanGroup>();
        for (const { fileName, textSpan, contextSpan, originalContextSpan: _2, originalTextSpan: _, originalFileName: _1, ...prefixSuffixText } of locations) {
            let group = map.get(fileName);
            if (!group)
                map.set(fileName, group = { file: fileName, locs: [] });
            const scriptInfo = ts.Debug.assertDefined(this.projectService.getScriptInfo(fileName));
            group.locs.push({ ...toProtocolTextSpanWithContext(textSpan, contextSpan, scriptInfo), ...prefixSuffixText });
        }
        return ts.arrayFrom(map.values());
    }
    private getReferences(args: ts.server.protocol.FileLocationRequestArgs, simplifiedResult: boolean): ts.server.protocol.ReferencesResponseBody | undefined | readonly ts.ReferencedSymbol[] {
        const file = ts.server.toNormalizedPath(args.file);
        const projects = this.getProjects(args);
        const position = this.getPositionInFile(args, file);
        const references = combineProjectOutputForReferences(projects, this.getDefaultProject(args), { fileName: args.file, pos: position });
        if (!simplifiedResult)
            return references;
        const defaultProject = this.getDefaultProject(args);
        const scriptInfo = defaultProject.getScriptInfoForNormalizedPath(file)!;
        const nameInfo = defaultProject.getLanguageService().getQuickInfoAtPosition(file, position);
        const symbolDisplayString = nameInfo ? ts.displayPartsToString(nameInfo.displayParts) : "";
        const nameSpan = nameInfo && nameInfo.textSpan;
        const symbolStartOffset = nameSpan ? scriptInfo.positionToLineOffset(nameSpan.start).offset : 0;
        const symbolName = nameSpan ? scriptInfo.getSnapshot().getText(nameSpan.start, ts.textSpanEnd(nameSpan)) : "";
        const refs: readonly ts.server.protocol.ReferencesResponseItem[] = ts.flatMap(references, referencedSymbol => referencedSymbol.references.map(({ fileName, textSpan, contextSpan, isWriteAccess, isDefinition }): ts.server.protocol.ReferencesResponseItem => {
            const scriptInfo = ts.Debug.assertDefined(this.projectService.getScriptInfo(fileName));
            const span = toProtocolTextSpanWithContext(textSpan, contextSpan, scriptInfo);
            const lineSpan = scriptInfo.lineToTextSpan(span.start.line - 1);
            const lineText = scriptInfo.getSnapshot().getText(lineSpan.start, ts.textSpanEnd(lineSpan)).replace(/\r|\n/g, "");
            return {
                file: fileName,
                ...span,
                lineText,
                isWriteAccess,
                isDefinition
            };
        }));
        return { refs, symbolName, symbolStartOffset, symbolDisplayString };
    }
    /**
     * @param fileName is the name of the file to be opened
     * @param fileContent is a version of the file content that is known to be more up to date than the one on disk
     */
    private openClientFile(fileName: ts.server.NormalizedPath, fileContent?: string, scriptKind?: ts.ScriptKind, projectRootPath?: ts.server.NormalizedPath) {
        this.projectService.openClientFileWithNormalizedPath(fileName, fileContent, scriptKind, /*hasMixedContent*/ false, projectRootPath);
    }
    private getPosition(args: ts.server.protocol.Location & {
        position?: number;
    }, scriptInfo: ts.server.ScriptInfo): number {
        return args.position !== undefined ? args.position : scriptInfo.lineOffsetToPosition(args.line, args.offset);
    }
    private getPositionInFile(args: ts.server.protocol.Location & {
        position?: number;
    }, file: ts.server.NormalizedPath): number {
        const scriptInfo = this.projectService.getScriptInfoForNormalizedPath(file)!;
        return this.getPosition(args, scriptInfo);
    }
    private getFileAndProject(args: ts.server.protocol.FileRequestArgs): FileAndProject {
        return this.getFileAndProjectWorker(args.file, args.projectFileName);
    }
    private getFileAndLanguageServiceForSyntacticOperation(args: ts.server.protocol.FileRequestArgs) {
        // Since this is syntactic operation, there should always be project for the file
        // we wouldnt have to ensure project but rather throw if we dont get project
        const file = ts.server.toNormalizedPath(args.file);
        const project = this.getProject(args.projectFileName) || this.projectService.tryGetDefaultProjectForFile(file);
        if (!project) {
            return ts.server.Errors.ThrowNoProject();
        }
        return {
            file,
            languageService: project.getLanguageService(/*ensureSynchronized*/ false)
        };
    }
    private getFileAndProjectWorker(uncheckedFileName: string, projectFileName: string | undefined): {
        file: ts.server.NormalizedPath;
        project: ts.server.Project;
    } {
        const file = ts.server.toNormalizedPath(uncheckedFileName);
        const project = this.getProject(projectFileName) || this.projectService.ensureDefaultProjectForFile(file);
        return { file, project };
    }
    private getOutliningSpans(args: ts.server.protocol.FileRequestArgs, simplifiedResult: boolean): ts.server.protocol.OutliningSpan[] | ts.OutliningSpan[] {
        const { file, languageService } = this.getFileAndLanguageServiceForSyntacticOperation(args);
        const spans = languageService.getOutliningSpans(file);
        if (simplifiedResult) {
            const scriptInfo = this.projectService.getScriptInfoForNormalizedPath(file)!;
            return spans.map(s => ({
                textSpan: toProcolTextSpan(s.textSpan, scriptInfo),
                hintSpan: toProcolTextSpan(s.hintSpan, scriptInfo),
                bannerText: s.bannerText,
                autoCollapse: s.autoCollapse,
                kind: s.kind
            }));
        }
        else {
            return spans;
        }
    }
    private getTodoComments(args: ts.server.protocol.TodoCommentRequestArgs) {
        const { file, project } = this.getFileAndProject(args);
        return project.getLanguageService().getTodoComments(file, args.descriptors);
    }
    private getDocCommentTemplate(args: ts.server.protocol.FileLocationRequestArgs) {
        const { file, languageService } = this.getFileAndLanguageServiceForSyntacticOperation(args);
        const position = this.getPositionInFile(args, file);
        return languageService.getDocCommentTemplateAtPosition(file, position);
    }
    private getSpanOfEnclosingComment(args: ts.server.protocol.SpanOfEnclosingCommentRequestArgs) {
        const { file, languageService } = this.getFileAndLanguageServiceForSyntacticOperation(args);
        const onlyMultiLine = args.onlyMultiLine;
        const position = this.getPositionInFile(args, file);
        return languageService.getSpanOfEnclosingComment(file, position, onlyMultiLine);
    }
    private getIndentation(args: ts.server.protocol.IndentationRequestArgs) {
        const { file, languageService } = this.getFileAndLanguageServiceForSyntacticOperation(args);
        const position = this.getPositionInFile(args, file);
        const options = args.options ? ts.server.convertFormatOptions(args.options) : this.getFormatOptions(file);
        const indentation = languageService.getIndentationAtPosition(file, position, options);
        return { position, indentation };
    }
    private getBreakpointStatement(args: ts.server.protocol.FileLocationRequestArgs) {
        const { file, languageService } = this.getFileAndLanguageServiceForSyntacticOperation(args);
        const position = this.getPositionInFile(args, file);
        return languageService.getBreakpointStatementAtPosition(file, position);
    }
    private getNameOrDottedNameSpan(args: ts.server.protocol.FileLocationRequestArgs) {
        const { file, languageService } = this.getFileAndLanguageServiceForSyntacticOperation(args);
        const position = this.getPositionInFile(args, file);
        return languageService.getNameOrDottedNameSpan(file, position, position);
    }
    private isValidBraceCompletion(args: ts.server.protocol.BraceCompletionRequestArgs) {
        const { file, languageService } = this.getFileAndLanguageServiceForSyntacticOperation(args);
        const position = this.getPositionInFile(args, file);
        return languageService.isValidBraceCompletionAtPosition(file, position, args.openingBrace.charCodeAt(0));
    }
    private getQuickInfoWorker(args: ts.server.protocol.FileLocationRequestArgs, simplifiedResult: boolean): ts.server.protocol.QuickInfoResponseBody | ts.QuickInfo | undefined {
        const { file, project } = this.getFileAndProject(args);
        const scriptInfo = this.projectService.getScriptInfoForNormalizedPath(file)!;
        const quickInfo = project.getLanguageService().getQuickInfoAtPosition(file, this.getPosition(args, scriptInfo));
        if (!quickInfo) {
            return undefined;
        }
        if (simplifiedResult) {
            const displayString = ts.displayPartsToString(quickInfo.displayParts);
            const docString = ts.displayPartsToString(quickInfo.documentation);
            return {
                kind: quickInfo.kind,
                kindModifiers: quickInfo.kindModifiers,
                start: scriptInfo.positionToLineOffset(quickInfo.textSpan.start),
                end: scriptInfo.positionToLineOffset(ts.textSpanEnd(quickInfo.textSpan)),
                displayString,
                documentation: docString,
                tags: quickInfo.tags || []
            };
        }
        else {
            return quickInfo;
        }
    }
    private getFormattingEditsForRange(args: ts.server.protocol.FormatRequestArgs): ts.server.protocol.CodeEdit[] | undefined {
        const { file, languageService } = this.getFileAndLanguageServiceForSyntacticOperation(args);
        const scriptInfo = this.projectService.getScriptInfoForNormalizedPath(file)!;
        const startPosition = scriptInfo.lineOffsetToPosition(args.line, args.offset);
        const endPosition = scriptInfo.lineOffsetToPosition(args.endLine, args.endOffset);
        // TODO: avoid duplicate code (with formatonkey)
        const edits = languageService.getFormattingEditsForRange(file, startPosition, endPosition, this.getFormatOptions(file));
        if (!edits) {
            return undefined;
        }
        return edits.map(edit => this.convertTextChangeToCodeEdit(edit, scriptInfo));
    }
    private getFormattingEditsForRangeFull(args: ts.server.protocol.FormatRequestArgs) {
        const { file, languageService } = this.getFileAndLanguageServiceForSyntacticOperation(args);
        const options = args.options ? ts.server.convertFormatOptions(args.options) : this.getFormatOptions(file);
        return languageService.getFormattingEditsForRange(file, args.position!, args.endPosition!, options); // TODO: GH#18217
    }
    private getFormattingEditsForDocumentFull(args: ts.server.protocol.FormatRequestArgs) {
        const { file, languageService } = this.getFileAndLanguageServiceForSyntacticOperation(args);
        const options = args.options ? ts.server.convertFormatOptions(args.options) : this.getFormatOptions(file);
        return languageService.getFormattingEditsForDocument(file, options);
    }
    private getFormattingEditsAfterKeystrokeFull(args: ts.server.protocol.FormatOnKeyRequestArgs) {
        const { file, languageService } = this.getFileAndLanguageServiceForSyntacticOperation(args);
        const options = args.options ? ts.server.convertFormatOptions(args.options) : this.getFormatOptions(file);
        return languageService.getFormattingEditsAfterKeystroke(file, args.position!, args.key, options); // TODO: GH#18217
    }
    private getFormattingEditsAfterKeystroke(args: ts.server.protocol.FormatOnKeyRequestArgs): ts.server.protocol.CodeEdit[] | undefined {
        const { file, languageService } = this.getFileAndLanguageServiceForSyntacticOperation(args);
        const scriptInfo = this.projectService.getScriptInfoForNormalizedPath(file)!;
        const position = scriptInfo.lineOffsetToPosition(args.line, args.offset);
        const formatOptions = this.getFormatOptions(file);
        const edits = languageService.getFormattingEditsAfterKeystroke(file, position, args.key, formatOptions);
        // Check whether we should auto-indent. This will be when
        // the position is on a line containing only whitespace.
        // This should leave the edits returned from
        // getFormattingEditsAfterKeystroke either empty or pertaining
        // only to the previous line.  If all this is true, then
        // add edits necessary to properly indent the current line.
        if ((args.key === "\n") && ((!edits) || (edits.length === 0) || allEditsBeforePos(edits, position))) {
            const { lineText, absolutePosition } = scriptInfo.getAbsolutePositionAndLineText(args.line);
            if (lineText && lineText.search("\\S") < 0) {
                const preferredIndent = languageService.getIndentationAtPosition(file, position, formatOptions);
                let hasIndent = 0;
                let i: number, len: number;
                for (i = 0, len = lineText.length; i < len; i++) {
                    if (lineText.charAt(i) === " ") {
                        hasIndent++;
                    }
                    else if (lineText.charAt(i) === "\t") {
                        hasIndent += formatOptions.tabSize!; // TODO: GH#18217
                    }
                    else {
                        break;
                    }
                }
                // i points to the first non whitespace character
                if (preferredIndent !== hasIndent) {
                    const firstNoWhiteSpacePosition = absolutePosition + i;
                    edits.push({
                        span: ts.createTextSpanFromBounds(absolutePosition, firstNoWhiteSpacePosition),
                        newText: ts.formatting.getIndentationString(preferredIndent, formatOptions)
                    });
                }
            }
        }
        if (!edits) {
            return undefined;
        }
        return edits.map((edit) => {
            return {
                start: scriptInfo.positionToLineOffset(edit.span.start),
                end: scriptInfo.positionToLineOffset(ts.textSpanEnd(edit.span)),
                newText: edit.newText ? edit.newText : ""
            };
        });
    }
    private getCompletions(args: ts.server.protocol.CompletionsRequestArgs, kind: ts.server.protocol.CommandTypes.CompletionInfo | ts.server.protocol.CommandTypes.Completions | ts.server.protocol.CommandTypes.CompletionsFull): ts.WithMetadata<readonly ts.server.protocol.CompletionEntry[]> | ts.server.protocol.CompletionInfo | ts.CompletionInfo | undefined {
        const { file, project } = this.getFileAndProject(args);
        const scriptInfo = this.projectService.getScriptInfoForNormalizedPath(file)!;
        const position = this.getPosition(args, scriptInfo);
        const completions = project.getLanguageService().getCompletionsAtPosition(file, position, {
            ...ts.server.convertUserPreferences(this.getPreferences(file)),
            triggerCharacter: args.triggerCharacter,
            includeExternalModuleExports: args.includeExternalModuleExports,
            includeInsertTextCompletions: args.includeInsertTextCompletions
        });
        if (completions === undefined)
            return undefined;
        if (kind === ts.server.protocol.CommandTypes.CompletionsFull)
            return completions;
        const prefix = args.prefix || "";
        const entries = ts.mapDefined<ts.CompletionEntry, ts.server.protocol.CompletionEntry>(completions.entries, entry => {
            if (completions.isMemberCompletion || ts.startsWith(entry.name.toLowerCase(), prefix.toLowerCase())) {
                const { name, kind, kindModifiers, sortText, insertText, replacementSpan, hasAction, source, isRecommended } = entry;
                const convertedSpan = replacementSpan ? toProcolTextSpan(replacementSpan, scriptInfo) : undefined;
                // Use `hasAction || undefined` to avoid serializing `false`.
                return { name, kind, kindModifiers, sortText, insertText, replacementSpan: convertedSpan, hasAction: hasAction || undefined, source, isRecommended };
            }
        }).sort((a, b) => ts.compareStringsCaseSensitiveUI(a.name, b.name));
        if (kind === ts.server.protocol.CommandTypes.Completions) {
            if (completions.metadata)
                (entries as ts.WithMetadata<readonly ts.server.protocol.CompletionEntry[]>).metadata = completions.metadata;
            return entries;
        }
        const res: ts.server.protocol.CompletionInfo = {
            ...completions,
            entries,
        };
        return res;
    }
    private getCompletionEntryDetails(args: ts.server.protocol.CompletionDetailsRequestArgs, simplifiedResult: boolean): readonly ts.server.protocol.CompletionEntryDetails[] | readonly ts.CompletionEntryDetails[] {
        const { file, project } = this.getFileAndProject(args);
        const scriptInfo = this.projectService.getScriptInfoForNormalizedPath(file)!;
        const position = this.getPosition(args, scriptInfo);
        const formattingOptions = project.projectService.getFormatCodeOptions(file);
        const result = ts.mapDefined(args.entryNames, entryName => {
            const { name, source } = typeof entryName === "string" ? { name: entryName, source: undefined } : entryName;
            return project.getLanguageService().getCompletionEntryDetails(file, position, name, formattingOptions, source, this.getPreferences(file));
        });
        return simplifiedResult
            ? result.map(details => ({ ...details, codeActions: ts.map(details.codeActions, action => this.mapCodeAction(action)) }))
            : result;
    }
    private getCompileOnSaveAffectedFileList(args: ts.server.protocol.FileRequestArgs): readonly ts.server.protocol.CompileOnSaveAffectedFileListSingleProject[] {
        const projects = this.getProjects(args, /*getScriptInfoEnsuringProjectsUptoDate*/ true, /*ignoreNoProjectError*/ true);
        const info = this.projectService.getScriptInfo(args.file);
        if (!info) {
            return ts.server.emptyArray;
        }
        return combineProjectOutput(info, path => this.projectService.getScriptInfoForPath(path)!, projects, (project, info) => {
            if (!project.compileOnSaveEnabled || !project.languageServiceEnabled || project.isOrphan()) {
                return undefined;
            }
            const compilationSettings = project.getCompilationSettings();
            if (!!compilationSettings.noEmit || ts.fileExtensionIs(info.fileName, ts.Extension.Dts) && !dtsChangeCanAffectEmit(compilationSettings)) {
                // avoid triggering emit when a change is made in a .d.ts when declaration emit and decorator metadata emit are disabled
                return undefined;
            }
            return {
                projectFileName: project.getProjectName(),
                fileNames: project.getCompileOnSaveAffectedFileList(info),
                projectUsesOutFile: !!compilationSettings.outFile || !!compilationSettings.out
            };
        });
    }
    private emitFile(args: ts.server.protocol.CompileOnSaveEmitFileRequestArgs) {
        const { file, project } = this.getFileAndProject(args);
        if (!project) {
            ts.server.Errors.ThrowNoProject();
        }
        if (!project.languageServiceEnabled) {
            return false;
        }
        const scriptInfo = project.getScriptInfo(file)!;
        return project.emitFile(scriptInfo, (path, data, writeByteOrderMark) => this.host.writeFile(path, data, writeByteOrderMark));
    }
    private getSignatureHelpItems(args: ts.server.protocol.SignatureHelpRequestArgs, simplifiedResult: boolean): ts.server.protocol.SignatureHelpItems | ts.SignatureHelpItems | undefined {
        const { file, project } = this.getFileAndProject(args);
        const scriptInfo = this.projectService.getScriptInfoForNormalizedPath(file)!;
        const position = this.getPosition(args, scriptInfo);
        const helpItems = project.getLanguageService().getSignatureHelpItems(file, position, args);
        if (!helpItems) {
            return undefined;
        }
        if (simplifiedResult) {
            const span = helpItems.applicableSpan;
            return {
                items: helpItems.items,
                applicableSpan: {
                    start: scriptInfo.positionToLineOffset(span.start),
                    end: scriptInfo.positionToLineOffset(span.start + span.length)
                },
                selectedItemIndex: helpItems.selectedItemIndex,
                argumentIndex: helpItems.argumentIndex,
                argumentCount: helpItems.argumentCount,
            };
        }
        else {
            return helpItems;
        }
    }
    private createCheckList(fileNames: string[]): PendingErrorCheck[] {
        return ts.mapDefined<string, PendingErrorCheck>(fileNames, uncheckedFileName => {
            const fileName = ts.server.toNormalizedPath(uncheckedFileName);
            const project = this.projectService.tryGetDefaultProjectForFile(fileName);
            return project && { fileName, project };
        });
    }
    private getDiagnostics(next: NextStep, delay: number, fileNames: string[]): void {
        if (this.suppressDiagnosticEvents) {
            return;
        }
        const checkList = this.createCheckList(fileNames);
        if (checkList.length > 0) {
            this.updateErrorCheck(next, checkList, delay);
        }
    }
    private change(args: ts.server.protocol.ChangeRequestArgs) {
        const scriptInfo = this.projectService.getScriptInfo(args.file)!;
        ts.Debug.assert(!!scriptInfo);
        const start = scriptInfo.lineOffsetToPosition(args.line, args.offset);
        const end = scriptInfo.lineOffsetToPosition(args.endLine, args.endOffset);
        if (start >= 0) {
            this.changeSeq++;
            this.projectService.applyChangesToFile(scriptInfo, ts.singleIterator({
                span: { start, length: end - start },
                newText: args.insertString! // TODO: GH#18217
            }));
        }
    }
    private reload(args: ts.server.protocol.ReloadRequestArgs, reqSeq: number) {
        const file = ts.server.toNormalizedPath(args.file);
        const tempFileName = args.tmpfile === undefined ? undefined : ts.server.toNormalizedPath(args.tmpfile);
        const info = this.projectService.getScriptInfoForNormalizedPath(file);
        if (info) {
            this.changeSeq++;
            // make sure no changes happen before this one is finished
            if (info.reloadFromFile(tempFileName)) {
                this.doOutput(/*info*/ undefined, CommandNames.Reload, reqSeq, /*success*/ true);
            }
        }
    }
    private saveToTmp(fileName: string, tempFileName: string) {
        const scriptInfo = this.projectService.getScriptInfo(fileName);
        if (scriptInfo) {
            scriptInfo.saveTo(tempFileName);
        }
    }
    private closeClientFile(fileName: string) {
        if (!fileName) {
            return;
        }
        const file = ts.normalizePath(fileName);
        this.projectService.closeClientFile(file);
    }
    private mapLocationNavigationBarItems(items: ts.NavigationBarItem[], scriptInfo: ts.server.ScriptInfo): ts.server.protocol.NavigationBarItem[] {
        return ts.map(items, item => ({
            text: item.text,
            kind: item.kind,
            kindModifiers: item.kindModifiers,
            spans: item.spans.map(span => toProcolTextSpan(span, scriptInfo)),
            childItems: this.mapLocationNavigationBarItems(item.childItems, scriptInfo),
            indent: item.indent
        }));
    }
    private getNavigationBarItems(args: ts.server.protocol.FileRequestArgs, simplifiedResult: boolean): ts.server.protocol.NavigationBarItem[] | ts.NavigationBarItem[] | undefined {
        const { file, languageService } = this.getFileAndLanguageServiceForSyntacticOperation(args);
        const items = languageService.getNavigationBarItems(file);
        return !items
            ? undefined
            : simplifiedResult
                ? this.mapLocationNavigationBarItems(items, this.projectService.getScriptInfoForNormalizedPath(file)!)
                : items;
    }
    private toLocationNavigationTree(tree: ts.NavigationTree, scriptInfo: ts.server.ScriptInfo): ts.server.protocol.NavigationTree {
        return {
            text: tree.text,
            kind: tree.kind,
            kindModifiers: tree.kindModifiers,
            spans: tree.spans.map(span => toProcolTextSpan(span, scriptInfo)),
            nameSpan: tree.nameSpan && toProcolTextSpan(tree.nameSpan, scriptInfo),
            childItems: ts.map(tree.childItems, item => this.toLocationNavigationTree(item, scriptInfo))
        };
    }
    private getNavigationTree(args: ts.server.protocol.FileRequestArgs, simplifiedResult: boolean): ts.server.protocol.NavigationTree | ts.NavigationTree | undefined {
        const { file, languageService } = this.getFileAndLanguageServiceForSyntacticOperation(args);
        const tree = languageService.getNavigationTree(file);
        return !tree
            ? undefined
            : simplifiedResult
                ? this.toLocationNavigationTree(tree, this.projectService.getScriptInfoForNormalizedPath(file)!)
                : tree;
    }
    private getNavigateToItems(args: ts.server.protocol.NavtoRequestArgs, simplifiedResult: boolean): readonly ts.server.protocol.NavtoItem[] | readonly ts.NavigateToItem[] {
        const full = this.getFullNavigateToItems(args);
        return !simplifiedResult ? full : full.map((navItem) => {
            const { file, project } = this.getFileAndProject({ file: navItem.fileName });
            const scriptInfo = project.getScriptInfo(file)!;
            const bakedItem: ts.server.protocol.NavtoItem = {
                name: navItem.name,
                kind: navItem.kind,
                isCaseSensitive: navItem.isCaseSensitive,
                matchKind: navItem.matchKind,
                file: navItem.fileName,
                start: scriptInfo.positionToLineOffset(navItem.textSpan.start),
                end: scriptInfo.positionToLineOffset(ts.textSpanEnd(navItem.textSpan))
            };
            if (navItem.kindModifiers && (navItem.kindModifiers !== "")) {
                bakedItem.kindModifiers = navItem.kindModifiers;
            }
            if (navItem.containerName && (navItem.containerName.length > 0)) {
                bakedItem.containerName = navItem.containerName;
            }
            if (navItem.containerKind && (navItem.containerKind.length > 0)) {
                bakedItem.containerKind = navItem.containerKind;
            }
            return bakedItem;
        });
    }
    private getFullNavigateToItems(args: ts.server.protocol.NavtoRequestArgs): readonly ts.NavigateToItem[] {
        const { currentFileOnly, searchValue, maxResultCount } = args;
        if (currentFileOnly) {
            const { file, project } = this.getFileAndProject(args);
            return project.getLanguageService().getNavigateToItems(searchValue, maxResultCount, file);
        }
        else {
            return combineProjectOutputWhileOpeningReferencedProjects<ts.NavigateToItem>(this.getProjects(args), this.getDefaultProject(args), project => project.getLanguageService().getNavigateToItems(searchValue, maxResultCount, /*fileName*/ undefined, /*excludeDts*/ project.isNonTsProject()), documentSpanLocation, navigateToItemIsEqualTo);
        }
        function navigateToItemIsEqualTo(a: ts.NavigateToItem, b: ts.NavigateToItem): boolean {
            if (a === b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            return a.containerKind === b.containerKind &&
                a.containerName === b.containerName &&
                a.fileName === b.fileName &&
                a.isCaseSensitive === b.isCaseSensitive &&
                a.kind === b.kind &&
                a.kindModifiers === b.containerName &&
                a.matchKind === b.matchKind &&
                a.name === b.name &&
                a.textSpan.start === b.textSpan.start &&
                a.textSpan.length === b.textSpan.length;
        }
    }
    private getSupportedCodeFixes(): string[] {
        return ts.getSupportedCodeFixes();
    }
    private isLocation(locationOrSpan: ts.server.protocol.FileLocationOrRangeRequestArgs): locationOrSpan is ts.server.protocol.FileLocationRequestArgs {
        return (<ts.server.protocol.FileLocationRequestArgs>locationOrSpan).line !== undefined;
    }
    private extractPositionOrRange(args: ts.server.protocol.FileLocationOrRangeRequestArgs, scriptInfo: ts.server.ScriptInfo): number | ts.TextRange {
        let position: number | undefined;
        let textRange: ts.TextRange | undefined;
        if (this.isLocation(args)) {
            position = getPosition(args);
        }
        else {
            const { startPosition, endPosition } = this.getStartAndEndPosition(args, scriptInfo);
            textRange = { pos: startPosition, end: endPosition };
        }
        return ts.Debug.assertDefined(position === undefined ? textRange : position);
        function getPosition(loc: ts.server.protocol.FileLocationRequestArgs) {
            return loc.position !== undefined ? loc.position : scriptInfo.lineOffsetToPosition(loc.line, loc.offset);
        }
    }
    private getApplicableRefactors(args: ts.server.protocol.GetApplicableRefactorsRequestArgs): ts.server.protocol.ApplicableRefactorInfo[] {
        const { file, project } = this.getFileAndProject(args);
        const scriptInfo = project.getScriptInfoForNormalizedPath(file)!;
        return project.getLanguageService().getApplicableRefactors(file, this.extractPositionOrRange(args, scriptInfo), this.getPreferences(file));
    }
    private getEditsForRefactor(args: ts.server.protocol.GetEditsForRefactorRequestArgs, simplifiedResult: boolean): ts.RefactorEditInfo | ts.server.protocol.RefactorEditInfo {
        const { file, project } = this.getFileAndProject(args);
        const scriptInfo = project.getScriptInfoForNormalizedPath(file)!;
        const result = project.getLanguageService().getEditsForRefactor(file, this.getFormatOptions(file), this.extractPositionOrRange(args, scriptInfo), args.refactor, args.action, this.getPreferences(file));
        if (result === undefined) {
            return {
                edits: []
            };
        }
        if (simplifiedResult) {
            const { renameFilename, renameLocation, edits } = result;
            let mappedRenameLocation: ts.server.protocol.Location | undefined;
            if (renameFilename !== undefined && renameLocation !== undefined) {
                const renameScriptInfo = (project.getScriptInfoForNormalizedPath(ts.server.toNormalizedPath(renameFilename))!);
                mappedRenameLocation = getLocationInNewDocument(ts.getSnapshotText(renameScriptInfo.getSnapshot()), renameFilename, renameLocation, edits);
            }
            return { renameLocation: mappedRenameLocation, renameFilename, edits: this.mapTextChangesToCodeEdits(edits) };
        }
        else {
            return result;
        }
    }
    private organizeImports({ scope }: ts.server.protocol.OrganizeImportsRequestArgs, simplifiedResult: boolean): readonly ts.server.protocol.FileCodeEdits[] | readonly ts.FileTextChanges[] {
        ts.Debug.assert(scope.type === "file");
        const { file, project } = this.getFileAndProject(scope.args);
        const changes = project.getLanguageService().organizeImports({ type: "file", fileName: file }, this.getFormatOptions(file), this.getPreferences(file));
        if (simplifiedResult) {
            return this.mapTextChangesToCodeEdits(changes);
        }
        else {
            return changes;
        }
    }
    private getEditsForFileRename(args: ts.server.protocol.GetEditsForFileRenameRequestArgs, simplifiedResult: boolean): readonly ts.server.protocol.FileCodeEdits[] | readonly ts.FileTextChanges[] {
        const oldPath = ts.server.toNormalizedPath(args.oldFilePath);
        const newPath = ts.server.toNormalizedPath(args.newFilePath);
        const formatOptions = this.getHostFormatOptions();
        const preferences = this.getHostPreferences();
        const changes = combineProjectOutputFromEveryProject(this.projectService, project => project.getLanguageService().getEditsForFileRename(oldPath, newPath, formatOptions, preferences), (a, b) => a.fileName === b.fileName);
        return simplifiedResult ? changes.map(c => this.mapTextChangeToCodeEdit(c)) : changes;
    }
    private getCodeFixes(args: ts.server.protocol.CodeFixRequestArgs, simplifiedResult: boolean): readonly ts.server.protocol.CodeFixAction[] | readonly ts.CodeFixAction[] | undefined {
        const { file, project } = this.getFileAndProject(args);
        const scriptInfo = project.getScriptInfoForNormalizedPath(file)!;
        const { startPosition, endPosition } = this.getStartAndEndPosition(args, scriptInfo);
        const codeActions = project.getLanguageService().getCodeFixesAtPosition(file, startPosition, endPosition, args.errorCodes, this.getFormatOptions(file), this.getPreferences(file));
        return simplifiedResult ? codeActions.map(codeAction => this.mapCodeFixAction(codeAction)) : codeActions;
    }
    private getCombinedCodeFix({ scope, fixId }: ts.server.protocol.GetCombinedCodeFixRequestArgs, simplifiedResult: boolean): ts.server.protocol.CombinedCodeActions | ts.CombinedCodeActions {
        ts.Debug.assert(scope.type === "file");
        const { file, project } = this.getFileAndProject(scope.args);
        const res = project.getLanguageService().getCombinedCodeFix({ type: "file", fileName: file }, fixId, this.getFormatOptions(file), this.getPreferences(file));
        if (simplifiedResult) {
            return { changes: this.mapTextChangesToCodeEdits(res.changes), commands: res.commands };
        }
        else {
            return res;
        }
    }
    private applyCodeActionCommand(args: ts.server.protocol.ApplyCodeActionCommandRequestArgs): {} {
        const commands = (args.command as ts.CodeActionCommand | ts.CodeActionCommand[]); // They should be sending back the command we sent them.
        for (const command of ts.toArray(commands)) {
            const { file, project } = this.getFileAndProject(command);
            project.getLanguageService().applyCodeActionCommand(command, this.getFormatOptions(file)).then(_result => { }, _error => { });
        }
        return {};
    }
    private getStartAndEndPosition(args: ts.server.protocol.FileRangeRequestArgs, scriptInfo: ts.server.ScriptInfo) {
        let startPosition: number | undefined, endPosition: number | undefined;
        if (args.startPosition !== undefined) {
            startPosition = args.startPosition;
        }
        else {
            startPosition = scriptInfo.lineOffsetToPosition(args.startLine, args.startOffset);
            // save the result so we don't always recompute
            args.startPosition = startPosition;
        }
        if (args.endPosition !== undefined) {
            endPosition = args.endPosition;
        }
        else {
            endPosition = scriptInfo.lineOffsetToPosition(args.endLine, args.endOffset);
            args.endPosition = endPosition;
        }
        return { startPosition, endPosition };
    }
    private mapCodeAction({ description, changes, commands }: ts.CodeAction): ts.server.protocol.CodeAction {
        return { description, changes: this.mapTextChangesToCodeEdits(changes), commands };
    }
    private mapCodeFixAction({ fixName, description, changes, commands, fixId, fixAllDescription }: ts.CodeFixAction): ts.server.protocol.CodeFixAction {
        return { fixName, description, changes: this.mapTextChangesToCodeEdits(changes), commands, fixId, fixAllDescription };
    }
    private mapTextChangesToCodeEdits(textChanges: readonly ts.FileTextChanges[]): ts.server.protocol.FileCodeEdits[] {
        return textChanges.map(change => this.mapTextChangeToCodeEdit(change));
    }
    private mapTextChangeToCodeEdit(textChanges: ts.FileTextChanges): ts.server.protocol.FileCodeEdits {
        const scriptInfo = this.projectService.getScriptInfoOrConfig(textChanges.fileName);
        if (!!textChanges.isNewFile === !!scriptInfo) {
            if (!scriptInfo) { // and !isNewFile
                this.projectService.logErrorForScriptInfoNotFound(textChanges.fileName);
            }
            ts.Debug.fail("Expected isNewFile for (only) new files. " + JSON.stringify({ isNewFile: !!textChanges.isNewFile, hasScriptInfo: !!scriptInfo }));
        }
        return scriptInfo
            ? { fileName: textChanges.fileName, textChanges: textChanges.textChanges.map(textChange => convertTextChangeToCodeEdit(textChange, scriptInfo)) }
            : convertNewFileTextChangeToCodeEdit(textChanges);
    }
    private convertTextChangeToCodeEdit(change: ts.TextChange, scriptInfo: ts.server.ScriptInfo): ts.server.protocol.CodeEdit {
        return {
            start: scriptInfo.positionToLineOffset(change.span.start),
            end: scriptInfo.positionToLineOffset(change.span.start + change.span.length),
            newText: change.newText ? change.newText : ""
        };
    }
    private getBraceMatching(args: ts.server.protocol.FileLocationRequestArgs, simplifiedResult: boolean): ts.server.protocol.TextSpan[] | ts.TextSpan[] | undefined {
        const { file, languageService } = this.getFileAndLanguageServiceForSyntacticOperation(args);
        const scriptInfo = this.projectService.getScriptInfoForNormalizedPath(file)!;
        const position = this.getPosition(args, scriptInfo);
        const spans = languageService.getBraceMatchingAtPosition(file, position);
        return !spans
            ? undefined
            : simplifiedResult
                ? spans.map(span => toProcolTextSpan(span, scriptInfo))
                : spans;
    }
    private getDiagnosticsForProject(next: NextStep, delay: number, fileName: string): void {
        if (this.suppressDiagnosticEvents) {
            return;
        }
        const { fileNames, languageServiceDisabled } = this.getProjectInfoWorker(fileName, /*projectFileName*/ undefined, /*needFileNameList*/ true, /*excludeConfigFiles*/ true);
        if (languageServiceDisabled) {
            return;
        }
        // No need to analyze lib.d.ts
        const fileNamesInProject = fileNames!.filter(value => !ts.stringContains(value, "lib.d.ts")); // TODO: GH#18217
        if (fileNamesInProject.length === 0) {
            return;
        }
        // Sort the file name list to make the recently touched files come first
        const highPriorityFiles: ts.server.NormalizedPath[] = [];
        const mediumPriorityFiles: ts.server.NormalizedPath[] = [];
        const lowPriorityFiles: ts.server.NormalizedPath[] = [];
        const veryLowPriorityFiles: ts.server.NormalizedPath[] = [];
        const normalizedFileName = ts.server.toNormalizedPath(fileName);
        const project = this.projectService.ensureDefaultProjectForFile(normalizedFileName);
        for (const fileNameInProject of fileNamesInProject) {
            if (this.getCanonicalFileName(fileNameInProject) === this.getCanonicalFileName(fileName)) {
                highPriorityFiles.push(fileNameInProject);
            }
            else {
                const info = this.projectService.getScriptInfo(fileNameInProject)!; // TODO: GH#18217
                if (!info.isScriptOpen()) {
                    if (ts.fileExtensionIs(fileNameInProject, ts.Extension.Dts)) {
                        veryLowPriorityFiles.push(fileNameInProject);
                    }
                    else {
                        lowPriorityFiles.push(fileNameInProject);
                    }
                }
                else {
                    mediumPriorityFiles.push(fileNameInProject);
                }
            }
        }
        const sortedFiles = [...highPriorityFiles, ...mediumPriorityFiles, ...lowPriorityFiles, ...veryLowPriorityFiles];
        const checkList = sortedFiles.map(fileName => ({ fileName, project }));
        // Project level error analysis runs on background files too, therefore
        // doesn't require the file to be opened
        this.updateErrorCheck(next, checkList, delay, /*requireOpen*/ false);
    }
    private configurePlugin(args: ts.server.protocol.ConfigurePluginRequestArguments) {
        this.projectService.configurePlugin(args);
    }
    private getSmartSelectionRange(args: ts.server.protocol.SelectionRangeRequestArgs, simplifiedResult: boolean) {
        const { locations } = args;
        const { file, languageService } = this.getFileAndLanguageServiceForSyntacticOperation(args);
        const scriptInfo = ts.Debug.assertDefined(this.projectService.getScriptInfo(file));
        return ts.map(locations, location => {
            const pos = this.getPosition(location, scriptInfo);
            const selectionRange = languageService.getSmartSelectionRange(file, pos);
            return simplifiedResult ? this.mapSelectionRange(selectionRange, scriptInfo) : selectionRange;
        });
    }
    private mapSelectionRange(selectionRange: ts.SelectionRange, scriptInfo: ts.server.ScriptInfo): ts.server.protocol.SelectionRange {
        const result: ts.server.protocol.SelectionRange = {
            textSpan: toProcolTextSpan(selectionRange.textSpan, scriptInfo),
        };
        if (selectionRange.parent) {
            result.parent = this.mapSelectionRange(selectionRange.parent, scriptInfo);
        }
        return result;
    }
    getCanonicalFileName(fileName: string) {
        const name = this.host.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase();
        return ts.normalizePath(name);
    }
    exit() { }
    private notRequired(): HandlerResponse {
        return { responseRequired: false };
    }
    private requiredResponse(response: {} | undefined): HandlerResponse {
        return { response, responseRequired: true };
    }
    private handlers = ts.createMapFromTemplate<(request: ts.server.protocol.Request) => HandlerResponse>({
        [CommandNames.Status]: () => {
            const response: ts.server.protocol.StatusResponseBody = { version: ts.version }; // eslint-disable-line @typescript-eslint/no-unnecessary-qualifier
            return this.requiredResponse(response);
        },
        [CommandNames.OpenExternalProject]: (request: ts.server.protocol.OpenExternalProjectRequest) => {
            this.projectService.openExternalProject(request.arguments);
            // TODO: GH#20447 report errors
            return this.requiredResponse(/*response*/ true);
        },
        [CommandNames.OpenExternalProjects]: (request: ts.server.protocol.OpenExternalProjectsRequest) => {
            this.projectService.openExternalProjects(request.arguments.projects);
            // TODO: GH#20447 report errors
            return this.requiredResponse(/*response*/ true);
        },
        [CommandNames.CloseExternalProject]: (request: ts.server.protocol.CloseExternalProjectRequest) => {
            this.projectService.closeExternalProject(request.arguments.projectFileName);
            // TODO: GH#20447 report errors
            return this.requiredResponse(/*response*/ true);
        },
        [CommandNames.SynchronizeProjectList]: (request: ts.server.protocol.SynchronizeProjectListRequest) => {
            const result = this.projectService.synchronizeProjectList(request.arguments.knownProjects);
            if (!result.some(p => p.projectErrors && p.projectErrors.length !== 0)) {
                return this.requiredResponse(result);
            }
            const converted = ts.map(result, p => {
                if (!p.projectErrors || p.projectErrors.length === 0) {
                    return p;
                }
                return {
                    info: p.info,
                    changes: p.changes,
                    files: p.files,
                    projectErrors: this.convertToDiagnosticsWithLinePosition(p.projectErrors, /*scriptInfo*/ undefined)
                };
            });
            return this.requiredResponse(converted);
        },
        [CommandNames.UpdateOpen]: (request: ts.server.protocol.UpdateOpenRequest) => {
            this.changeSeq++;
            this.projectService.applyChangesInOpenFiles(request.arguments.openFiles && ts.mapIterator(ts.arrayIterator(request.arguments.openFiles), file => ({
                fileName: file.file,
                content: file.fileContent,
                scriptKind: file.scriptKindName,
                projectRootPath: file.projectRootPath
            })), request.arguments.changedFiles && ts.mapIterator(ts.arrayIterator(request.arguments.changedFiles), file => ({
                fileName: file.fileName,
                changes: ts.mapDefinedIterator(ts.arrayReverseIterator(file.textChanges), change => {
                    const scriptInfo = ts.Debug.assertDefined(this.projectService.getScriptInfo(file.fileName));
                    const start = scriptInfo.lineOffsetToPosition(change.start.line, change.start.offset);
                    const end = scriptInfo.lineOffsetToPosition(change.end.line, change.end.offset);
                    return start >= 0 ? { span: { start, length: end - start }, newText: change.newText } : undefined;
                })
            })), request.arguments.closedFiles);
            return this.requiredResponse(/*response*/ true);
        },
        [CommandNames.ApplyChangedToOpenFiles]: (request: ts.server.protocol.ApplyChangedToOpenFilesRequest) => {
            this.changeSeq++;
            this.projectService.applyChangesInOpenFiles(request.arguments.openFiles && ts.arrayIterator(request.arguments.openFiles), request.arguments.changedFiles && ts.mapIterator(ts.arrayIterator(request.arguments.changedFiles), file => ({
                fileName: file.fileName,
                // apply changes in reverse order
                changes: ts.arrayReverseIterator(file.changes)
            })), request.arguments.closedFiles);
            // TODO: report errors
            return this.requiredResponse(/*response*/ true);
        },
        [CommandNames.Exit]: () => {
            this.exit();
            return this.notRequired();
        },
        [CommandNames.Definition]: (request: ts.server.protocol.DefinitionRequest) => {
            return this.requiredResponse(this.getDefinition(request.arguments, /*simplifiedResult*/ true));
        },
        [CommandNames.DefinitionFull]: (request: ts.server.protocol.DefinitionRequest) => {
            return this.requiredResponse(this.getDefinition(request.arguments, /*simplifiedResult*/ false));
        },
        [CommandNames.DefinitionAndBoundSpan]: (request: ts.server.protocol.DefinitionRequest) => {
            return this.requiredResponse(this.getDefinitionAndBoundSpan(request.arguments, /*simplifiedResult*/ true));
        },
        [CommandNames.DefinitionAndBoundSpanFull]: (request: ts.server.protocol.DefinitionRequest) => {
            return this.requiredResponse(this.getDefinitionAndBoundSpan(request.arguments, /*simplifiedResult*/ false));
        },
        [CommandNames.EmitOutput]: (request: ts.server.protocol.EmitOutputRequest) => {
            return this.requiredResponse(this.getEmitOutput(request.arguments));
        },
        [CommandNames.TypeDefinition]: (request: ts.server.protocol.FileLocationRequest) => {
            return this.requiredResponse(this.getTypeDefinition(request.arguments));
        },
        [CommandNames.Implementation]: (request: ts.server.protocol.Request) => {
            return this.requiredResponse(this.getImplementation(request.arguments, /*simplifiedResult*/ true));
        },
        [CommandNames.ImplementationFull]: (request: ts.server.protocol.Request) => {
            return this.requiredResponse(this.getImplementation(request.arguments, /*simplifiedResult*/ false));
        },
        [CommandNames.References]: (request: ts.server.protocol.FileLocationRequest) => {
            return this.requiredResponse(this.getReferences(request.arguments, /*simplifiedResult*/ true));
        },
        [CommandNames.ReferencesFull]: (request: ts.server.protocol.FileLocationRequest) => {
            return this.requiredResponse(this.getReferences(request.arguments, /*simplifiedResult*/ false));
        },
        [CommandNames.Rename]: (request: ts.server.protocol.RenameRequest) => {
            return this.requiredResponse(this.getRenameLocations(request.arguments, /*simplifiedResult*/ true));
        },
        [CommandNames.RenameLocationsFull]: (request: ts.server.protocol.RenameFullRequest) => {
            return this.requiredResponse(this.getRenameLocations(request.arguments, /*simplifiedResult*/ false));
        },
        [CommandNames.RenameInfoFull]: (request: ts.server.protocol.FileLocationRequest) => {
            return this.requiredResponse(this.getRenameInfo(request.arguments));
        },
        [CommandNames.Open]: (request: ts.server.protocol.OpenRequest) => {
            this.openClientFile(ts.server.toNormalizedPath(request.arguments.file), request.arguments.fileContent, ts.server.convertScriptKindName((request.arguments.scriptKindName!)), // TODO: GH#18217
            request.arguments.projectRootPath ? ts.server.toNormalizedPath(request.arguments.projectRootPath) : undefined);
            return this.notRequired();
        },
        [CommandNames.Quickinfo]: (request: ts.server.protocol.QuickInfoRequest) => {
            return this.requiredResponse(this.getQuickInfoWorker(request.arguments, /*simplifiedResult*/ true));
        },
        [CommandNames.QuickinfoFull]: (request: ts.server.protocol.QuickInfoRequest) => {
            return this.requiredResponse(this.getQuickInfoWorker(request.arguments, /*simplifiedResult*/ false));
        },
        [CommandNames.GetOutliningSpans]: (request: ts.server.protocol.FileRequest) => {
            return this.requiredResponse(this.getOutliningSpans(request.arguments, /*simplifiedResult*/ true));
        },
        [CommandNames.GetOutliningSpansFull]: (request: ts.server.protocol.FileRequest) => {
            return this.requiredResponse(this.getOutliningSpans(request.arguments, /*simplifiedResult*/ false));
        },
        [CommandNames.TodoComments]: (request: ts.server.protocol.TodoCommentRequest) => {
            return this.requiredResponse(this.getTodoComments(request.arguments));
        },
        [CommandNames.Indentation]: (request: ts.server.protocol.IndentationRequest) => {
            return this.requiredResponse(this.getIndentation(request.arguments));
        },
        [CommandNames.NameOrDottedNameSpan]: (request: ts.server.protocol.FileLocationRequest) => {
            return this.requiredResponse(this.getNameOrDottedNameSpan(request.arguments));
        },
        [CommandNames.BreakpointStatement]: (request: ts.server.protocol.FileLocationRequest) => {
            return this.requiredResponse(this.getBreakpointStatement(request.arguments));
        },
        [CommandNames.BraceCompletion]: (request: ts.server.protocol.BraceCompletionRequest) => {
            return this.requiredResponse(this.isValidBraceCompletion(request.arguments));
        },
        [CommandNames.DocCommentTemplate]: (request: ts.server.protocol.DocCommentTemplateRequest) => {
            return this.requiredResponse(this.getDocCommentTemplate(request.arguments));
        },
        [CommandNames.GetSpanOfEnclosingComment]: (request: ts.server.protocol.SpanOfEnclosingCommentRequest) => {
            return this.requiredResponse(this.getSpanOfEnclosingComment(request.arguments));
        },
        [CommandNames.Format]: (request: ts.server.protocol.FormatRequest) => {
            return this.requiredResponse(this.getFormattingEditsForRange(request.arguments));
        },
        [CommandNames.Formatonkey]: (request: ts.server.protocol.FormatOnKeyRequest) => {
            return this.requiredResponse(this.getFormattingEditsAfterKeystroke(request.arguments));
        },
        [CommandNames.FormatFull]: (request: ts.server.protocol.FormatRequest) => {
            return this.requiredResponse(this.getFormattingEditsForDocumentFull(request.arguments));
        },
        [CommandNames.FormatonkeyFull]: (request: ts.server.protocol.FormatOnKeyRequest) => {
            return this.requiredResponse(this.getFormattingEditsAfterKeystrokeFull(request.arguments));
        },
        [CommandNames.FormatRangeFull]: (request: ts.server.protocol.FormatRequest) => {
            return this.requiredResponse(this.getFormattingEditsForRangeFull(request.arguments));
        },
        [CommandNames.CompletionInfo]: (request: ts.server.protocol.CompletionsRequest) => {
            return this.requiredResponse(this.getCompletions(request.arguments, CommandNames.CompletionInfo));
        },
        [CommandNames.Completions]: (request: ts.server.protocol.CompletionsRequest) => {
            return this.requiredResponse(this.getCompletions(request.arguments, CommandNames.Completions));
        },
        [CommandNames.CompletionsFull]: (request: ts.server.protocol.CompletionsRequest) => {
            return this.requiredResponse(this.getCompletions(request.arguments, CommandNames.CompletionsFull));
        },
        [CommandNames.CompletionDetails]: (request: ts.server.protocol.CompletionDetailsRequest) => {
            return this.requiredResponse(this.getCompletionEntryDetails(request.arguments, /*simplifiedResult*/ true));
        },
        [CommandNames.CompletionDetailsFull]: (request: ts.server.protocol.CompletionDetailsRequest) => {
            return this.requiredResponse(this.getCompletionEntryDetails(request.arguments, /*simplifiedResult*/ false));
        },
        [CommandNames.CompileOnSaveAffectedFileList]: (request: ts.server.protocol.CompileOnSaveAffectedFileListRequest) => {
            return this.requiredResponse(this.getCompileOnSaveAffectedFileList(request.arguments));
        },
        [CommandNames.CompileOnSaveEmitFile]: (request: ts.server.protocol.CompileOnSaveEmitFileRequest) => {
            return this.requiredResponse(this.emitFile(request.arguments));
        },
        [CommandNames.SignatureHelp]: (request: ts.server.protocol.SignatureHelpRequest) => {
            return this.requiredResponse(this.getSignatureHelpItems(request.arguments, /*simplifiedResult*/ true));
        },
        [CommandNames.SignatureHelpFull]: (request: ts.server.protocol.SignatureHelpRequest) => {
            return this.requiredResponse(this.getSignatureHelpItems(request.arguments, /*simplifiedResult*/ false));
        },
        [CommandNames.CompilerOptionsDiagnosticsFull]: (request: ts.server.protocol.CompilerOptionsDiagnosticsRequest) => {
            return this.requiredResponse(this.getCompilerOptionsDiagnostics(request.arguments));
        },
        [CommandNames.EncodedSyntacticClassificationsFull]: (request: ts.server.protocol.EncodedSyntacticClassificationsRequest) => {
            return this.requiredResponse(this.getEncodedSyntacticClassifications(request.arguments));
        },
        [CommandNames.EncodedSemanticClassificationsFull]: (request: ts.server.protocol.EncodedSemanticClassificationsRequest) => {
            return this.requiredResponse(this.getEncodedSemanticClassifications(request.arguments));
        },
        [CommandNames.Cleanup]: () => {
            this.cleanup();
            return this.requiredResponse(/*response*/ true);
        },
        [CommandNames.SemanticDiagnosticsSync]: (request: ts.server.protocol.SemanticDiagnosticsSyncRequest) => {
            return this.requiredResponse(this.getSemanticDiagnosticsSync(request.arguments));
        },
        [CommandNames.SyntacticDiagnosticsSync]: (request: ts.server.protocol.SyntacticDiagnosticsSyncRequest) => {
            return this.requiredResponse(this.getSyntacticDiagnosticsSync(request.arguments));
        },
        [CommandNames.SuggestionDiagnosticsSync]: (request: ts.server.protocol.SuggestionDiagnosticsSyncRequest) => {
            return this.requiredResponse(this.getSuggestionDiagnosticsSync(request.arguments));
        },
        [CommandNames.Geterr]: (request: ts.server.protocol.GeterrRequest) => {
            this.errorCheck.startNew(next => this.getDiagnostics(next, request.arguments.delay, request.arguments.files));
            return this.notRequired();
        },
        [CommandNames.GeterrForProject]: (request: ts.server.protocol.GeterrForProjectRequest) => {
            this.errorCheck.startNew(next => this.getDiagnosticsForProject(next, request.arguments.delay, request.arguments.file));
            return this.notRequired();
        },
        [CommandNames.Change]: (request: ts.server.protocol.ChangeRequest) => {
            this.change(request.arguments);
            return this.notRequired();
        },
        [CommandNames.Configure]: (request: ts.server.protocol.ConfigureRequest) => {
            this.projectService.setHostConfiguration(request.arguments);
            this.doOutput(/*info*/ undefined, CommandNames.Configure, request.seq, /*success*/ true);
            return this.notRequired();
        },
        [CommandNames.Reload]: (request: ts.server.protocol.ReloadRequest) => {
            this.reload(request.arguments, request.seq);
            return this.requiredResponse({ reloadFinished: true });
        },
        [CommandNames.Saveto]: (request: ts.server.protocol.Request) => {
            const savetoArgs = (<ts.server.protocol.SavetoRequestArgs>request.arguments);
            this.saveToTmp(savetoArgs.file, savetoArgs.tmpfile);
            return this.notRequired();
        },
        [CommandNames.Close]: (request: ts.server.protocol.Request) => {
            const closeArgs = (<ts.server.protocol.FileRequestArgs>request.arguments);
            this.closeClientFile(closeArgs.file);
            return this.notRequired();
        },
        [CommandNames.Navto]: (request: ts.server.protocol.NavtoRequest) => {
            return this.requiredResponse(this.getNavigateToItems(request.arguments, /*simplifiedResult*/ true));
        },
        [CommandNames.NavtoFull]: (request: ts.server.protocol.NavtoRequest) => {
            return this.requiredResponse(this.getNavigateToItems(request.arguments, /*simplifiedResult*/ false));
        },
        [CommandNames.Brace]: (request: ts.server.protocol.FileLocationRequest) => {
            return this.requiredResponse(this.getBraceMatching(request.arguments, /*simplifiedResult*/ true));
        },
        [CommandNames.BraceFull]: (request: ts.server.protocol.FileLocationRequest) => {
            return this.requiredResponse(this.getBraceMatching(request.arguments, /*simplifiedResult*/ false));
        },
        [CommandNames.NavBar]: (request: ts.server.protocol.FileRequest) => {
            return this.requiredResponse(this.getNavigationBarItems(request.arguments, /*simplifiedResult*/ true));
        },
        [CommandNames.NavBarFull]: (request: ts.server.protocol.FileRequest) => {
            return this.requiredResponse(this.getNavigationBarItems(request.arguments, /*simplifiedResult*/ false));
        },
        [CommandNames.NavTree]: (request: ts.server.protocol.FileRequest) => {
            return this.requiredResponse(this.getNavigationTree(request.arguments, /*simplifiedResult*/ true));
        },
        [CommandNames.NavTreeFull]: (request: ts.server.protocol.FileRequest) => {
            return this.requiredResponse(this.getNavigationTree(request.arguments, /*simplifiedResult*/ false));
        },
        [CommandNames.Occurrences]: (request: ts.server.protocol.FileLocationRequest) => {
            return this.requiredResponse(this.getOccurrences(request.arguments));
        },
        [CommandNames.DocumentHighlights]: (request: ts.server.protocol.DocumentHighlightsRequest) => {
            return this.requiredResponse(this.getDocumentHighlights(request.arguments, /*simplifiedResult*/ true));
        },
        [CommandNames.DocumentHighlightsFull]: (request: ts.server.protocol.DocumentHighlightsRequest) => {
            return this.requiredResponse(this.getDocumentHighlights(request.arguments, /*simplifiedResult*/ false));
        },
        [CommandNames.CompilerOptionsForInferredProjects]: (request: ts.server.protocol.SetCompilerOptionsForInferredProjectsRequest) => {
            this.setCompilerOptionsForInferredProjects(request.arguments);
            return this.requiredResponse(/*response*/ true);
        },
        [CommandNames.ProjectInfo]: (request: ts.server.protocol.ProjectInfoRequest) => {
            return this.requiredResponse(this.getProjectInfo(request.arguments));
        },
        [CommandNames.ReloadProjects]: () => {
            this.projectService.reloadProjects();
            return this.notRequired();
        },
        [CommandNames.JsxClosingTag]: (request: ts.server.protocol.JsxClosingTagRequest) => {
            return this.requiredResponse(this.getJsxClosingTag(request.arguments));
        },
        [CommandNames.GetCodeFixes]: (request: ts.server.protocol.CodeFixRequest) => {
            return this.requiredResponse(this.getCodeFixes(request.arguments, /*simplifiedResult*/ true));
        },
        [CommandNames.GetCodeFixesFull]: (request: ts.server.protocol.CodeFixRequest) => {
            return this.requiredResponse(this.getCodeFixes(request.arguments, /*simplifiedResult*/ false));
        },
        [CommandNames.GetCombinedCodeFix]: (request: ts.server.protocol.GetCombinedCodeFixRequest) => {
            return this.requiredResponse(this.getCombinedCodeFix(request.arguments, /*simplifiedResult*/ true));
        },
        [CommandNames.GetCombinedCodeFixFull]: (request: ts.server.protocol.GetCombinedCodeFixRequest) => {
            return this.requiredResponse(this.getCombinedCodeFix(request.arguments, /*simplifiedResult*/ false));
        },
        [CommandNames.ApplyCodeActionCommand]: (request: ts.server.protocol.ApplyCodeActionCommandRequest) => {
            return this.requiredResponse(this.applyCodeActionCommand(request.arguments));
        },
        [CommandNames.GetSupportedCodeFixes]: () => {
            return this.requiredResponse(this.getSupportedCodeFixes());
        },
        [CommandNames.GetApplicableRefactors]: (request: ts.server.protocol.GetApplicableRefactorsRequest) => {
            return this.requiredResponse(this.getApplicableRefactors(request.arguments));
        },
        [CommandNames.GetEditsForRefactor]: (request: ts.server.protocol.GetEditsForRefactorRequest) => {
            return this.requiredResponse(this.getEditsForRefactor(request.arguments, /*simplifiedResult*/ true));
        },
        [CommandNames.GetEditsForRefactorFull]: (request: ts.server.protocol.GetEditsForRefactorRequest) => {
            return this.requiredResponse(this.getEditsForRefactor(request.arguments, /*simplifiedResult*/ false));
        },
        [CommandNames.OrganizeImports]: (request: ts.server.protocol.OrganizeImportsRequest) => {
            return this.requiredResponse(this.organizeImports(request.arguments, /*simplifiedResult*/ true));
        },
        [CommandNames.OrganizeImportsFull]: (request: ts.server.protocol.OrganizeImportsRequest) => {
            return this.requiredResponse(this.organizeImports(request.arguments, /*simplifiedResult*/ false));
        },
        [CommandNames.GetEditsForFileRename]: (request: ts.server.protocol.GetEditsForFileRenameRequest) => {
            return this.requiredResponse(this.getEditsForFileRename(request.arguments, /*simplifiedResult*/ true));
        },
        [CommandNames.GetEditsForFileRenameFull]: (request: ts.server.protocol.GetEditsForFileRenameRequest) => {
            return this.requiredResponse(this.getEditsForFileRename(request.arguments, /*simplifiedResult*/ false));
        },
        [CommandNames.ConfigurePlugin]: (request: ts.server.protocol.ConfigurePluginRequest) => {
            this.configurePlugin(request.arguments);
            this.doOutput(/*info*/ undefined, CommandNames.ConfigurePlugin, request.seq, /*success*/ true);
            return this.notRequired();
        },
        [CommandNames.SelectionRange]: (request: ts.server.protocol.SelectionRangeRequest) => {
            return this.requiredResponse(this.getSmartSelectionRange(request.arguments, /*simplifiedResult*/ true));
        },
        [CommandNames.SelectionRangeFull]: (request: ts.server.protocol.SelectionRangeRequest) => {
            return this.requiredResponse(this.getSmartSelectionRange(request.arguments, /*simplifiedResult*/ false));
        },
    });
    public addProtocolHandler(command: string, handler: (request: ts.server.protocol.Request) => HandlerResponse) {
        if (this.handlers.has(command)) {
            throw new Error(`Protocol handler already exists for command "${command}"`);
        }
        this.handlers.set(command, handler);
    }
    private setCurrentRequest(requestId: number): void {
        ts.Debug.assert(this.currentRequestId === undefined);
        this.currentRequestId = requestId;
        this.cancellationToken.setRequest(requestId);
    }
    private resetCurrentRequest(requestId: number): void {
        ts.Debug.assert(this.currentRequestId === requestId);
        this.currentRequestId = undefined!; // TODO: GH#18217
        this.cancellationToken.resetRequest(requestId);
    }
    public executeWithRequestId<T>(requestId: number, f: () => T) {
        try {
            this.setCurrentRequest(requestId);
            return f();
        }
        finally {
            this.resetCurrentRequest(requestId);
        }
    }
    public executeCommand(request: ts.server.protocol.Request): HandlerResponse {
        const handler = this.handlers.get(request.command);
        if (handler) {
            return this.executeWithRequestId(request.seq, () => handler(request));
        }
        else {
            this.logger.msg(`Unrecognized JSON command:${ts.server.stringifyIndented(request)}`, ts.server.Msg.Err);
            this.doOutput(/*info*/ undefined, CommandNames.Unknown, request.seq, /*success*/ false, `Unrecognized JSON command: ${request.command}`);
            return { responseRequired: false };
        }
    }
    public onMessage(message: string) {
        this.gcTimer.scheduleCollect();
        let start: number[] | undefined;
        if (this.logger.hasLevel(ts.server.LogLevel.requestTime)) {
            start = this.hrtime();
            if (this.logger.hasLevel(ts.server.LogLevel.verbose)) {
                this.logger.info(`request:${ts.server.indent(message)}`);
            }
        }
        let request: ts.server.protocol.Request | undefined;
        let relevantFile: ts.server.protocol.FileRequestArgs | undefined;
        try {
            request = (<ts.server.protocol.Request>JSON.parse(message));
            relevantFile = request.arguments && (request as ts.server.protocol.FileRequest).arguments.file ? (request as ts.server.protocol.FileRequest).arguments : undefined;
            ts.perfLogger.logStartCommand("" + request.command, message.substring(0, 100));
            const { response, responseRequired } = this.executeCommand(request);
            if (this.logger.hasLevel(ts.server.LogLevel.requestTime)) {
                const elapsedTime = hrTimeToMilliseconds(this.hrtime(start)).toFixed(4);
                if (responseRequired) {
                    this.logger.perftrc(`${request.seq}::${request.command}: elapsed time (in milliseconds) ${elapsedTime}`);
                }
                else {
                    this.logger.perftrc(`${request.seq}::${request.command}: async elapsed time (in milliseconds) ${elapsedTime}`);
                }
            }
            // Note: Log before writing the response, else the editor can complete its activity before the server does
            ts.perfLogger.logStopCommand("" + request.command, "Success");
            if (response) {
                this.doOutput(response, request.command, request.seq, /*success*/ true);
            }
            else if (responseRequired) {
                this.doOutput(/*info*/ undefined, request.command, request.seq, /*success*/ false, "No content available.");
            }
        }
        catch (err) {
            if (err instanceof ts.OperationCanceledException) {
                // Handle cancellation exceptions
                ts.perfLogger.logStopCommand("" + (request && request.command), "Canceled: " + err);
                this.doOutput({ canceled: true }, request!.command, request!.seq, /*success*/ true);
                return;
            }
            this.logErrorWorker(err, message, relevantFile);
            ts.perfLogger.logStopCommand("" + (request && request.command), "Error: " + err);
            this.doOutput(
            /*info*/ undefined, request ? request.command : CommandNames.Unknown, request ? request.seq : 0, 
            /*success*/ false, "Error processing request. " + (<StackTraceError>err).message + "\n" + (<StackTraceError>err).stack);
        }
    }
    private getFormatOptions(file: ts.server.NormalizedPath): ts.FormatCodeSettings {
        return this.projectService.getFormatCodeOptions(file);
    }
    private getPreferences(file: ts.server.NormalizedPath): ts.server.protocol.UserPreferences {
        return this.projectService.getPreferences(file);
    }
    private getHostFormatOptions(): ts.FormatCodeSettings {
        return this.projectService.getHostFormatCodeOptions();
    }
    private getHostPreferences(): ts.server.protocol.UserPreferences {
        return this.projectService.getHostPreferences();
    }
}
interface FileAndProject {
    readonly file: ts.server.NormalizedPath;
    readonly project: ts.server.Project;
}
function toProcolTextSpan(textSpan: ts.TextSpan, scriptInfo: ts.server.ScriptInfo): ts.server.protocol.TextSpan {
    return {
        start: scriptInfo.positionToLineOffset(textSpan.start),
        end: scriptInfo.positionToLineOffset(ts.textSpanEnd(textSpan))
    };
}
function toProtocolTextSpanWithContext(span: ts.TextSpan, contextSpan: ts.TextSpan | undefined, scriptInfo: ts.server.ScriptInfo): ts.server.protocol.TextSpanWithContext {
    const textSpan = toProcolTextSpan(span, scriptInfo);
    const contextTextSpan = contextSpan && toProcolTextSpan(contextSpan, scriptInfo);
    return contextTextSpan ?
        { ...textSpan, contextStart: contextTextSpan.start, contextEnd: contextTextSpan.end } :
        textSpan;
}
function convertTextChangeToCodeEdit(change: ts.TextChange, scriptInfo: ts.server.ScriptInfoOrConfig): ts.server.protocol.CodeEdit {
    return { start: positionToLineOffset(scriptInfo, change.span.start), end: positionToLineOffset(scriptInfo, ts.textSpanEnd(change.span)), newText: change.newText };
}
function positionToLineOffset(info: ts.server.ScriptInfoOrConfig, position: number): ts.server.protocol.Location {
    return ts.server.isConfigFile(info) ? locationFromLineAndCharacter(info.getLineAndCharacterOfPosition(position)) : info.positionToLineOffset(position);
}
function locationFromLineAndCharacter(lc: ts.LineAndCharacter): ts.server.protocol.Location {
    return { line: lc.line + 1, offset: lc.character + 1 };
}
function convertNewFileTextChangeToCodeEdit(textChanges: ts.FileTextChanges): ts.server.protocol.FileCodeEdits {
    ts.Debug.assert(textChanges.textChanges.length === 1);
    const change = ts.first(textChanges.textChanges);
    ts.Debug.assert(change.span.start === 0 && change.span.length === 0);
    return { fileName: textChanges.fileName, textChanges: [{ start: { line: 0, offset: 0 }, end: { line: 0, offset: 0 }, newText: change.newText }] };
}
export interface HandlerResponse {
    response?: {};
    responseRequired?: boolean;
}
/* @internal */ // Exported only for tests
export function getLocationInNewDocument(oldText: string, renameFilename: string, renameLocation: number, edits: readonly ts.FileTextChanges[]): ts.server.protocol.Location {
    const newText = applyEdits(oldText, renameFilename, edits);
    const { line, character } = ts.computeLineAndCharacterOfPosition(ts.computeLineStarts(newText), renameLocation);
    return { line: line + 1, offset: character + 1 };
}
function applyEdits(text: string, textFilename: string, edits: readonly ts.FileTextChanges[]): string {
    for (const { fileName, textChanges } of edits) {
        if (fileName !== textFilename) {
            continue;
        }
        for (let i = textChanges.length - 1; i >= 0; i--) {
            const { newText, span: { start, length } } = textChanges[i];
            text = text.slice(0, start) + newText + text.slice(start + length);
        }
    }
    return text;
}
