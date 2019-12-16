import * as ts from "../../ts";
describe("unittests:: tsserver:: Project Errors", () => {
    function checkProjectErrors(projectFiles: ts.server.ProjectFilesWithTSDiagnostics, expectedErrors: readonly string[]): void {
        assert.isTrue(projectFiles !== undefined, "missing project files");
        checkProjectErrorsWorker(projectFiles.projectErrors, expectedErrors);
    }
    function checkProjectErrorsWorker(errors: readonly ts.Diagnostic[], expectedErrors: readonly string[]): void {
        assert.equal(errors ? errors.length : 0, expectedErrors.length, `expected ${expectedErrors.length} error in the list`);
        if (expectedErrors.length) {
            for (let i = 0; i < errors.length; i++) {
                const actualMessage = ts.flattenDiagnosticMessageText(errors[i].messageText, "\n");
                const expectedMessage = expectedErrors[i];
                assert.isTrue(actualMessage.indexOf(expectedMessage) === 0, `error message does not match, expected ${actualMessage} to start with ${expectedMessage}`);
            }
        }
    }
    function checkDiagnosticsWithLinePos(errors: ts.server.protocol.DiagnosticWithLinePosition[], expectedErrors: string[]) {
        assert.equal(errors ? errors.length : 0, expectedErrors.length, `expected ${expectedErrors.length} error in the list`);
        if (expectedErrors.length) {
            ts.zipWith(errors, expectedErrors, ({ message: actualMessage }, expectedMessage) => {
                assert.isTrue(ts.startsWith(actualMessage, actualMessage), `error message does not match, expected ${actualMessage} to start with ${expectedMessage}`);
            });
        }
    }
    it("external project - diagnostics for missing files", () => {
        const file1 = {
            path: "/a/b/app.ts",
            content: ""
        };
        const file2 = {
            path: "/a/b/applib.ts",
            content: ""
        };
        const host = ts.projectSystem.createServerHost([file1, ts.projectSystem.libFile]);
        const session = ts.projectSystem.createSession(host);
        const projectService = session.getProjectService();
        const projectFileName = "/a/b/test.csproj";
        const compilerOptionsRequest: ts.server.protocol.CompilerOptionsDiagnosticsRequest = {
            type: "request",
            command: ts.server.CommandNames.CompilerOptionsDiagnosticsFull,
            seq: 2,
            arguments: { projectFileName }
        };
        {
            projectService.openExternalProject({
                projectFileName,
                options: {},
                rootFiles: ts.projectSystem.toExternalFiles([file1.path, file2.path])
            });
            ts.projectSystem.checkNumberOfProjects(projectService, { externalProjects: 1 });
            const diags = (session.executeCommand(compilerOptionsRequest).response as ts.server.protocol.DiagnosticWithLinePosition[]);
            // only file1 exists - expect error
            checkDiagnosticsWithLinePos(diags, ["File '/a/b/applib.ts' not found."]);
        }
        host.reloadFS([file2, ts.projectSystem.libFile]);
        {
            // only file2 exists - expect error
            ts.projectSystem.checkNumberOfProjects(projectService, { externalProjects: 1 });
            const diags = (session.executeCommand(compilerOptionsRequest).response as ts.server.protocol.DiagnosticWithLinePosition[]);
            checkDiagnosticsWithLinePos(diags, ["File '/a/b/app.ts' not found."]);
        }
        host.reloadFS([file1, file2, ts.projectSystem.libFile]);
        {
            // both files exist - expect no errors
            ts.projectSystem.checkNumberOfProjects(projectService, { externalProjects: 1 });
            const diags = (session.executeCommand(compilerOptionsRequest).response as ts.server.protocol.DiagnosticWithLinePosition[]);
            checkDiagnosticsWithLinePos(diags, []);
        }
    });
    it("configured projects - diagnostics for missing files", () => {
        const file1 = {
            path: "/a/b/app.ts",
            content: ""
        };
        const file2 = {
            path: "/a/b/applib.ts",
            content: ""
        };
        const config = {
            path: "/a/b/tsconfig.json",
            content: JSON.stringify({ files: [file1, file2].map(f => ts.getBaseFileName(f.path)) })
        };
        const host = ts.projectSystem.createServerHost([file1, config, ts.projectSystem.libFile]);
        const session = ts.projectSystem.createSession(host);
        const projectService = session.getProjectService();
        ts.projectSystem.openFilesForSession([file1], session);
        ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1 });
        const project = ts.projectSystem.configuredProjectAt(projectService, 0);
        const compilerOptionsRequest: ts.server.protocol.CompilerOptionsDiagnosticsRequest = {
            type: "request",
            command: ts.server.CommandNames.CompilerOptionsDiagnosticsFull,
            seq: 2,
            arguments: { projectFileName: project.getProjectName() }
        };
        let diags = (session.executeCommand(compilerOptionsRequest).response as ts.server.protocol.DiagnosticWithLinePosition[]);
        checkDiagnosticsWithLinePos(diags, ["File '/a/b/applib.ts' not found."]);
        host.reloadFS([file1, file2, config, ts.projectSystem.libFile]);
        ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1 });
        diags = (session.executeCommand(compilerOptionsRequest).response as ts.server.protocol.DiagnosticWithLinePosition[]);
        checkDiagnosticsWithLinePos(diags, []);
    });
    it("configured projects - diagnostics for corrupted config 1", () => {
        const file1 = {
            path: "/a/b/app.ts",
            content: ""
        };
        const file2 = {
            path: "/a/b/lib.ts",
            content: ""
        };
        const correctConfig = {
            path: "/a/b/tsconfig.json",
            content: JSON.stringify({ files: [file1, file2].map(f => ts.getBaseFileName(f.path)) })
        };
        const corruptedConfig = {
            path: correctConfig.path,
            content: correctConfig.content.substr(1)
        };
        const host = ts.projectSystem.createServerHost([file1, file2, corruptedConfig]);
        const projectService = ts.projectSystem.createProjectService(host);
        projectService.openClientFile(file1.path);
        {
            projectService.checkNumberOfProjects({ configuredProjects: 1 });
            const configuredProject = (ts.find(projectService.synchronizeProjectList([]), f => f.info!.projectName === corruptedConfig.path)!);
            assert.isTrue(configuredProject !== undefined, "should find configured project");
            checkProjectErrors(configuredProject, []);
            const projectErrors = ts.projectSystem.configuredProjectAt(projectService, 0).getAllProjectErrors();
            checkProjectErrorsWorker(projectErrors, [
                "'{' expected."
            ]);
            assert.isNotNull(projectErrors[0].file);
            assert.equal(projectErrors[0].file!.fileName, corruptedConfig.path);
        }
        // fix config and trigger watcher
        host.reloadFS([file1, file2, correctConfig]);
        {
            projectService.checkNumberOfProjects({ configuredProjects: 1 });
            const configuredProject = (ts.find(projectService.synchronizeProjectList([]), f => f.info!.projectName === corruptedConfig.path)!);
            assert.isTrue(configuredProject !== undefined, "should find configured project");
            checkProjectErrors(configuredProject, []);
            const projectErrors = ts.projectSystem.configuredProjectAt(projectService, 0).getAllProjectErrors();
            checkProjectErrorsWorker(projectErrors, []);
        }
    });
    it("configured projects - diagnostics for corrupted config 2", () => {
        const file1 = {
            path: "/a/b/app.ts",
            content: ""
        };
        const file2 = {
            path: "/a/b/lib.ts",
            content: ""
        };
        const correctConfig = {
            path: "/a/b/tsconfig.json",
            content: JSON.stringify({ files: [file1, file2].map(f => ts.getBaseFileName(f.path)) })
        };
        const corruptedConfig = {
            path: correctConfig.path,
            content: correctConfig.content.substr(1)
        };
        const host = ts.projectSystem.createServerHost([file1, file2, correctConfig]);
        const projectService = ts.projectSystem.createProjectService(host);
        projectService.openClientFile(file1.path);
        {
            projectService.checkNumberOfProjects({ configuredProjects: 1 });
            const configuredProject = (ts.find(projectService.synchronizeProjectList([]), f => f.info!.projectName === corruptedConfig.path)!);
            assert.isTrue(configuredProject !== undefined, "should find configured project");
            checkProjectErrors(configuredProject, []);
            const projectErrors = ts.projectSystem.configuredProjectAt(projectService, 0).getAllProjectErrors();
            checkProjectErrorsWorker(projectErrors, []);
        }
        // break config and trigger watcher
        host.reloadFS([file1, file2, corruptedConfig]);
        {
            projectService.checkNumberOfProjects({ configuredProjects: 1 });
            const configuredProject = (ts.find(projectService.synchronizeProjectList([]), f => f.info!.projectName === corruptedConfig.path)!);
            assert.isTrue(configuredProject !== undefined, "should find configured project");
            checkProjectErrors(configuredProject, []);
            const projectErrors = ts.projectSystem.configuredProjectAt(projectService, 0).getAllProjectErrors();
            checkProjectErrorsWorker(projectErrors, [
                "'{' expected."
            ]);
            assert.isNotNull(projectErrors[0].file);
            assert.equal(projectErrors[0].file!.fileName, corruptedConfig.path);
        }
    });
});
describe("unittests:: tsserver:: Project Errors are reported as appropriate", () => {
    function createErrorLogger() {
        let hasError = false;
        const errorLogger: ts.server.Logger = {
            close: ts.noop,
            hasLevel: () => true,
            loggingEnabled: () => true,
            perftrc: ts.noop,
            info: ts.noop,
            msg: (_s, type) => {
                if (type === ts.server.Msg.Err) {
                    hasError = true;
                }
            },
            startGroup: ts.noop,
            endGroup: ts.noop,
            getLogFileName: ts.returnUndefined
        };
        return {
            errorLogger,
            hasError: () => hasError
        };
    }
    it("document is not contained in project", () => {
        const file1 = {
            path: "/a/b/app.ts",
            content: ""
        };
        const corruptedConfig = {
            path: "/a/b/tsconfig.json",
            content: "{"
        };
        const host = ts.projectSystem.createServerHost([file1, corruptedConfig]);
        const projectService = ts.projectSystem.createProjectService(host);
        projectService.openClientFile(file1.path);
        projectService.checkNumberOfProjects({ configuredProjects: 1 });
        const project = projectService.findProject(corruptedConfig.path)!;
        ts.projectSystem.checkProjectRootFiles(project, [file1.path]);
    });
    describe("when opening new file that doesnt exist on disk yet", () => {
        function verifyNonExistentFile(useProjectRoot: boolean) {
            const folderPath = "/user/someuser/projects/someFolder";
            const fileInRoot: ts.projectSystem.File = {
                path: `/src/somefile.d.ts`,
                content: "class c { }"
            };
            const fileInProjectRoot: ts.projectSystem.File = {
                path: `${folderPath}/src/somefile.d.ts`,
                content: "class c { }"
            };
            const host = ts.projectSystem.createServerHost([ts.projectSystem.libFile, fileInRoot, fileInProjectRoot]);
            const { hasError, errorLogger } = createErrorLogger();
            const session = ts.projectSystem.createSession(host, { canUseEvents: true, logger: errorLogger, useInferredProjectPerProjectRoot: true });
            const projectService = session.getProjectService();
            const untitledFile = "untitled:Untitled-1";
            const refPathNotFound1 = "../../../../../../typings/@epic/Core.d.ts";
            const refPathNotFound2 = "./src/somefile.d.ts";
            const fileContent = `/// <reference path="${refPathNotFound1}" />
/// <reference path="${refPathNotFound2}" />`;
            session.executeCommandSeq<ts.projectSystem.protocol.OpenRequest>({
                command: ts.server.CommandNames.Open,
                arguments: {
                    file: untitledFile,
                    fileContent,
                    scriptKindName: "TS",
                    projectRootPath: useProjectRoot ? folderPath : undefined
                }
            });
            ts.projectSystem.checkNumberOfProjects(projectService, { inferredProjects: 1 });
            const infoForUntitledAtProjectRoot = projectService.getScriptInfoForPath((`${folderPath.toLowerCase()}/${untitledFile.toLowerCase()}` as ts.Path));
            const infoForUnitiledAtRoot = projectService.getScriptInfoForPath((`/${untitledFile.toLowerCase()}` as ts.Path));
            const infoForSomefileAtProjectRoot = projectService.getScriptInfoForPath((`/${folderPath.toLowerCase()}/src/somefile.d.ts` as ts.Path));
            const infoForSomefileAtRoot = projectService.getScriptInfoForPath((`${fileInRoot.path.toLowerCase()}` as ts.Path));
            if (useProjectRoot) {
                assert.isDefined(infoForUntitledAtProjectRoot);
                assert.isUndefined(infoForUnitiledAtRoot);
            }
            else {
                assert.isDefined(infoForUnitiledAtRoot);
                assert.isUndefined(infoForUntitledAtProjectRoot);
            }
            assert.isUndefined(infoForSomefileAtRoot);
            assert.isUndefined(infoForSomefileAtProjectRoot);
            // Since this is not js project so no typings are queued
            host.checkTimeoutQueueLength(0);
            const errorOffset = fileContent.indexOf(refPathNotFound1) + 1;
            ts.projectSystem.verifyGetErrRequest({
                session,
                host,
                expected: [{
                        file: untitledFile,
                        syntax: [],
                        semantic: [
                            ts.projectSystem.createDiagnostic({ line: 1, offset: errorOffset }, { line: 1, offset: errorOffset + refPathNotFound1.length }, ts.Diagnostics.File_0_not_found, [refPathNotFound1], "error"),
                            ts.projectSystem.createDiagnostic({ line: 2, offset: errorOffset }, { line: 2, offset: errorOffset + refPathNotFound2.length }, ts.Diagnostics.File_0_not_found, [refPathNotFound2.substr(2)], "error")
                        ],
                        suggestion: []
                    }],
                onErrEvent: () => assert.isFalse(hasError())
            });
        }
        it("has projectRoot", () => {
            verifyNonExistentFile(/*useProjectRoot*/ true);
        });
        it("does not have projectRoot", () => {
            verifyNonExistentFile(/*useProjectRoot*/ false);
        });
    });
    it("folder rename updates project structure and reports no errors", () => {
        const projectDir = "/a/b/projects/myproject";
        const app: ts.projectSystem.File = {
            path: `${projectDir}/bar/app.ts`,
            content: "class Bar implements foo.Foo { getFoo() { return ''; } get2() { return 1; } }"
        };
        const foo: ts.projectSystem.File = {
            path: `${projectDir}/foo/foo.ts`,
            content: "declare namespace foo { interface Foo { get2(): number; getFoo(): string; } }"
        };
        const configFile: ts.projectSystem.File = {
            path: `${projectDir}/tsconfig.json`,
            content: JSON.stringify({ compilerOptions: { module: "none", targer: "es5" }, exclude: ["node_modules"] })
        };
        const host = ts.projectSystem.createServerHost([app, foo, configFile]);
        const session = ts.projectSystem.createSession(host, { canUseEvents: true, });
        const projectService = session.getProjectService();
        session.executeCommandSeq<ts.projectSystem.protocol.OpenRequest>({
            command: ts.server.CommandNames.Open,
            arguments: { file: app.path, }
        });
        ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1 });
        assert.isDefined(projectService.configuredProjects.get(configFile.path));
        verifyErrorsInApp();
        host.renameFolder(`${projectDir}/foo`, `${projectDir}/foo2`);
        host.runQueuedTimeoutCallbacks();
        host.runQueuedTimeoutCallbacks();
        verifyErrorsInApp();
        function verifyErrorsInApp() {
            ts.projectSystem.verifyGetErrRequest({
                session,
                host,
                expected: [{
                        file: app,
                        syntax: [],
                        semantic: [],
                        suggestion: []
                    }],
            });
        }
    });
    it("Getting errors before opening file", () => {
        const file: ts.projectSystem.File = {
            path: "/a/b/project/file.ts",
            content: "let x: number = false;"
        };
        const host = ts.projectSystem.createServerHost([file, ts.projectSystem.libFile]);
        const { hasError, errorLogger } = createErrorLogger();
        const session = ts.projectSystem.createSession(host, { canUseEvents: true, logger: errorLogger });
        session.clearMessages();
        const expectedSequenceId = session.getNextSeq();
        session.executeCommandSeq<ts.projectSystem.protocol.GeterrRequest>({
            command: ts.server.CommandNames.Geterr,
            arguments: {
                delay: 0,
                files: [file.path]
            }
        });
        host.runQueuedImmediateCallbacks();
        assert.isFalse(hasError());
        ts.projectSystem.checkCompleteEvent(session, 1, expectedSequenceId);
        session.clearMessages();
    });
    it("Reports errors correctly when file referenced by inferred project root, is opened right after closing the root file", () => {
        const app: ts.projectSystem.File = {
            path: `${ts.tscWatch.projectRoot}/src/client/app.js`,
            content: ""
        };
        const serverUtilities: ts.projectSystem.File = {
            path: `${ts.tscWatch.projectRoot}/src/server/utilities.js`,
            content: `function getHostName() { return "hello"; } export { getHostName };`
        };
        const backendTest: ts.projectSystem.File = {
            path: `${ts.tscWatch.projectRoot}/test/backend/index.js`,
            content: `import { getHostName } from '../../src/server/utilities';export default getHostName;`
        };
        const files = [ts.projectSystem.libFile, app, serverUtilities, backendTest];
        const host = ts.projectSystem.createServerHost(files);
        const session = ts.projectSystem.createSession(host, { useInferredProjectPerProjectRoot: true, canUseEvents: true });
        ts.projectSystem.openFilesForSession([{ file: app, projectRootPath: ts.tscWatch.projectRoot }], session);
        const service = session.getProjectService();
        ts.projectSystem.checkNumberOfProjects(service, { inferredProjects: 1 });
        const project = service.inferredProjects[0];
        ts.projectSystem.checkProjectActualFiles(project, [ts.projectSystem.libFile.path, app.path]);
        ts.projectSystem.openFilesForSession([{ file: backendTest, projectRootPath: ts.tscWatch.projectRoot }], session);
        ts.projectSystem.checkNumberOfProjects(service, { inferredProjects: 1 });
        ts.projectSystem.checkProjectActualFiles(project, files.map(f => f.path));
        checkErrors([backendTest.path, app.path]);
        ts.projectSystem.closeFilesForSession([backendTest], session);
        ts.projectSystem.openFilesForSession([{ file: serverUtilities.path, projectRootPath: ts.tscWatch.projectRoot }], session);
        checkErrors([serverUtilities.path, app.path]);
        function checkErrors(openFiles: [string, string]) {
            ts.projectSystem.verifyGetErrRequest({
                session,
                host,
                expected: openFiles.map(file => ({ file, syntax: [], semantic: [], suggestion: [] })),
                existingTimeouts: 2
            });
        }
    });
    it("Correct errors when resolution resolves to file that has same ambient module and is also module", () => {
        const projectRootPath = "/users/username/projects/myproject";
        const aFile: ts.projectSystem.File = {
            path: `${projectRootPath}/src/a.ts`,
            content: `import * as myModule from "@custom/plugin";
function foo() {
  // hello
}`
        };
        const config: ts.projectSystem.File = {
            path: `${projectRootPath}/tsconfig.json`,
            content: JSON.stringify({ include: ["src"] })
        };
        const plugin: ts.projectSystem.File = {
            path: `${projectRootPath}/node_modules/@custom/plugin/index.d.ts`,
            content: `import './proposed';
declare module '@custom/plugin' {
    export const version: string;
}`
        };
        const pluginProposed: ts.projectSystem.File = {
            path: `${projectRootPath}/node_modules/@custom/plugin/proposed.d.ts`,
            content: `declare module '@custom/plugin' {
    export const bar = 10;
}`
        };
        const files = [ts.projectSystem.libFile, aFile, config, plugin, pluginProposed];
        const host = ts.projectSystem.createServerHost(files);
        const session = ts.projectSystem.createSession(host, { canUseEvents: true });
        const service = session.getProjectService();
        ts.projectSystem.openFilesForSession([aFile], session);
        ts.projectSystem.checkNumberOfProjects(service, { configuredProjects: 1 });
        session.clearMessages();
        checkErrors();
        session.executeCommandSeq<ts.projectSystem.protocol.ChangeRequest>({
            command: ts.projectSystem.protocol.CommandTypes.Change,
            arguments: {
                file: aFile.path,
                line: 3,
                offset: 8,
                endLine: 3,
                endOffset: 8,
                insertString: "o"
            }
        });
        checkErrors();
        function checkErrors() {
            host.checkTimeoutQueueLength(0);
            ts.projectSystem.verifyGetErrRequest({
                session,
                host,
                expected: [{
                        file: aFile,
                        syntax: [],
                        semantic: [],
                        suggestion: [
                            ts.projectSystem.createDiagnostic({ line: 1, offset: 1 }, { line: 1, offset: 44 }, ts.Diagnostics._0_is_declared_but_its_value_is_never_read, ["myModule"], "suggestion", /*reportsUnnecessary*/ true),
                            ts.projectSystem.createDiagnostic({ line: 2, offset: 10 }, { line: 2, offset: 13 }, ts.Diagnostics._0_is_declared_but_its_value_is_never_read, ["foo"], "suggestion", /*reportsUnnecessary*/ true)
                        ]
                    }]
            });
        }
    });
});
describe("unittests:: tsserver:: Project Errors for Configure file diagnostics events", () => {
    function getUnknownCompilerOptionDiagnostic(configFile: ts.projectSystem.File, prop: string, didYouMean?: string): ts.projectSystem.ConfigFileDiagnostic {
        const d = didYouMean ? ts.Diagnostics.Unknown_compiler_option_0_Did_you_mean_1 : ts.Diagnostics.Unknown_compiler_option_0;
        const start = configFile.content.indexOf(prop) - 1; // start at "prop"
        return {
            fileName: configFile.path,
            start,
            length: prop.length + 2,
            messageText: ts.formatStringFromArgs(d.message, didYouMean ? [prop, didYouMean] : [prop]),
            category: d.category,
            code: d.code,
            reportsUnnecessary: undefined
        };
    }
    function getFileNotFoundDiagnostic(configFile: ts.projectSystem.File, relativeFileName: string): ts.projectSystem.ConfigFileDiagnostic {
        const findString = `{"path":"./${relativeFileName}"}`;
        const d = ts.Diagnostics.File_0_not_found;
        const start = configFile.content.indexOf(findString);
        return {
            fileName: configFile.path,
            start,
            length: findString.length,
            messageText: ts.formatStringFromArgs(d.message, [`${ts.getDirectoryPath(configFile.path)}/${relativeFileName}`]),
            category: d.category,
            code: d.code,
            reportsUnnecessary: undefined
        };
    }
    it("are generated when the config file has errors", () => {
        const file: ts.projectSystem.File = {
            path: "/a/b/app.ts",
            content: "let x = 10"
        };
        const configFile: ts.projectSystem.File = {
            path: "/a/b/tsconfig.json",
            content: `{
                    "compilerOptions": {
                        "foo": "bar",
                        "allowJS": true
                    }
                }`
        };
        const serverEventManager = new ts.projectSystem.TestServerEventManager([file, ts.projectSystem.libFile, configFile]);
        ts.projectSystem.openFilesForSession([file], serverEventManager.session);
        serverEventManager.checkSingleConfigFileDiagEvent(configFile.path, file.path, [
            getUnknownCompilerOptionDiagnostic(configFile, "foo"),
            getUnknownCompilerOptionDiagnostic(configFile, "allowJS", "allowJs")
        ]);
    });
    it("are generated when the config file doesn't have errors", () => {
        const file: ts.projectSystem.File = {
            path: "/a/b/app.ts",
            content: "let x = 10"
        };
        const configFile: ts.projectSystem.File = {
            path: "/a/b/tsconfig.json",
            content: `{
                    "compilerOptions": {}
                }`
        };
        const serverEventManager = new ts.projectSystem.TestServerEventManager([file, ts.projectSystem.libFile, configFile]);
        ts.projectSystem.openFilesForSession([file], serverEventManager.session);
        serverEventManager.checkSingleConfigFileDiagEvent(configFile.path, file.path, ts.emptyArray);
    });
    it("are generated when the config file changes", () => {
        const file: ts.projectSystem.File = {
            path: "/a/b/app.ts",
            content: "let x = 10"
        };
        const configFile = {
            path: "/a/b/tsconfig.json",
            content: `{
                    "compilerOptions": {}
                }`
        };
        const files = [file, ts.projectSystem.libFile, configFile];
        const serverEventManager = new ts.projectSystem.TestServerEventManager(files);
        ts.projectSystem.openFilesForSession([file], serverEventManager.session);
        serverEventManager.checkSingleConfigFileDiagEvent(configFile.path, file.path, ts.emptyArray);
        configFile.content = `{
                "compilerOptions": {
                    "haha": 123
                }
            }`;
        serverEventManager.host.reloadFS(files);
        serverEventManager.host.runQueuedTimeoutCallbacks();
        serverEventManager.checkSingleConfigFileDiagEvent(configFile.path, configFile.path, [
            getUnknownCompilerOptionDiagnostic(configFile, "haha")
        ]);
        configFile.content = `{
                "compilerOptions": {}
            }`;
        serverEventManager.host.reloadFS(files);
        serverEventManager.host.runQueuedTimeoutCallbacks();
        serverEventManager.checkSingleConfigFileDiagEvent(configFile.path, configFile.path, ts.emptyArray);
    });
    it("are not generated when the config file does not include file opened and config file has errors", () => {
        const file: ts.projectSystem.File = {
            path: "/a/b/app.ts",
            content: "let x = 10"
        };
        const file2: ts.projectSystem.File = {
            path: "/a/b/test.ts",
            content: "let x = 10"
        };
        const configFile: ts.projectSystem.File = {
            path: "/a/b/tsconfig.json",
            content: `{
                    "compilerOptions": {
                        "foo": "bar",
                        "allowJS": true
                    },
                    "files": ["app.ts"]
                }`
        };
        const serverEventManager = new ts.projectSystem.TestServerEventManager([file, file2, ts.projectSystem.libFile, configFile]);
        ts.projectSystem.openFilesForSession([file2], serverEventManager.session);
        serverEventManager.hasZeroEvent("configFileDiag");
    });
    it("are not generated when the config file has errors but suppressDiagnosticEvents is true", () => {
        const file: ts.projectSystem.File = {
            path: "/a/b/app.ts",
            content: "let x = 10"
        };
        const configFile: ts.projectSystem.File = {
            path: "/a/b/tsconfig.json",
            content: `{
                    "compilerOptions": {
                        "foo": "bar",
                        "allowJS": true
                    }
                }`
        };
        const serverEventManager = new ts.projectSystem.TestServerEventManager([file, ts.projectSystem.libFile, configFile], /*suppressDiagnosticEvents*/ true);
        ts.projectSystem.openFilesForSession([file], serverEventManager.session);
        serverEventManager.hasZeroEvent("configFileDiag");
    });
    it("are not generated when the config file does not include file opened and doesnt contain any errors", () => {
        const file: ts.projectSystem.File = {
            path: "/a/b/app.ts",
            content: "let x = 10"
        };
        const file2: ts.projectSystem.File = {
            path: "/a/b/test.ts",
            content: "let x = 10"
        };
        const configFile: ts.projectSystem.File = {
            path: "/a/b/tsconfig.json",
            content: `{
                    "files": ["app.ts"]
                }`
        };
        const serverEventManager = new ts.projectSystem.TestServerEventManager([file, file2, ts.projectSystem.libFile, configFile]);
        ts.projectSystem.openFilesForSession([file2], serverEventManager.session);
        serverEventManager.hasZeroEvent("configFileDiag");
    });
    it("contains the project reference errors", () => {
        const file: ts.projectSystem.File = {
            path: "/a/b/app.ts",
            content: "let x = 10"
        };
        const noSuchTsconfig = "no-such-tsconfig.json";
        const configFile: ts.projectSystem.File = {
            path: "/a/b/tsconfig.json",
            content: `{
                    "files": ["app.ts"],
                    "references": [{"path":"./${noSuchTsconfig}"}]
                }`
        };
        const serverEventManager = new ts.projectSystem.TestServerEventManager([file, ts.projectSystem.libFile, configFile]);
        ts.projectSystem.openFilesForSession([file], serverEventManager.session);
        serverEventManager.checkSingleConfigFileDiagEvent(configFile.path, file.path, [
            getFileNotFoundDiagnostic(configFile, noSuchTsconfig)
        ]);
    });
});
describe("unittests:: tsserver:: Project Errors dont include overwrite emit error", () => {
    it("for inferred project", () => {
        const f1 = {
            path: "/a/b/f1.js",
            content: "function test1() { }"
        };
        const host = ts.projectSystem.createServerHost([f1, ts.projectSystem.libFile]);
        const session = ts.projectSystem.createSession(host);
        ts.projectSystem.openFilesForSession([f1], session);
        const projectService = session.getProjectService();
        ts.projectSystem.checkNumberOfProjects(projectService, { inferredProjects: 1 });
        const projectName = projectService.inferredProjects[0].getProjectName();
        const diags = (session.executeCommand((<ts.server.protocol.CompilerOptionsDiagnosticsRequest>{
            type: "request",
            command: ts.server.CommandNames.CompilerOptionsDiagnosticsFull,
            seq: 2,
            arguments: { projectFileName: projectName }
        })).response as readonly ts.projectSystem.protocol.DiagnosticWithLinePosition[]);
        assert.isTrue(diags.length === 0);
        session.executeCommand((<ts.server.protocol.SetCompilerOptionsForInferredProjectsRequest>{
            type: "request",
            command: ts.server.CommandNames.CompilerOptionsForInferredProjects,
            seq: 3,
            arguments: { options: { module: ts.ModuleKind.CommonJS } }
        }));
        const diagsAfterUpdate = (session.executeCommand((<ts.server.protocol.CompilerOptionsDiagnosticsRequest>{
            type: "request",
            command: ts.server.CommandNames.CompilerOptionsDiagnosticsFull,
            seq: 4,
            arguments: { projectFileName: projectName }
        })).response as readonly ts.projectSystem.protocol.DiagnosticWithLinePosition[]);
        assert.isTrue(diagsAfterUpdate.length === 0);
    });
    it("for external project", () => {
        const f1 = {
            path: "/a/b/f1.js",
            content: "function test1() { }"
        };
        const host = ts.projectSystem.createServerHost([f1, ts.projectSystem.libFile]);
        const session = ts.projectSystem.createSession(host);
        const projectService = session.getProjectService();
        const projectFileName = "/a/b/project.csproj";
        const externalFiles = ts.projectSystem.toExternalFiles([f1.path]);
        projectService.openExternalProject((<ts.projectSystem.protocol.ExternalProject>{
            projectFileName,
            rootFiles: externalFiles,
            options: {}
        }));
        ts.projectSystem.checkNumberOfProjects(projectService, { externalProjects: 1 });
        const diags = (session.executeCommand((<ts.server.protocol.CompilerOptionsDiagnosticsRequest>{
            type: "request",
            command: ts.server.CommandNames.CompilerOptionsDiagnosticsFull,
            seq: 2,
            arguments: { projectFileName }
        })).response as readonly ts.server.protocol.DiagnosticWithLinePosition[]);
        assert.isTrue(diags.length === 0);
        session.executeCommand((<ts.server.protocol.OpenExternalProjectRequest>{
            type: "request",
            command: ts.server.CommandNames.OpenExternalProject,
            seq: 3,
            arguments: {
                projectFileName,
                rootFiles: externalFiles,
                options: { module: ts.ModuleKind.CommonJS }
            }
        }));
        const diagsAfterUpdate = (session.executeCommand((<ts.server.protocol.CompilerOptionsDiagnosticsRequest>{
            type: "request",
            command: ts.server.CommandNames.CompilerOptionsDiagnosticsFull,
            seq: 4,
            arguments: { projectFileName }
        })).response as readonly ts.server.protocol.DiagnosticWithLinePosition[]);
        assert.isTrue(diagsAfterUpdate.length === 0);
    });
});
describe("unittests:: tsserver:: Project Errors reports Options Diagnostic locations correctly with changes in configFile contents", () => {
    it("when options change", () => {
        const file = {
            path: "/a/b/app.ts",
            content: "let x = 10"
        };
        const configFileContentBeforeComment = `{`;
        const configFileContentComment = `
                // comment`;
        const configFileContentAfterComment = `
                "compilerOptions": {
                    "inlineSourceMap": true,
                    "mapRoot": "./"
                }
            }`;
        const configFileContentWithComment = configFileContentBeforeComment + configFileContentComment + configFileContentAfterComment;
        const configFileContentWithoutCommentLine = configFileContentBeforeComment + configFileContentAfterComment;
        const configFile = {
            path: "/a/b/tsconfig.json",
            content: configFileContentWithComment
        };
        const host = ts.projectSystem.createServerHost([file, ts.projectSystem.libFile, configFile]);
        const session = ts.projectSystem.createSession(host);
        ts.projectSystem.openFilesForSession([file], session);
        const projectService = session.getProjectService();
        ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1 });
        const projectName = ts.projectSystem.configuredProjectAt(projectService, 0).getProjectName();
        const diags = (session.executeCommand((<ts.server.protocol.SemanticDiagnosticsSyncRequest>{
            type: "request",
            command: ts.server.CommandNames.SemanticDiagnosticsSync,
            seq: 2,
            arguments: { file: configFile.path, projectFileName: projectName, includeLinePosition: true }
        })).response as readonly ts.server.protocol.DiagnosticWithLinePosition[]);
        assert.isTrue(diags.length === 3);
        configFile.content = configFileContentWithoutCommentLine;
        host.reloadFS([file, configFile]);
        const diagsAfterEdit = (session.executeCommand((<ts.server.protocol.SemanticDiagnosticsSyncRequest>{
            type: "request",
            command: ts.server.CommandNames.SemanticDiagnosticsSync,
            seq: 2,
            arguments: { file: configFile.path, projectFileName: projectName, includeLinePosition: true }
        })).response as readonly ts.server.protocol.DiagnosticWithLinePosition[]);
        assert.isTrue(diagsAfterEdit.length === 3);
        verifyDiagnostic(diags[0], diagsAfterEdit[0]);
        verifyDiagnostic(diags[1], diagsAfterEdit[1]);
        verifyDiagnostic(diags[2], diagsAfterEdit[2]);
        function verifyDiagnostic(beforeEditDiag: ts.server.protocol.DiagnosticWithLinePosition, afterEditDiag: ts.server.protocol.DiagnosticWithLinePosition) {
            assert.equal(beforeEditDiag.message, afterEditDiag.message);
            assert.equal(beforeEditDiag.code, afterEditDiag.code);
            assert.equal(beforeEditDiag.category, afterEditDiag.category);
            assert.equal(beforeEditDiag.startLocation.line, afterEditDiag.startLocation.line + 1);
            assert.equal(beforeEditDiag.startLocation.offset, afterEditDiag.startLocation.offset);
            assert.equal(beforeEditDiag.endLocation.line, afterEditDiag.endLocation.line + 1);
            assert.equal(beforeEditDiag.endLocation.offset, afterEditDiag.endLocation.offset);
        }
    });
});
describe("unittests:: tsserver:: Project Errors with config file change", () => {
    it("Updates diagnostics when '--noUnusedLabels' changes", () => {
        const aTs: ts.projectSystem.File = { path: "/a.ts", content: "label: while (1) {}" };
        const options = (allowUnusedLabels: boolean) => `{ "compilerOptions": { "allowUnusedLabels": ${allowUnusedLabels} } }`;
        const tsconfig: ts.projectSystem.File = { path: "/tsconfig.json", content: options(/*allowUnusedLabels*/ true) };
        const host = ts.projectSystem.createServerHost([aTs, tsconfig]);
        const session = ts.projectSystem.createSession(host);
        ts.projectSystem.openFilesForSession([aTs], session);
        host.modifyFile(tsconfig.path, options(/*allowUnusedLabels*/ false));
        host.runQueuedTimeoutCallbacks();
        const response = (ts.projectSystem.executeSessionRequest<ts.projectSystem.protocol.SemanticDiagnosticsSyncRequest, ts.projectSystem.protocol.SemanticDiagnosticsSyncResponse>(session, ts.projectSystem.protocol.CommandTypes.SemanticDiagnosticsSync, { file: aTs.path }) as ts.projectSystem.protocol.Diagnostic[] | undefined);
        assert.deepEqual<ts.projectSystem.protocol.Diagnostic[] | undefined>(response, [
            {
                start: { line: 1, offset: 1 },
                end: { line: 1, offset: 1 + "label".length },
                text: "Unused label.",
                category: "error",
                code: ts.Diagnostics.Unused_label.code,
                relatedInformation: undefined,
                reportsUnnecessary: true,
                source: undefined,
            },
        ]);
    });
});
describe("unittests:: tsserver:: Project Errors with resolveJsonModule", () => {
    function createSessionForTest({ include }: {
        include: readonly string[];
    }) {
        const test: ts.projectSystem.File = {
            path: `${ts.tscWatch.projectRoot}/src/test.ts`,
            content: `import * as blabla from "./blabla.json";
declare var console: any;
console.log(blabla);`
        };
        const blabla: ts.projectSystem.File = {
            path: `${ts.tscWatch.projectRoot}/src/blabla.json`,
            content: "{}"
        };
        const tsconfig: ts.projectSystem.File = {
            path: `${ts.tscWatch.projectRoot}/tsconfig.json`,
            content: JSON.stringify({
                compilerOptions: {
                    resolveJsonModule: true,
                    composite: true
                },
                include
            })
        };
        const host = ts.projectSystem.createServerHost([test, blabla, ts.projectSystem.libFile, tsconfig]);
        const session = ts.projectSystem.createSession(host, { canUseEvents: true });
        ts.projectSystem.openFilesForSession([test], session);
        return { host, session, test, blabla, tsconfig };
    }
    it("should not report incorrect error when json is root file found by tsconfig", () => {
        const { host, session, test } = createSessionForTest({
            include: ["./src/*.ts", "./src/*.json"]
        });
        ts.projectSystem.verifyGetErrRequest({
            session,
            host,
            expected: [
                {
                    file: test,
                    syntax: [],
                    semantic: [],
                    suggestion: []
                }
            ]
        });
    });
    it("should report error when json is not root file found by tsconfig", () => {
        const { host, session, test, blabla, tsconfig } = createSessionForTest({
            include: ["./src/*.ts"]
        });
        const span = ts.projectSystem.protocolTextSpanFromSubstring(test.content, `"./blabla.json"`);
        ts.projectSystem.verifyGetErrRequest({
            session,
            host,
            expected: [{
                    file: test,
                    syntax: [],
                    semantic: [
                        ts.projectSystem.createDiagnostic(span.start, span.end, ts.Diagnostics.File_0_is_not_listed_within_the_file_list_of_project_1_Projects_must_list_all_files_or_use_an_include_pattern, [blabla.path, tsconfig.path])
                    ],
                    suggestion: []
                }]
        });
    });
});
