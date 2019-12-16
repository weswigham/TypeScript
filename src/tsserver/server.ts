namespace ts.server {
    const childProcess: {
        fork(modulePath: string, args: string[], options?: {
            execArgv: string[];
            env?: ts.MapLike<string>;
        }): NodeChildProcess;
        execFileSync(file: string, args: string[], options: {
            stdio: "ignore";
            env: ts.MapLike<string>;
        }): string | Buffer;
    } = require("child_process");
    const os: {
        homedir?(): string;
        tmpdir(): string;
        platform(): string;
    } = require("os");
    interface NodeSocket {
        write(data: string, encoding: string): boolean;
    }
    const net: {
        connect(options: {
            port: number;
        }, onConnect?: () => void): NodeSocket;
    } = require("net");
    function getGlobalTypingsCacheLocation() {
        switch (process.platform) {
            case "win32": {
                const basePath = process.env.LOCALAPPDATA ||
                    process.env.APPDATA ||
                    (os.homedir && os.homedir()) ||
                    process.env.USERPROFILE ||
                    (process.env.HOMEDRIVE && process.env.HOMEPATH && ts.normalizeSlashes(process.env.HOMEDRIVE + process.env.HOMEPATH)) ||
                    os.tmpdir();
                return ts.combinePaths(ts.combinePaths(ts.normalizeSlashes(basePath), "Microsoft/TypeScript"), ts.versionMajorMinor);
            }
            case "openbsd":
            case "freebsd":
            case "darwin":
            case "linux":
            case "android": {
                const cacheLocation = getNonWindowsCacheLocation(process.platform === "darwin");
                return ts.combinePaths(ts.combinePaths(cacheLocation, "typescript"), ts.versionMajorMinor);
            }
            default:
                return ts.Debug.fail(`unsupported platform '${process.platform}'`);
        }
    }
    function getNonWindowsCacheLocation(platformIsDarwin: boolean) {
        if (process.env.XDG_CACHE_HOME) {
            return process.env.XDG_CACHE_HOME;
        }
        const usersDir = platformIsDarwin ? "Users" : "home";
        const homePath = (os.homedir && os.homedir()) ||
            process.env.HOME ||
            ((process.env.LOGNAME || process.env.USER) && `/${usersDir}/${process.env.LOGNAME || process.env.USER}`) ||
            os.tmpdir();
        const cacheFolder = platformIsDarwin
            ? "Library/Caches"
            : ".cache";
        return ts.combinePaths(ts.normalizeSlashes(homePath), cacheFolder);
    }
    interface NodeChildProcess {
        send(message: any, sendHandle?: any): void;
        on(message: "message" | "exit", f: (m: any) => void): void;
        kill(): void;
        pid: number;
    }
    interface ReadLineOptions {
        input: NodeJS.ReadableStream;
        output?: NodeJS.WritableStream;
        terminal?: boolean;
        historySize?: number;
    }
    interface Stats {
        isFile(): boolean;
        isDirectory(): boolean;
        isBlockDevice(): boolean;
        isCharacterDevice(): boolean;
        isSymbolicLink(): boolean;
        isFIFO(): boolean;
        isSocket(): boolean;
        dev: number;
        ino: number;
        mode: number;
        nlink: number;
        uid: number;
        gid: number;
        rdev: number;
        size: number;
        blksize: number;
        blocks: number;
        atime: Date;
        mtime: Date;
        ctime: Date;
        birthtime: Date;
    }
    const readline: {
        createInterface(options: ReadLineOptions): NodeJS.EventEmitter;
    } = require("readline");
    const fs: {
        openSync(path: string, options: string): number;
        close(fd: number, callback: (err: NodeJS.ErrnoException) => void): void;
        writeSync(fd: number, buffer: Buffer, offset: number, length: number, position?: number): number;
        writeSync(fd: number, data: any, position?: number, enconding?: string): number;
        statSync(path: string): Stats;
        stat(path: string, callback?: (err: NodeJS.ErrnoException, stats: Stats) => any): void;
    } = require("fs");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
    });
    class Logger implements ts.server.Logger {
        private fd = -1;
        private seq = 0;
        private inGroup = false;
        private firstInGroup = true;
        constructor(private readonly logFilename: string, private readonly traceToConsole: boolean, private readonly level: ts.server.LogLevel) {
            if (this.logFilename) {
                try {
                    this.fd = fs.openSync(this.logFilename, "w");
                }
                catch (_) {
                    // swallow the error and keep logging disabled if file cannot be opened
                }
            }
        }
        static padStringRight(str: string, padding: string) {
            return (str + padding).slice(0, padding.length);
        }
        close() {
            if (this.fd >= 0) {
                fs.close(this.fd, ts.noop);
            }
        }
        getLogFileName() {
            return this.logFilename;
        }
        perftrc(s: string) {
            this.msg(s, ts.server.Msg.Perf);
        }
        info(s: string) {
            this.msg(s, ts.server.Msg.Info);
        }
        err(s: string) {
            this.msg(s, ts.server.Msg.Err);
        }
        startGroup() {
            this.inGroup = true;
            this.firstInGroup = true;
        }
        endGroup() {
            this.inGroup = false;
        }
        loggingEnabled() {
            return !!this.logFilename || this.traceToConsole;
        }
        hasLevel(level: ts.server.LogLevel) {
            return this.loggingEnabled() && this.level >= level;
        }
        msg(s: string, type: ts.server.Msg = ts.server.Msg.Err) {
            switch (type) {
                case ts.server.Msg.Info:
                    ts.perfLogger.logInfoEvent(s);
                    break;
                case ts.server.Msg.Perf:
                    ts.perfLogger.logPerfEvent(s);
                    break;
                default: // Msg.Err
                    ts.perfLogger.logErrEvent(s);
                    break;
            }
            if (!this.canWrite)
                return;
            s = `[${ts.server.nowString()}] ${s}\n`;
            if (!this.inGroup || this.firstInGroup) {
                const prefix = Logger.padStringRight(type + " " + this.seq.toString(), "          ");
                s = prefix + s;
            }
            this.write(s);
            if (!this.inGroup) {
                this.seq++;
            }
        }
        private get canWrite() {
            return this.fd >= 0 || this.traceToConsole;
        }
        private write(s: string) {
            if (this.fd >= 0) {
                const buf = sys.bufferFrom!(s);
                // eslint-disable-next-line no-null/no-null
                fs.writeSync(this.fd, buf, 0, buf.length, /*position*/ null!); // TODO: GH#18217
            }
            if (this.traceToConsole) {
                console.warn(s);
            }
        }
    }
    interface QueuedOperation {
        operationId: string;
        operation: () => void;
    }
    class NodeTypingsInstaller implements ts.server.ITypingsInstaller {
        private installer!: NodeChildProcess;
        private projectService!: ts.server.ProjectService;
        private activeRequestCount = 0;
        private requestQueue: QueuedOperation[] = [];
        private requestMap = ts.createMap<QueuedOperation>(); // Maps operation ID to newest requestQueue entry with that ID
        /** We will lazily request the types registry on the first call to `isKnownTypesPackageName` and store it in `typesRegistryCache`. */
        private requestedRegistry = false;
        private typesRegistryCache: ts.Map<ts.MapLike<string>> | undefined;
        // This number is essentially arbitrary.  Processing more than one typings request
        // at a time makes sense, but having too many in the pipe results in a hang
        // (see https://github.com/nodejs/node/issues/7657).
        // It would be preferable to base our limit on the amount of space left in the
        // buffer, but we have yet to find a way to retrieve that value.
        private static readonly maxActiveRequestCount = 10;
        private static readonly requestDelayMillis = 100;
        private packageInstalledPromise: {
            resolve(value: ts.ApplyCodeActionCommandResult): void;
            reject(reason: unknown): void;
        } | undefined;
        constructor(private readonly telemetryEnabled: boolean, private readonly logger: Logger, private readonly host: ts.server.ServerHost, readonly globalTypingsCacheLocation: string, readonly typingSafeListLocation: string, readonly typesMapLocation: string, private readonly npmLocation: string | undefined, private readonly validateDefaultNpmLocation: boolean, private event: ts.server.Event) {
        }
        isKnownTypesPackageName(name: string): boolean {
            // We want to avoid looking this up in the registry as that is expensive. So first check that it's actually an NPM package.
            const validationResult = ts.JsTyping.validatePackageName(name);
            if (validationResult !== ts.JsTyping.NameValidationResult.Ok) {
                return false;
            }
            if (this.requestedRegistry) {
                return !!this.typesRegistryCache && this.typesRegistryCache.has(name);
            }
            this.requestedRegistry = true;
            this.send({ kind: "typesRegistry" });
            return false;
        }
        installPackage(options: ts.server.InstallPackageOptionsWithProject): Promise<ts.ApplyCodeActionCommandResult> {
            this.send<ts.server.InstallPackageRequest>({ kind: "installPackage", ...options });
            ts.Debug.assert(this.packageInstalledPromise === undefined);
            return new Promise<ts.ApplyCodeActionCommandResult>((resolve, reject) => {
                this.packageInstalledPromise = { resolve, reject };
            });
        }
        attach(projectService: ts.server.ProjectService) {
            this.projectService = projectService;
            if (this.logger.hasLevel(ts.server.LogLevel.requestTime)) {
                this.logger.info("Binding...");
            }
            const args: string[] = [ts.server.Arguments.GlobalCacheLocation, this.globalTypingsCacheLocation];
            if (this.telemetryEnabled) {
                args.push(ts.server.Arguments.EnableTelemetry);
            }
            if (this.logger.loggingEnabled() && this.logger.getLogFileName()) {
                args.push(ts.server.Arguments.LogFile, ts.combinePaths(ts.getDirectoryPath(ts.normalizeSlashes(this.logger.getLogFileName())), `ti-${process.pid}.log`));
            }
            if (this.typingSafeListLocation) {
                args.push(ts.server.Arguments.TypingSafeListLocation, this.typingSafeListLocation);
            }
            if (this.typesMapLocation) {
                args.push(ts.server.Arguments.TypesMapLocation, this.typesMapLocation);
            }
            if (this.npmLocation) {
                args.push(ts.server.Arguments.NpmLocation, this.npmLocation);
            }
            if (this.validateDefaultNpmLocation) {
                args.push(ts.server.Arguments.ValidateDefaultNpmLocation);
            }
            const execArgv: string[] = [];
            for (const arg of process.execArgv) {
                const match = /^--((?:debug|inspect)(?:-brk)?)(?:=(\d+))?$/.exec(arg);
                if (match) {
                    // if port is specified - use port + 1
                    // otherwise pick a default port depending on if 'debug' or 'inspect' and use its value + 1
                    const currentPort = match[2] !== undefined
                        ? +match[2]
                        : match[1].charAt(0) === "d" ? 5858 : 9229;
                    execArgv.push(`--${match[1]}=${currentPort + 1}`);
                    break;
                }
            }
            this.installer = childProcess.fork(ts.combinePaths(__dirname, "typingsInstaller.js"), args, { execArgv });
            this.installer.on("message", m => this.handleMessage(m));
            this.event({ pid: this.installer.pid }, "typingsInstallerPid");
            process.on("exit", () => {
                this.installer.kill();
            });
        }
        onProjectClosed(p: ts.server.Project): void {
            this.send({ projectName: p.getProjectName(), kind: "closeProject" });
        }
        private send<T extends ts.server.TypingInstallerRequestUnion>(rq: T): void {
            this.installer.send(rq);
        }
        enqueueInstallTypingsRequest(project: ts.server.Project, typeAcquisition: ts.TypeAcquisition, unresolvedImports: ts.SortedReadonlyArray<string>): void {
            const request = ts.server.createInstallTypingsRequest(project, typeAcquisition, unresolvedImports);
            if (this.logger.hasLevel(ts.server.LogLevel.verbose)) {
                if (this.logger.hasLevel(ts.server.LogLevel.verbose)) {
                    this.logger.info(`Scheduling throttled operation:${ts.server.stringifyIndented(request)}`);
                }
            }
            const operationId = project.getProjectName();
            const operation = () => {
                if (this.logger.hasLevel(ts.server.LogLevel.verbose)) {
                    this.logger.info(`Sending request:${ts.server.stringifyIndented(request)}`);
                }
                this.send(request);
            };
            const queuedRequest: QueuedOperation = { operationId, operation };
            if (this.activeRequestCount < NodeTypingsInstaller.maxActiveRequestCount) {
                this.scheduleRequest(queuedRequest);
            }
            else {
                if (this.logger.hasLevel(ts.server.LogLevel.verbose)) {
                    this.logger.info(`Deferring request for: ${operationId}`);
                }
                this.requestQueue.push(queuedRequest);
                this.requestMap.set(operationId, queuedRequest);
            }
        }
        private handleMessage(response: ts.server.TypesRegistryResponse | ts.server.PackageInstalledResponse | ts.server.SetTypings | ts.server.InvalidateCachedTypings | ts.server.BeginInstallTypes | ts.server.EndInstallTypes | ts.server.InitializationFailedResponse) {
            if (this.logger.hasLevel(ts.server.LogLevel.verbose)) {
                this.logger.info(`Received response:${ts.server.stringifyIndented(response)}`);
            }
            switch (response.kind) {
                case ts.server.EventTypesRegistry:
                    this.typesRegistryCache = ts.createMapFromTemplate(response.typesRegistry);
                    break;
                case ts.server.ActionPackageInstalled: {
                    const { success, message } = response;
                    if (success) {
                        this.packageInstalledPromise!.resolve({ successMessage: message });
                    }
                    else {
                        this.packageInstalledPromise!.reject(message);
                    }
                    this.packageInstalledPromise = undefined;
                    this.projectService.updateTypingsForProject(response);
                    // The behavior is the same as for setTypings, so send the same event.
                    this.event(response, "setTypings");
                    break;
                }
                case ts.server.EventInitializationFailed: {
                    const body: ts.server.protocol.TypesInstallerInitializationFailedEventBody = {
                        message: response.message
                    };
                    const eventName: ts.server.protocol.TypesInstallerInitializationFailedEventName = "typesInstallerInitializationFailed";
                    this.event(body, eventName);
                    break;
                }
                case ts.server.EventBeginInstallTypes: {
                    const body: ts.server.protocol.BeginInstallTypesEventBody = {
                        eventId: response.eventId,
                        packages: response.packagesToInstall,
                    };
                    const eventName: ts.server.protocol.BeginInstallTypesEventName = "beginInstallTypes";
                    this.event(body, eventName);
                    break;
                }
                case ts.server.EventEndInstallTypes: {
                    if (this.telemetryEnabled) {
                        const body: ts.server.protocol.TypingsInstalledTelemetryEventBody = {
                            telemetryEventName: "typingsInstalled",
                            payload: {
                                installedPackages: response.packagesToInstall.join(","),
                                installSuccess: response.installSuccess,
                                typingsInstallerVersion: response.typingsInstallerVersion
                            }
                        };
                        const eventName: ts.server.protocol.TelemetryEventName = "telemetry";
                        this.event(body, eventName);
                    }
                    const body: ts.server.protocol.EndInstallTypesEventBody = {
                        eventId: response.eventId,
                        packages: response.packagesToInstall,
                        success: response.installSuccess,
                    };
                    const eventName: ts.server.protocol.EndInstallTypesEventName = "endInstallTypes";
                    this.event(body, eventName);
                    break;
                }
                case ts.server.ActionInvalidate: {
                    this.projectService.updateTypingsForProject(response);
                    break;
                }
                case ts.server.ActionSet: {
                    if (this.activeRequestCount > 0) {
                        this.activeRequestCount--;
                    }
                    else {
                        ts.Debug.fail("Received too many responses");
                    }
                    while (this.requestQueue.length > 0) {
                        const queuedRequest = this.requestQueue.shift()!;
                        if (this.requestMap.get(queuedRequest.operationId) === queuedRequest) {
                            this.requestMap.delete(queuedRequest.operationId);
                            this.scheduleRequest(queuedRequest);
                            break;
                        }
                        if (this.logger.hasLevel(ts.server.LogLevel.verbose)) {
                            this.logger.info(`Skipping defunct request for: ${queuedRequest.operationId}`);
                        }
                    }
                    this.projectService.updateTypingsForProject(response);
                    this.event(response, "setTypings");
                    break;
                }
                default:
                    ts.assertType<never>(response);
            }
        }
        private scheduleRequest(request: QueuedOperation) {
            if (this.logger.hasLevel(ts.server.LogLevel.verbose)) {
                this.logger.info(`Scheduling request for: ${request.operationId}`);
            }
            this.activeRequestCount++;
            this.host.setTimeout(request.operation, NodeTypingsInstaller.requestDelayMillis);
        }
    }
    class IOSession extends ts.server.Session {
        private eventPort: number | undefined;
        private eventSocket: NodeSocket | undefined;
        private socketEventQueue: {
            body: any;
            eventName: string;
        }[] | undefined;
        private constructed: boolean | undefined;
        constructor() {
            const event: ts.server.Event | undefined = (body: object, eventName: string) => {
                if (this.constructed) {
                    this.event(body, eventName);
                }
                else {
                    // It is unsafe to dereference `this` before initialization completes,
                    // so we defer until the next tick.
                    //
                    // Construction should finish before the next tick fires, so we do not need to do this recursively.
                    // eslint-disable-next-line no-restricted-globals
                    setImmediate(() => this.event(body, eventName));
                }
            };
            const host = sys;
            const typingsInstaller = disableAutomaticTypingAcquisition
                ? undefined
                : new NodeTypingsInstaller(telemetryEnabled, logger, host, getGlobalTypingsCacheLocation(), typingSafeListLocation, typesMapLocation, npmLocation, validateDefaultNpmLocation, event);
            super({
                host,
                cancellationToken,
                useSingleInferredProject,
                useInferredProjectPerProjectRoot,
                typingsInstaller: typingsInstaller || ts.server.nullTypingsInstaller,
                byteLength: Buffer.byteLength,
                hrtime: process.hrtime,
                logger,
                canUseEvents: true,
                suppressDiagnosticEvents,
                syntaxOnly,
                noGetErrOnBackgroundUpdate,
                globalPlugins,
                pluginProbeLocations,
                allowLocalPluginLoads,
                typesMapLocation,
            });
            this.eventPort = eventPort;
            if (this.canUseEvents && this.eventPort) {
                const s = net.connect({ port: this.eventPort }, () => {
                    this.eventSocket = s;
                    if (this.socketEventQueue) {
                        // flush queue.
                        for (const event of this.socketEventQueue) {
                            this.writeToEventSocket(event.body, event.eventName);
                        }
                        this.socketEventQueue = undefined;
                    }
                });
            }
            this.constructed = true;
        }
        event<T extends object>(body: T, eventName: string): void {
            ts.Debug.assert(!!this.constructed, "Should only call `IOSession.prototype.event` on an initialized IOSession");
            if (this.canUseEvents && this.eventPort) {
                if (!this.eventSocket) {
                    if (this.logger.hasLevel(ts.server.LogLevel.verbose)) {
                        this.logger.info(`eventPort: event "${eventName}" queued, but socket not yet initialized`);
                    }
                    (this.socketEventQueue || (this.socketEventQueue = [])).push({ body, eventName });
                    return;
                }
                else {
                    ts.Debug.assert(this.socketEventQueue === undefined);
                    this.writeToEventSocket(body, eventName);
                }
            }
            else {
                super.event(body, eventName);
            }
        }
        private writeToEventSocket(body: object, eventName: string): void {
            this.eventSocket!.write(ts.server.formatMessage(ts.server.toEvent(eventName, body), this.logger, this.byteLength, this.host.newLine), "utf8");
        }
        exit() {
            this.logger.info("Exiting...");
            this.projectService.closeLog();
            process.exit(0);
        }
        listen() {
            rl.on("line", (input: string) => {
                const message = input.trim();
                this.onMessage(message);
            });
            rl.on("close", () => {
                this.exit();
            });
        }
    }
    interface LogOptions {
        file?: string;
        detailLevel?: ts.server.LogLevel;
        traceToConsole?: boolean;
        logToFile?: boolean;
    }
    function parseLoggingEnvironmentString(logEnvStr: string | undefined): LogOptions {
        if (!logEnvStr) {
            return {};
        }
        const logEnv: LogOptions = { logToFile: true };
        const args = logEnvStr.split(" ");
        const len = args.length - 1;
        for (let i = 0; i < len; i += 2) {
            const option = args[i];
            const { value, extraPartCounter } = getEntireValue(i + 1);
            i += extraPartCounter;
            if (option && value) {
                switch (option) {
                    case "-file":
                        logEnv.file = value;
                        break;
                    case "-level":
                        const level = getLogLevel(value);
                        logEnv.detailLevel = level !== undefined ? level : ts.server.LogLevel.normal;
                        break;
                    case "-traceToConsole":
                        logEnv.traceToConsole = value.toLowerCase() === "true";
                        break;
                    case "-logToFile":
                        logEnv.logToFile = value.toLowerCase() === "true";
                        break;
                }
            }
        }
        return logEnv;
        function getEntireValue(initialIndex: number) {
            let pathStart = args[initialIndex];
            let extraPartCounter = 0;
            if (pathStart.charCodeAt(0) === ts.CharacterCodes.doubleQuote &&
                pathStart.charCodeAt(pathStart.length - 1) !== ts.CharacterCodes.doubleQuote) {
                for (let i = initialIndex + 1; i < args.length; i++) {
                    pathStart += " ";
                    pathStart += args[i];
                    extraPartCounter++;
                    if (pathStart.charCodeAt(pathStart.length - 1) === ts.CharacterCodes.doubleQuote)
                        break;
                }
            }
            return { value: ts.stripQuotes(pathStart), extraPartCounter };
        }
    }
    function getLogLevel(level: string | undefined) {
        if (level) {
            const l = level.toLowerCase();
            for (const name in ts.server.LogLevel) {
                if (isNaN(+name) && l === name.toLowerCase()) {
                    return <ts.server.LogLevel><any>ts.server.LogLevel[name];
                }
            }
        }
        return undefined;
    }
    // TSS_LOG "{ level: "normal | verbose | terse", file?: string}"
    function createLogger() {
        const cmdLineLogFileName = ts.server.findArgument("--logFile");
        const cmdLineVerbosity = getLogLevel(ts.server.findArgument("--logVerbosity"));
        const envLogOptions = parseLoggingEnvironmentString(process.env.TSS_LOG);
        const unsubstitutedLogFileName = cmdLineLogFileName
            ? ts.stripQuotes(cmdLineLogFileName)
            : envLogOptions.logToFile
                ? envLogOptions.file || (__dirname + "/.log" + process.pid.toString())
                : undefined;
        const substitutedLogFileName = unsubstitutedLogFileName
            ? unsubstitutedLogFileName.replace("PID", process.pid.toString())
            : undefined;
        const logVerbosity = cmdLineVerbosity || envLogOptions.detailLevel;
        return new Logger(substitutedLogFileName!, envLogOptions.traceToConsole!, logVerbosity!); // TODO: GH#18217
    }
    // This places log file in the directory containing editorServices.js
    // TODO: check that this location is writable
    // average async stat takes about 30 microseconds
    // set chunk size to do 30 files in < 1 millisecond
    function createPollingWatchedFileSet(interval = 2500, chunkSize = 30) {
        const watchedFiles: ts.WatchedFile[] = [];
        let nextFileToCheck = 0;
        return { getModifiedTime, poll, startWatchTimer, addFile, removeFile };
        function getModifiedTime(fileName: string): Date {
            return fs.statSync(fileName).mtime;
        }
        function poll(checkedIndex: number) {
            const watchedFile = watchedFiles[checkedIndex];
            if (!watchedFile) {
                return;
            }
            fs.stat(watchedFile.fileName, (err, stats) => {
                if (err) {
                    if (err.code === "ENOENT") {
                        if (watchedFile.mtime.getTime() !== 0) {
                            watchedFile.mtime = ts.missingFileModifiedTime;
                            watchedFile.callback(watchedFile.fileName, ts.FileWatcherEventKind.Deleted);
                        }
                    }
                    else {
                        watchedFile.callback(watchedFile.fileName, ts.FileWatcherEventKind.Changed);
                    }
                }
                else {
                    ts.onWatchedFileStat(watchedFile, stats.mtime);
                }
            });
        }
        // this implementation uses polling and
        // stat due to inconsistencies of fs.watch
        // and efficiency of stat on modern filesystems
        function startWatchTimer() {
            // eslint-disable-next-line no-restricted-globals
            setInterval(() => {
                let count = 0;
                let nextToCheck = nextFileToCheck;
                let firstCheck = -1;
                while ((count < chunkSize) && (nextToCheck !== firstCheck)) {
                    poll(nextToCheck);
                    if (firstCheck < 0) {
                        firstCheck = nextToCheck;
                    }
                    nextToCheck++;
                    if (nextToCheck === watchedFiles.length) {
                        nextToCheck = 0;
                    }
                    count++;
                }
                nextFileToCheck = nextToCheck;
            }, interval);
        }
        function addFile(fileName: string, callback: ts.FileWatcherCallback): ts.WatchedFile {
            const file: ts.WatchedFile = {
                fileName,
                callback,
                mtime: sys.fileExists(fileName)
                    ? getModifiedTime(fileName)
                    : ts.missingFileModifiedTime // Any subsequent modification will occur after this time
            };
            watchedFiles.push(file);
            if (watchedFiles.length === 1) {
                startWatchTimer();
            }
            return file;
        }
        function removeFile(file: ts.WatchedFile) {
            ts.unorderedRemoveItem(watchedFiles, file);
        }
    }
    // REVIEW: for now this implementation uses polling.
    // The advantage of polling is that it works reliably
    // on all os and with network mounted files.
    // For 90 referenced files, the average time to detect
    // changes is 2*msInterval (by default 5 seconds).
    // The overhead of this is .04 percent (1/2500) with
    // average pause of < 1 millisecond (and max
    // pause less than 1.5 milliseconds); question is
    // do we anticipate reference sets in the 100s and
    // do we care about waiting 10-20 seconds to detect
    // changes for large reference sets? If so, do we want
    // to increase the chunk size or decrease the interval
    // time dynamically to match the large reference set?
    const pollingWatchedFileSet = createPollingWatchedFileSet();
    const pending: Buffer[] = [];
    let canWrite = true;
    function writeMessage(buf: Buffer) {
        if (!canWrite) {
            pending.push(buf);
        }
        else {
            canWrite = false;
            process.stdout.write(buf, setCanWriteFlagAndWriteMessageIfNecessary);
        }
    }
    function setCanWriteFlagAndWriteMessageIfNecessary() {
        canWrite = true;
        if (pending.length) {
            writeMessage(pending.shift()!);
        }
    }
    function extractWatchDirectoryCacheKey(path: string, currentDriveKey: string | undefined) {
        path = ts.normalizeSlashes(path);
        if (isUNCPath(path)) {
            // UNC path: extract server name
            // //server/location
            //         ^ <- from 0 to this position
            const firstSlash = path.indexOf(ts.directorySeparator, 2);
            return firstSlash !== -1 ? path.substring(0, firstSlash).toLowerCase() : path;
        }
        const rootLength = ts.getRootLength(path);
        if (rootLength === 0) {
            // relative path - assume file is on the current drive
            return currentDriveKey;
        }
        if (path.charCodeAt(1) === ts.CharacterCodes.colon && path.charCodeAt(2) === ts.CharacterCodes.slash) {
            // rooted path that starts with c:/... - extract drive letter
            return path.charAt(0).toLowerCase();
        }
        if (path.charCodeAt(0) === ts.CharacterCodes.slash && path.charCodeAt(1) !== ts.CharacterCodes.slash) {
            // rooted path that starts with slash - /somename - use key for current drive
            return currentDriveKey;
        }
        // do not cache any other cases
        return undefined;
    }
    function isUNCPath(s: string): boolean {
        return s.length > 2 && s.charCodeAt(0) === ts.CharacterCodes.slash && s.charCodeAt(1) === ts.CharacterCodes.slash;
    }
    const logger = createLogger();
    const sys = (<ts.server.ServerHost>ts.sys);
    const nodeVersion = ts.getNodeMajorVersion();
    // use watchGuard process on Windows when node version is 4 or later
    const useWatchGuard = process.platform === "win32" && nodeVersion! >= 4;
    const originalWatchDirectory: ts.server.ServerHost["watchDirectory"] = sys.watchDirectory.bind(sys);
    const noopWatcher: ts.FileWatcher = { close: ts.noop };
    // This is the function that catches the exceptions when watching directory, and yet lets project service continue to function
    // Eg. on linux the number of watches are limited and one could easily exhaust watches and the exception ENOSPC is thrown when creating watcher at that point
    function watchDirectorySwallowingException(path: string, callback: ts.DirectoryWatcherCallback, recursive?: boolean, options?: ts.WatchOptions): ts.FileWatcher {
        try {
            return originalWatchDirectory(path, callback, recursive, options);
        }
        catch (e) {
            logger.info(`Exception when creating directory watcher: ${e.message}`);
            return noopWatcher;
        }
    }
    if (useWatchGuard) {
        const currentDrive = extractWatchDirectoryCacheKey(sys.resolvePath(sys.getCurrentDirectory()), /*currentDriveKey*/ undefined);
        const statusCache = ts.createMap<boolean>();
        sys.watchDirectory = (path, callback, recursive, options) => {
            const cacheKey = extractWatchDirectoryCacheKey(path, currentDrive);
            let status = cacheKey && statusCache.get(cacheKey);
            if (status === undefined) {
                if (logger.hasLevel(ts.server.LogLevel.verbose)) {
                    logger.info(`${cacheKey} for path ${path} not found in cache...`);
                }
                try {
                    const args = [ts.combinePaths(__dirname, "watchGuard.js"), path];
                    if (logger.hasLevel(ts.server.LogLevel.verbose)) {
                        logger.info(`Starting ${process.execPath} with args:${ts.server.stringifyIndented(args)}`);
                    }
                    childProcess.execFileSync(process.execPath, args, { stdio: "ignore", env: { ELECTRON_RUN_AS_NODE: "1" } });
                    status = true;
                    if (logger.hasLevel(ts.server.LogLevel.verbose)) {
                        logger.info(`WatchGuard for path ${path} returned: OK`);
                    }
                }
                catch (e) {
                    status = false;
                    if (logger.hasLevel(ts.server.LogLevel.verbose)) {
                        logger.info(`WatchGuard for path ${path} returned: ${e.message}`);
                    }
                }
                if (cacheKey) {
                    statusCache.set(cacheKey, status);
                }
            }
            else if (logger.hasLevel(ts.server.LogLevel.verbose)) {
                logger.info(`watchDirectory for ${path} uses cached drive information.`);
            }
            if (status) {
                // this drive is safe to use - call real 'watchDirectory'
                return watchDirectorySwallowingException(path, callback, recursive, options);
            }
            else {
                // this drive is unsafe - return no-op watcher
                return noopWatcher;
            }
        };
    }
    else {
        sys.watchDirectory = watchDirectorySwallowingException;
    }
    // Override sys.write because fs.writeSync is not reliable on Node 4
    sys.write = (s: string) => writeMessage(sys.bufferFrom!(s, "utf8"));
    sys.watchFile = (fileName, callback) => {
        const watchedFile = pollingWatchedFileSet.addFile(fileName, callback);
        return {
            close: () => pollingWatchedFileSet.removeFile(watchedFile)
        };
    };
    /* eslint-disable no-restricted-globals */
    sys.setTimeout = setTimeout;
    sys.clearTimeout = clearTimeout;
    sys.setImmediate = setImmediate;
    sys.clearImmediate = clearImmediate;
    /* eslint-enable no-restricted-globals */
    if (typeof global !== "undefined" && global.gc) {
        sys.gc = () => global.gc();
    }
    sys.require = (initialDir: string, moduleName: string): ts.server.RequireResult => {
        try {
            return { module: require(ts.resolveJSModule(moduleName, initialDir, sys)), error: undefined };
        }
        catch (error) {
            return { module: undefined, error };
        }
    };
    let cancellationToken: ts.server.ServerCancellationToken;
    try {
        const factory = require("./cancellationToken");
        cancellationToken = factory(sys.args);
    }
    catch (e) {
        cancellationToken = ts.server.nullCancellationToken;
    }
    function parseEventPort(eventPortStr: string | undefined) {
        const eventPort = eventPortStr === undefined ? undefined : parseInt(eventPortStr);
        return eventPort !== undefined && !isNaN(eventPort) ? eventPort : undefined;
    }
    const eventPort: number | undefined = parseEventPort(ts.server.findArgument("--eventPort"));
    const localeStr = ts.server.findArgument("--locale");
    if (localeStr) {
        ts.validateLocaleAndSetLanguage(localeStr, sys);
    }
    ts.setStackTraceLimit();
    const typingSafeListLocation = (ts.server.findArgument(ts.server.Arguments.TypingSafeListLocation)!); // TODO: GH#18217
    const typesMapLocation = ts.server.findArgument(ts.server.Arguments.TypesMapLocation) || ts.combinePaths(ts.getDirectoryPath(sys.getExecutingFilePath()), "typesMap.json");
    const npmLocation = ts.server.findArgument(ts.server.Arguments.NpmLocation);
    const validateDefaultNpmLocation = ts.server.hasArgument(ts.server.Arguments.ValidateDefaultNpmLocation);
    function parseStringArray(argName: string): readonly string[] {
        const arg = ts.server.findArgument(argName);
        if (arg === undefined) {
            return ts.server.emptyArray;
        }
        return arg.split(",").filter(name => name !== "");
    }
    const globalPlugins = parseStringArray("--globalPlugins");
    const pluginProbeLocations = parseStringArray("--pluginProbeLocations");
    const allowLocalPluginLoads = ts.server.hasArgument("--allowLocalPluginLoads");
    const useSingleInferredProject = ts.server.hasArgument("--useSingleInferredProject");
    const useInferredProjectPerProjectRoot = ts.server.hasArgument("--useInferredProjectPerProjectRoot");
    const disableAutomaticTypingAcquisition = ts.server.hasArgument("--disableAutomaticTypingAcquisition");
    const suppressDiagnosticEvents = ts.server.hasArgument("--suppressDiagnosticEvents");
    const syntaxOnly = ts.server.hasArgument("--syntaxOnly");
    const telemetryEnabled = ts.server.hasArgument(ts.server.Arguments.EnableTelemetry);
    const noGetErrOnBackgroundUpdate = ts.server.hasArgument("--noGetErrOnBackgroundUpdate");
    logger.info(`Starting TS Server`);
    logger.info(`Version: ${ts.version}`);
    logger.info(`Arguments: ${process.argv.join(" ")}`);
    logger.info(`Platform: ${os.platform()} NodeVersion: ${nodeVersion} CaseSensitive: ${sys.useCaseSensitiveFileNames}`);
    const ioSession = new IOSession();
    process.on("uncaughtException", err => {
        ioSession.logError(err, "unknown");
    });
    // See https://github.com/Microsoft/TypeScript/issues/11348
    (process as any).noAsar = true;
    // Start listening
    ioSession.listen();
    if (ts.Debug.isDebugging) {
        ts.Debug.enableDebugInfo();
    }
    if (ts.sys.tryEnableSourceMapsForHost && /^development$/i.test(ts.sys.getEnvironmentVariable("NODE_ENV"))) {
        ts.sys.tryEnableSourceMapsForHost();
    }
    // Overwrites the current console messages to instead write to
    // the log. This is so that language service plugins which use
    // console.log don't break the message passing between tsserver
    // and the client
    console.log = (...args) => logger.msg(args.length === 1 ? args[0] : args.join(", "), ts.server.Msg.Info);
    console.warn = (...args) => logger.msg(args.length === 1 ? args[0] : args.join(", "), ts.server.Msg.Err);
    console.error = (...args) => logger.msg(args.length === 1 ? args[0] : args.join(", "), ts.server.Msg.Err);
}
