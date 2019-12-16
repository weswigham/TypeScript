import * as ts from "../../ts";
import * as Utils from "../../Utils";
export import TI = ts.server.typingsInstaller;
export import protocol = ts.server.protocol;
export import CommandNames = ts.server.CommandNames;
export import TestServerHost = ts.TestFSWithWatch.TestServerHost;
export type File = ts.TestFSWithWatch.File;
export type SymLink = ts.TestFSWithWatch.SymLink;
export type Folder = ts.TestFSWithWatch.Folder;
export import createServerHost = ts.TestFSWithWatch.createServerHost;
export import checkArray = ts.TestFSWithWatch.checkArray;
export import libFile = ts.TestFSWithWatch.libFile;
export import checkWatchedFiles = ts.TestFSWithWatch.checkWatchedFiles;
export import checkWatchedFilesDetailed = ts.TestFSWithWatch.checkWatchedFilesDetailed;
export import checkWatchedDirectories = ts.TestFSWithWatch.checkWatchedDirectories;
export import checkWatchedDirectoriesDetailed = ts.TestFSWithWatch.checkWatchedDirectoriesDetailed;
export import commonFile1 = ts.tscWatch.commonFile1;
export import commonFile2 = ts.tscWatch.commonFile2;
const outputEventRegex = /Content\-Length: [\d]+\r\n\r\n/;
export function mapOutputToJson(s: string) {
    return ts.convertToObject(ts.parseJsonText("json.json", s.replace(outputEventRegex, "")), []);
}
export const customTypesMap = {
    path: (<ts.Path>"/typesMap.json"),
    content: `{
            "typesMap": {
                "jquery": {
                    "match": "jquery(-(\\\\.?\\\\d+)+)?(\\\\.intellisense)?(\\\\.min)?\\\\.js$",
                    "types": ["jquery"]
                },
                "quack": {
                    "match": "/duckquack-(\\\\d+)\\\\.min\\\\.js",
                    "types": ["duck-types"]
                }
            },
            "simpleMap": {
                "Bacon": "baconjs",
                "bliss": "blissfuljs",
                "commander": "commander",
                "cordova": "cordova",
                "react": "react",
                "lodash": "lodash"
            }
        }`
};
export interface PostExecAction {
    readonly success: boolean;
    readonly callback: TI.RequestCompletedAction;
}
export const nullLogger: ts.server.Logger = {
    close: ts.noop,
    hasLevel: ts.returnFalse,
    loggingEnabled: ts.returnFalse,
    perftrc: ts.noop,
    info: ts.noop,
    msg: ts.noop,
    startGroup: ts.noop,
    endGroup: ts.noop,
    getLogFileName: ts.returnUndefined,
};
export function createHasErrorMessageLogger() {
    let hasErrorMsg = false;
    const { close, hasLevel, loggingEnabled, startGroup, endGroup, info, getLogFileName, perftrc } = nullLogger;
    const logger: ts.server.Logger = {
        close, hasLevel, loggingEnabled, startGroup, endGroup, info, getLogFileName, perftrc,
        msg: (s, type) => {
            ts.Debug.fail(`Error: ${s}, type: ${type}`);
            hasErrorMsg = true;
        }
    };
    return { logger, hasErrorMsg: () => hasErrorMsg };
}
export function createLoggerWritingToConsole(): ts.server.Logger {
    const { close, startGroup, endGroup, getLogFileName } = nullLogger;
    return {
        close,
        hasLevel: ts.returnTrue,
        loggingEnabled: ts.returnTrue,
        perftrc: s => console.log(s),
        info: s => console.log(s),
        msg: (s, type) => console.log(`${type}:: ${s}`),
        startGroup,
        endGroup,
        getLogFileName
    };
}
export class TestTypingsInstaller extends TI.TypingsInstaller implements ts.server.ITypingsInstaller {
    protected projectService!: ts.server.ProjectService;
    constructor(readonly globalTypingsCacheLocation: string, throttleLimit: number, installTypingHost: ts.server.ServerHost, readonly typesRegistry = ts.createMap<ts.MapLike<string>>(), log?: TI.Log) {
        super(installTypingHost, globalTypingsCacheLocation, ts.TestFSWithWatch.safeList.path, customTypesMap.path, throttleLimit, log);
    }
    protected postExecActions: PostExecAction[] = [];
    isKnownTypesPackageName = ts.notImplemented;
    installPackage = ts.notImplemented;
    inspectValue = ts.notImplemented;
    executePendingCommands() {
        const actionsToRun = this.postExecActions;
        this.postExecActions = [];
        for (const action of actionsToRun) {
            action.callback(action.success);
        }
    }
    checkPendingCommands(expectedCount: number) {
        assert.equal(this.postExecActions.length, expectedCount, `Expected ${expectedCount} post install actions`);
    }
    onProjectClosed = ts.noop;
    attach(projectService: ts.server.ProjectService) {
        this.projectService = projectService;
    }
    getInstallTypingHost() {
        return this.installTypingHost;
    }
    installWorker(_requestId: number, _args: string[], _cwd: string, cb: TI.RequestCompletedAction): void {
        this.addPostExecAction("success", cb);
    }
    sendResponse(response: ts.server.SetTypings | ts.server.InvalidateCachedTypings) {
        this.projectService.updateTypingsForProject(response);
    }
    enqueueInstallTypingsRequest(project: ts.server.Project, typeAcquisition: ts.TypeAcquisition, unresolvedImports: ts.SortedReadonlyArray<string>) {
        const request = ts.server.createInstallTypingsRequest(project, typeAcquisition, unresolvedImports, this.globalTypingsCacheLocation);
        this.install(request);
    }
    addPostExecAction(stdout: string | string[], cb: TI.RequestCompletedAction) {
        const out = ts.isString(stdout) ? stdout : createNpmPackageJsonString(stdout);
        const action: PostExecAction = {
            success: !!out,
            callback: cb
        };
        this.postExecActions.push(action);
    }
}
function createNpmPackageJsonString(installedTypings: string[]): string {
    const dependencies: ts.MapLike<any> = {};
    for (const typing of installedTypings) {
        dependencies[typing] = "1.0.0";
    }
    return JSON.stringify({ dependencies });
}
export function createTypesRegistry(...list: string[]): ts.Map<ts.MapLike<string>> {
    const versionMap = {
        "latest": "1.3.0",
        "ts2.0": "1.0.0",
        "ts2.1": "1.0.0",
        "ts2.2": "1.2.0",
        "ts2.3": "1.3.0",
        "ts2.4": "1.3.0",
        "ts2.5": "1.3.0",
        "ts2.6": "1.3.0",
        "ts2.7": "1.3.0"
    };
    const map = ts.createMap<ts.MapLike<string>>();
    for (const l of list) {
        map.set(l, versionMap);
    }
    return map;
}
export function toExternalFile(fileName: string): protocol.ExternalFile {
    return { fileName };
}
export function toExternalFiles(fileNames: string[]) {
    return ts.map(fileNames, toExternalFile);
}
export function fileStats(nonZeroStats: Partial<ts.server.FileStats>): ts.server.FileStats {
    return { ts: 0, tsSize: 0, tsx: 0, tsxSize: 0, dts: 0, dtsSize: 0, js: 0, jsSize: 0, jsx: 0, jsxSize: 0, deferred: 0, deferredSize: 0, ...nonZeroStats };
}
export interface ConfigFileDiagnostic {
    fileName: string | undefined;
    start: number | undefined;
    length: number | undefined;
    messageText: string;
    category: ts.DiagnosticCategory;
    code: number;
    reportsUnnecessary?: {};
    source?: string;
    relatedInformation?: ts.DiagnosticRelatedInformation[];
}
export class TestServerEventManager {
    private events: ts.server.ProjectServiceEvent[] = [];
    readonly session: TestSession;
    readonly service: ts.server.ProjectService;
    readonly host: TestServerHost;
    constructor(files: File[], suppressDiagnosticEvents?: boolean) {
        this.host = createServerHost(files);
        this.session = createSession(this.host, {
            canUseEvents: true,
            eventHandler: event => this.events.push(event),
            suppressDiagnosticEvents,
        });
        this.service = this.session.getProjectService();
    }
    getEvents(): readonly ts.server.ProjectServiceEvent[] {
        const events = this.events;
        this.events = [];
        return events;
    }
    getEvent<T extends ts.server.ProjectServiceEvent>(eventName: T["eventName"]): T["data"] {
        let eventData: T["data"] | undefined;
        ts.filterMutate(this.events, e => {
            if (e.eventName === eventName) {
                if (eventData !== undefined) {
                    assert(false, "more than one event found");
                }
                eventData = e.data;
                return false;
            }
            return true;
        });
        return ts.Debug.assertDefined(eventData);
    }
    hasZeroEvent<T extends ts.server.ProjectServiceEvent>(eventName: T["eventName"]) {
        this.events.forEach(event => assert.notEqual(event.eventName, eventName));
    }
    checkSingleConfigFileDiagEvent(configFileName: string, triggerFile: string, errors: readonly ConfigFileDiagnostic[]) {
        const eventData = this.getEvent<ts.server.ConfigFileDiagEvent>(ts.server.ConfigFileDiagEvent);
        assert.equal(eventData.configFileName, configFileName);
        assert.equal(eventData.triggerFile, triggerFile);
        const actual = eventData.diagnostics.map(({ file, messageText, ...rest }) => ({ fileName: file && file.fileName, messageText: ts.isString(messageText) ? messageText : "", ...rest }));
        if (errors) {
            assert.deepEqual(actual, errors);
        }
    }
    assertProjectInfoTelemetryEvent(partial: Partial<ts.server.ProjectInfoTelemetryEventData>, configFile = "/tsconfig.json"): void {
        assert.deepEqual<ts.server.ProjectInfoTelemetryEventData>(this.getEvent<ts.server.ProjectInfoTelemetryEvent>(ts.server.ProjectInfoTelemetryEvent), {
            projectId: ts.sys.createSHA256Hash!(configFile),
            fileStats: fileStats({ ts: 1 }),
            compilerOptions: {},
            extends: false,
            files: false,
            include: false,
            exclude: false,
            compileOnSave: false,
            typeAcquisition: {
                enable: false,
                exclude: false,
                include: false,
            },
            configFileName: "tsconfig.json",
            projectType: "configured",
            languageServiceEnabled: true,
            version: ts.version,
            ...partial,
        });
    }
    assertOpenFileTelemetryEvent(info: ts.server.OpenFileInfo): void {
        assert.deepEqual<ts.server.OpenFileInfoTelemetryEventData>(this.getEvent<ts.server.OpenFileInfoTelemetryEvent>(ts.server.OpenFileInfoTelemetryEvent), { info });
    }
    assertNoOpenFilesTelemetryEvent(): void {
        this.hasZeroEvent<ts.server.OpenFileInfoTelemetryEvent>(ts.server.OpenFileInfoTelemetryEvent);
    }
}
export class TestSession extends ts.server.Session {
    private seq = 0;
    public events: protocol.Event[] = [];
    public testhost: TestServerHost = this.host as TestServerHost;
    getProjectService() {
        return this.projectService;
    }
    public getSeq() {
        return this.seq;
    }
    public getNextSeq() {
        return this.seq + 1;
    }
    public executeCommandSeq<T extends ts.server.protocol.Request>(request: Partial<T>) {
        this.seq++;
        request.seq = this.seq;
        request.type = "request";
        return this.executeCommand(<T>request);
    }
    public event<T extends object>(body: T, eventName: string) {
        this.events.push(ts.server.toEvent(eventName, body));
        super.event(body, eventName);
    }
    public clearMessages() {
        ts.clear(this.events);
        this.testhost.clearOutput();
    }
}
export function createSession(host: ts.server.ServerHost, opts: Partial<ts.server.SessionOptions> = {}) {
    if (opts.typingsInstaller === undefined) {
        opts.typingsInstaller = new TestTypingsInstaller("/a/data/", /*throttleLimit*/ 5, host);
    }
    if (opts.eventHandler !== undefined) {
        opts.canUseEvents = true;
    }
    const sessionOptions: ts.server.SessionOptions = {
        host,
        cancellationToken: ts.server.nullCancellationToken,
        useSingleInferredProject: false,
        useInferredProjectPerProjectRoot: false,
        typingsInstaller: undefined!,
        byteLength: Utils.byteLength,
        hrtime: process.hrtime,
        logger: opts.logger || createHasErrorMessageLogger().logger,
        canUseEvents: false
    };
    return new TestSession({ ...sessionOptions, ...opts });
}
export function createSessionWithEventTracking<T extends ts.server.ProjectServiceEvent>(host: ts.server.ServerHost, eventName: T["eventName"], ...eventNames: T["eventName"][]) {
    const events: T[] = [];
    const session = createSession(host, {
        eventHandler: e => {
            if (e.eventName === eventName || eventNames.some(eventName => e.eventName === eventName)) {
                events.push(e as T);
            }
        }
    });
    return { session, events };
}
export function createSessionWithDefaultEventHandler<T extends protocol.AnyEvent>(host: TestServerHost, eventNames: T["event"] | T["event"][], opts: Partial<ts.server.SessionOptions> = {}) {
    const session = createSession(host, { canUseEvents: true, ...opts });
    return {
        session,
        getEvents,
        clearEvents
    };
    function getEvents() {
        return ts.mapDefined(host.getOutput(), s => {
            const e = mapOutputToJson(s);
            return (ts.isArray(eventNames) ? eventNames.some(eventName => e.event === eventName) : e.event === eventNames) ? e as T : undefined;
        });
    }
    function clearEvents() {
        session.clearMessages();
    }
}
export interface CreateProjectServiceParameters {
    cancellationToken?: ts.HostCancellationToken;
    logger?: ts.server.Logger;
    useSingleInferredProject?: boolean;
    typingsInstaller?: ts.server.ITypingsInstaller;
    eventHandler?: ts.server.ProjectServiceEventHandler;
}
export class TestProjectService extends ts.server.ProjectService {
    constructor(host: ts.server.ServerHost, logger: ts.server.Logger, cancellationToken: ts.HostCancellationToken, useSingleInferredProject: boolean, typingsInstaller: ts.server.ITypingsInstaller, eventHandler: ts.server.ProjectServiceEventHandler, opts: Partial<ts.server.ProjectServiceOptions> = {}) {
        super({
            host,
            logger,
            cancellationToken,
            useSingleInferredProject,
            useInferredProjectPerProjectRoot: false,
            typingsInstaller,
            typesMapLocation: customTypesMap.path,
            eventHandler,
            ...opts
        });
    }
    checkNumberOfProjects(count: {
        inferredProjects?: number;
        configuredProjects?: number;
        externalProjects?: number;
    }) {
        checkNumberOfProjects(this, count);
    }
}
export function createProjectService(host: ts.server.ServerHost, parameters: CreateProjectServiceParameters = {}, options?: Partial<ts.server.ProjectServiceOptions>) {
    const cancellationToken = parameters.cancellationToken || ts.server.nullCancellationToken;
    const logger = parameters.logger || createHasErrorMessageLogger().logger;
    const useSingleInferredProject = parameters.useSingleInferredProject !== undefined ? parameters.useSingleInferredProject : false;
    return new TestProjectService(host, logger, cancellationToken, useSingleInferredProject, parameters.typingsInstaller!, parameters.eventHandler!, options); // TODO: GH#18217
}
export function checkNumberOfConfiguredProjects(projectService: ts.server.ProjectService, expected: number) {
    assert.equal(projectService.configuredProjects.size, expected, `expected ${expected} configured project(s)`);
}
export function checkNumberOfExternalProjects(projectService: ts.server.ProjectService, expected: number) {
    assert.equal(projectService.externalProjects.length, expected, `expected ${expected} external project(s)`);
}
export function checkNumberOfInferredProjects(projectService: ts.server.ProjectService, expected: number) {
    assert.equal(projectService.inferredProjects.length, expected, `expected ${expected} inferred project(s)`);
}
export function checkNumberOfProjects(projectService: ts.server.ProjectService, count: {
    inferredProjects?: number;
    configuredProjects?: number;
    externalProjects?: number;
}) {
    checkNumberOfConfiguredProjects(projectService, count.configuredProjects || 0);
    checkNumberOfExternalProjects(projectService, count.externalProjects || 0);
    checkNumberOfInferredProjects(projectService, count.inferredProjects || 0);
}
export function configuredProjectAt(projectService: ts.server.ProjectService, index: number) {
    const values = projectService.configuredProjects.values();
    while (index > 0) {
        const iterResult = values.next();
        if (iterResult.done)
            return ts.Debug.fail("Expected a result.");
        index--;
    }
    const iterResult = values.next();
    if (iterResult.done)
        return ts.Debug.fail("Expected a result.");
    return iterResult.value;
}
export function checkProjectActualFiles(project: ts.server.Project, expectedFiles: readonly string[]) {
    checkArray(`${ts.server.ProjectKind[project.projectKind]} project, actual files`, project.getFileNames(), expectedFiles);
}
export function checkProjectRootFiles(project: ts.server.Project, expectedFiles: readonly string[]) {
    checkArray(`${ts.server.ProjectKind[project.projectKind]} project, rootFileNames`, project.getRootFiles(), expectedFiles);
}
export function mapCombinedPathsInAncestor(dir: string, path2: string, mapAncestor: (ancestor: string) => boolean) {
    dir = ts.normalizePath(dir);
    const result: string[] = [];
    ts.forEachAncestorDirectory(dir, ancestor => {
        if (mapAncestor(ancestor)) {
            result.push(ts.combinePaths(ancestor, path2));
        }
    });
    return result;
}
export function getRootsToWatchWithAncestorDirectory(dir: string, path2: string) {
    return mapCombinedPathsInAncestor(dir, path2, ancestor => ancestor.split(ts.directorySeparator).length > 4);
}
export const nodeModules = "node_modules";
export function getNodeModuleDirectories(dir: string) {
    return getRootsToWatchWithAncestorDirectory(dir, nodeModules);
}
export const nodeModulesAtTypes = "node_modules/@types";
export function getTypeRootsFromLocation(currentDirectory: string) {
    return getRootsToWatchWithAncestorDirectory(currentDirectory, nodeModulesAtTypes);
}
export function getConfigFilesToWatch(folder: string) {
    return [
        ...getRootsToWatchWithAncestorDirectory(folder, "tsconfig.json"),
        ...getRootsToWatchWithAncestorDirectory(folder, "jsconfig.json")
    ];
}
export function checkOpenFiles(projectService: ts.server.ProjectService, expectedFiles: File[]) {
    checkArray("Open files", ts.arrayFrom(projectService.openFiles.keys(), path => projectService.getScriptInfoForPath((path as ts.Path))!.fileName), expectedFiles.map(file => file.path));
}
export function checkScriptInfos(projectService: ts.server.ProjectService, expectedFiles: readonly string[], additionInfo?: string) {
    checkArray(`ScriptInfos files: ${additionInfo || ""}`, ts.arrayFrom(projectService.filenameToScriptInfo.values(), info => info.fileName), expectedFiles);
}
export function protocolLocationFromSubstring(str: string, substring: string, options?: SpanFromSubstringOptions): protocol.Location {
    const start = nthIndexOf(str, substring, options ? options.index : 0);
    ts.Debug.assert(start !== -1);
    return protocolToLocation(str)(start);
}
export function protocolToLocation(text: string): (pos: number) => protocol.Location {
    const lineStarts = ts.computeLineStarts(text);
    return pos => {
        const x = ts.computeLineAndCharacterOfPosition(lineStarts, pos);
        return { line: x.line + 1, offset: x.character + 1 };
    };
}
export function protocolTextSpanFromSubstring(str: string, substring: string, options?: SpanFromSubstringOptions): protocol.TextSpan {
    const span = textSpanFromSubstring(str, substring, options);
    const toLocation = protocolToLocation(str);
    return { start: toLocation(span.start), end: toLocation(ts.textSpanEnd(span)) };
}
export interface DocumentSpanFromSubstring {
    file: File;
    text: string;
    options?: SpanFromSubstringOptions;
    contextText?: string;
    contextOptions?: SpanFromSubstringOptions;
}
export function protocolFileSpanFromSubstring({ file, text, options }: DocumentSpanFromSubstring): protocol.FileSpan {
    return { file: file.path, ...protocolTextSpanFromSubstring(file.content, text, options) };
}
interface FileSpanWithContextFromSubString {
    file: File;
    text: string;
    options?: SpanFromSubstringOptions;
    contextText?: string;
    contextOptions?: SpanFromSubstringOptions;
}
export function protocolFileSpanWithContextFromSubstring({ contextText, contextOptions, ...rest }: FileSpanWithContextFromSubString): protocol.FileSpanWithContext {
    const result = protocolFileSpanFromSubstring(rest);
    const contextSpan = contextText !== undefined ?
        protocolFileSpanFromSubstring({ file: rest.file, text: contextText, options: contextOptions }) :
        undefined;
    return contextSpan ?
        {
            ...result,
            contextStart: contextSpan.start,
            contextEnd: contextSpan.end
        } :
        result;
}
export interface ProtocolTextSpanWithContextFromString {
    fileText: string;
    text: string;
    options?: SpanFromSubstringOptions;
    contextText?: string;
    contextOptions?: SpanFromSubstringOptions;
}
export function protocolTextSpanWithContextFromSubstring({ fileText, text, options, contextText, contextOptions }: ProtocolTextSpanWithContextFromString): protocol.TextSpanWithContext {
    const span = textSpanFromSubstring(fileText, text, options);
    const toLocation = protocolToLocation(fileText);
    const contextSpan = contextText !== undefined ? textSpanFromSubstring(fileText, contextText, contextOptions) : undefined;
    return {
        start: toLocation(span.start),
        end: toLocation(ts.textSpanEnd(span)),
        ...contextSpan && {
            contextStart: toLocation(contextSpan.start),
            contextEnd: toLocation(ts.textSpanEnd(contextSpan))
        }
    };
}
export interface ProtocolRenameSpanFromSubstring extends ProtocolTextSpanWithContextFromString {
    prefixSuffixText?: {
        readonly prefixText?: string;
        readonly suffixText?: string;
    };
}
export function protocolRenameSpanFromSubstring({ prefixSuffixText, ...rest }: ProtocolRenameSpanFromSubstring): protocol.RenameTextSpan {
    return {
        ...protocolTextSpanWithContextFromSubstring(rest),
        ...prefixSuffixText
    };
}
export function textSpanFromSubstring(str: string, substring: string, options?: SpanFromSubstringOptions): ts.TextSpan {
    const start = nthIndexOf(str, substring, options ? options.index : 0);
    ts.Debug.assert(start !== -1);
    return ts.createTextSpan(start, substring.length);
}
export function protocolFileLocationFromSubstring(file: File, substring: string, options?: SpanFromSubstringOptions): protocol.FileLocationRequestArgs {
    return { file: file.path, ...protocolLocationFromSubstring(file.content, substring, options) };
}
export interface SpanFromSubstringOptions {
    readonly index: number;
}
function nthIndexOf(str: string, substr: string, n: number): number {
    let index = -1;
    for (; n >= 0; n--) {
        index = str.indexOf(substr, index + 1);
        if (index === -1)
            return -1;
    }
    return index;
}
/**
 * Test server cancellation token used to mock host token cancellation requests.
 * The cancelAfterRequest constructor param specifies how many isCancellationRequested() calls
 * should be made before canceling the token. The id of the request to cancel should be set with
 * setRequestToCancel();
 */
export class TestServerCancellationToken implements ts.server.ServerCancellationToken {
    private currentId: number | undefined = -1;
    private requestToCancel = -1;
    private isCancellationRequestedCount = 0;
    constructor(private cancelAfterRequest = 0) {
    }
    setRequest(requestId: number) {
        this.currentId = requestId;
    }
    setRequestToCancel(requestId: number) {
        this.resetToken();
        this.requestToCancel = requestId;
    }
    resetRequest(requestId: number) {
        assert.equal(requestId, this.currentId, "unexpected request id in cancellation");
        this.currentId = undefined;
    }
    isCancellationRequested() {
        this.isCancellationRequestedCount++;
        // If the request id is the request to cancel and isCancellationRequestedCount
        // has been met then cancel the request. Ex: cancel the request if it is a
        // nav bar request & isCancellationRequested() has already been called three times.
        return this.requestToCancel === this.currentId && this.isCancellationRequestedCount >= this.cancelAfterRequest;
    }
    resetToken() {
        this.currentId = -1;
        this.isCancellationRequestedCount = 0;
        this.requestToCancel = -1;
    }
}
export function makeSessionRequest<T>(command: string, args: T): protocol.Request {
    return {
        seq: 0,
        type: "request",
        command,
        arguments: args
    };
}
export function executeSessionRequest<TRequest extends protocol.Request, TResponse extends protocol.Response>(session: ts.server.Session, command: TRequest["command"], args: TRequest["arguments"]): TResponse["body"] {
    return session.executeCommand(makeSessionRequest(command, args)).response as TResponse["body"];
}
export function executeSessionRequestNoResponse<TRequest extends protocol.Request>(session: ts.server.Session, command: TRequest["command"], args: TRequest["arguments"]): void {
    session.executeCommand(makeSessionRequest(command, args));
}
export function openFilesForSession(files: readonly (File | {
    readonly file: File | string;
    readonly projectRootPath: string;
    content?: string;
})[], session: ts.server.Session): void {
    for (const file of files) {
        session.executeCommand(makeSessionRequest<protocol.OpenRequestArgs>(CommandNames.Open, "projectRootPath" in file ? { file: typeof file.file === "string" ? file.file : file.file.path, projectRootPath: file.projectRootPath } : { file: file.path })); // eslint-disable-line no-in-operator
    }
}
export function closeFilesForSession(files: readonly File[], session: ts.server.Session): void {
    for (const file of files) {
        session.executeCommand(makeSessionRequest<protocol.FileRequestArgs>(CommandNames.Close, { file: file.path }));
    }
}
export interface ErrorInformation {
    diagnosticMessage: ts.DiagnosticMessage;
    errorTextArguments?: string[];
}
function getProtocolDiagnosticMessage({ diagnosticMessage, errorTextArguments = [] }: ErrorInformation) {
    return ts.formatStringFromArgs(diagnosticMessage.message, errorTextArguments);
}
export function verifyDiagnostics(actual: readonly ts.server.protocol.Diagnostic[], expected: readonly ErrorInformation[]) {
    const expectedErrors = expected.map(getProtocolDiagnosticMessage);
    assert.deepEqual(actual.map(diag => ts.flattenDiagnosticMessageText(diag.text, "\n")), expectedErrors);
}
export function verifyNoDiagnostics(actual: ts.server.protocol.Diagnostic[]) {
    verifyDiagnostics(actual, []);
}
export function checkErrorMessage(session: TestSession, eventName: protocol.DiagnosticEventKind, diagnostics: protocol.DiagnosticEventBody, isMostRecent = false): void {
    checkNthEvent(session, ts.server.toEvent(eventName, diagnostics), 0, isMostRecent);
}
export function createDiagnostic(start: protocol.Location, end: protocol.Location, message: ts.DiagnosticMessage, args: readonly string[] = [], category = ts.diagnosticCategoryName(message), reportsUnnecessary?: {}, relatedInformation?: protocol.DiagnosticRelatedInformation[]): protocol.Diagnostic {
    return { start, end, text: ts.formatStringFromArgs(message.message, args), code: message.code, category, reportsUnnecessary, relatedInformation, source: undefined };
}
export function checkCompleteEvent(session: TestSession, numberOfCurrentEvents: number, expectedSequenceId: number, isMostRecent = true): void {
    checkNthEvent(session, ts.server.toEvent("requestCompleted", { request_seq: expectedSequenceId }), numberOfCurrentEvents - 1, isMostRecent);
}
export function checkProjectUpdatedInBackgroundEvent(session: TestSession, openFiles: string[]) {
    checkNthEvent(session, ts.server.toEvent("projectsUpdatedInBackground", { openFiles }), 0, /*isMostRecent*/ true);
}
export function checkNoDiagnosticEvents(session: TestSession) {
    for (const event of session.events) {
        assert.isFalse(event.event.endsWith("Diag"), JSON.stringify(event));
    }
}
export function checkNthEvent(session: TestSession, expectedEvent: protocol.Event, index: number, isMostRecent: boolean) {
    const events = session.events;
    assert.deepEqual(events[index], expectedEvent, `Expected ${JSON.stringify(expectedEvent)} at ${index} in ${JSON.stringify(events)}`);
    const outputs = session.testhost.getOutput();
    assert.equal(outputs[index], ts.server.formatMessage(expectedEvent, nullLogger, Utils.byteLength, session.testhost.newLine));
    if (isMostRecent) {
        assert.strictEqual(events.length, index + 1, JSON.stringify(events));
        assert.strictEqual(outputs.length, index + 1, JSON.stringify(outputs));
    }
}
export interface MakeReferenceItem extends DocumentSpanFromSubstring {
    isDefinition: boolean;
    isWriteAccess?: boolean;
    lineText: string;
}
export function makeReferenceItem({ isDefinition, isWriteAccess, lineText, ...rest }: MakeReferenceItem): protocol.ReferencesResponseItem {
    return {
        ...protocolFileSpanWithContextFromSubstring(rest),
        isDefinition,
        isWriteAccess: isWriteAccess === undefined ? isDefinition : isWriteAccess,
        lineText,
    };
}
