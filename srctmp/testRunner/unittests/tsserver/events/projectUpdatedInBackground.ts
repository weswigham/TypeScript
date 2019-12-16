import * as ts from "../../../ts";
describe("unittests:: tsserver:: events:: ProjectsUpdatedInBackground", () => {
    function verifyFiles(caption: string, actual: readonly string[], expected: readonly string[]) {
        assert.equal(actual.length, expected.length, `Incorrect number of ${caption}. Actual: ${actual} Expected: ${expected}`);
        const seen = ts.createMap<true>();
        ts.forEach(actual, f => {
            assert.isFalse(seen.has(f), `${caption}: Found duplicate ${f}. Actual: ${actual} Expected: ${expected}`);
            seen.set(f, true);
            assert.isTrue(ts.contains(expected, f), `${caption}: Expected not to contain ${f}. Actual: ${actual} Expected: ${expected}`);
        });
    }
    function createVerifyInitialOpen(session: ts.projectSystem.TestSession, verifyProjectsUpdatedInBackgroundEventHandler: (events: ts.server.ProjectsUpdatedInBackgroundEvent[]) => void) {
        return (file: ts.projectSystem.File) => {
            session.executeCommandSeq((<ts.projectSystem.protocol.OpenRequest>{
                command: ts.server.CommandNames.Open,
                arguments: {
                    file: file.path
                }
            }));
            verifyProjectsUpdatedInBackgroundEventHandler([]);
        };
    }
    interface ProjectsUpdatedInBackgroundEventVerifier {
        session: ts.projectSystem.TestSession;
        verifyProjectsUpdatedInBackgroundEventHandler(events: ts.server.ProjectsUpdatedInBackgroundEvent[]): void;
        verifyInitialOpen(file: ts.projectSystem.File): void;
    }
    function verifyProjectsUpdatedInBackgroundEvent(createSession: (host: ts.projectSystem.TestServerHost) => ProjectsUpdatedInBackgroundEventVerifier) {
        it("when adding new file", () => {
            const commonFile1: ts.projectSystem.File = {
                path: "/a/b/file1.ts",
                content: "export var x = 10;"
            };
            const commonFile2: ts.projectSystem.File = {
                path: "/a/b/file2.ts",
                content: "export var y = 10;"
            };
            const commonFile3: ts.projectSystem.File = {
                path: "/a/b/file3.ts",
                content: "export var z = 10;"
            };
            const configFile: ts.projectSystem.File = {
                path: "/a/b/tsconfig.json",
                content: `{}`
            };
            const openFiles = [commonFile1.path];
            const host = ts.projectSystem.createServerHost([commonFile1, ts.projectSystem.libFile, configFile]);
            const { verifyProjectsUpdatedInBackgroundEventHandler, verifyInitialOpen } = createSession(host);
            verifyInitialOpen(commonFile1);
            host.reloadFS([commonFile1, ts.projectSystem.libFile, configFile, commonFile2]);
            host.runQueuedTimeoutCallbacks();
            verifyProjectsUpdatedInBackgroundEventHandler([{
                    eventName: ts.server.ProjectsUpdatedInBackgroundEvent,
                    data: {
                        openFiles
                    }
                }]);
            host.reloadFS([commonFile1, commonFile2, ts.projectSystem.libFile, configFile, commonFile3]);
            host.runQueuedTimeoutCallbacks();
            verifyProjectsUpdatedInBackgroundEventHandler([{
                    eventName: ts.server.ProjectsUpdatedInBackgroundEvent,
                    data: {
                        openFiles
                    }
                }]);
        });
        describe("with --out or --outFile setting", () => {
            function verifyEventWithOutSettings(compilerOptions: ts.CompilerOptions = {}) {
                const config: ts.projectSystem.File = {
                    path: "/a/tsconfig.json",
                    content: JSON.stringify({
                        compilerOptions
                    })
                };
                const f1: ts.projectSystem.File = {
                    path: "/a/a.ts",
                    content: "export let x = 1"
                };
                const f2: ts.projectSystem.File = {
                    path: "/a/b.ts",
                    content: "export let y = 1"
                };
                const openFiles = [f1.path];
                const files = [f1, config, ts.projectSystem.libFile];
                const host = ts.projectSystem.createServerHost(files);
                const { verifyInitialOpen, verifyProjectsUpdatedInBackgroundEventHandler } = createSession(host);
                verifyInitialOpen(f1);
                files.push(f2);
                host.reloadFS(files);
                host.runQueuedTimeoutCallbacks();
                verifyProjectsUpdatedInBackgroundEventHandler([{
                        eventName: ts.server.ProjectsUpdatedInBackgroundEvent,
                        data: {
                            openFiles
                        }
                    }]);
                f2.content = "export let x = 11";
                host.reloadFS(files);
                host.runQueuedTimeoutCallbacks();
                verifyProjectsUpdatedInBackgroundEventHandler([{
                        eventName: ts.server.ProjectsUpdatedInBackgroundEvent,
                        data: {
                            openFiles
                        }
                    }]);
            }
            it("when both options are not set", () => {
                verifyEventWithOutSettings();
            });
            it("when --out is set", () => {
                const outJs = "/a/out.js";
                verifyEventWithOutSettings({ out: outJs });
            });
            it("when --outFile is set", () => {
                const outJs = "/a/out.js";
                verifyEventWithOutSettings({ outFile: outJs });
            });
        });
        describe("with modules and configured project", () => {
            const file1Consumer1Path = "/a/b/file1Consumer1.ts";
            const moduleFile1Path = "/a/b/moduleFile1.ts";
            const configFilePath = "/a/b/tsconfig.json";
            interface InitialStateParams {
                /** custom config file options */
                configObj?: any;
                /** Additional files and folders to add */
                getAdditionalFileOrFolder?(): ts.projectSystem.File[];
                /** initial list of files to reload in fs and first file in this list being the file to open */
                firstReloadFileList?: string[];
            }
            function getInitialState({ configObj = {}, getAdditionalFileOrFolder, firstReloadFileList }: InitialStateParams = {}) {
                const moduleFile1: ts.projectSystem.File = {
                    path: moduleFile1Path,
                    content: "export function Foo() { };",
                };
                const file1Consumer1: ts.projectSystem.File = {
                    path: file1Consumer1Path,
                    content: `import {Foo} from "./moduleFile1"; export var y = 10;`,
                };
                const file1Consumer2: ts.projectSystem.File = {
                    path: "/a/b/file1Consumer2.ts",
                    content: `import {Foo} from "./moduleFile1"; let z = 10;`,
                };
                const moduleFile2: ts.projectSystem.File = {
                    path: "/a/b/moduleFile2.ts",
                    content: `export var Foo4 = 10;`,
                };
                const globalFile3: ts.projectSystem.File = {
                    path: "/a/b/globalFile3.ts",
                    content: `interface GlobalFoo { age: number }`
                };
                const additionalFiles = getAdditionalFileOrFolder ? getAdditionalFileOrFolder() : [];
                const configFile = {
                    path: configFilePath,
                    content: JSON.stringify(configObj || { compilerOptions: {} })
                };
                const files: ts.projectSystem.File[] = [file1Consumer1, moduleFile1, file1Consumer2, moduleFile2, ...additionalFiles, globalFile3, ts.projectSystem.libFile, configFile];
                const filesToReload = firstReloadFileList && getFiles(firstReloadFileList) || files;
                const host = ts.projectSystem.createServerHost([filesToReload[0], configFile]);
                // Initial project creation
                const { session, verifyProjectsUpdatedInBackgroundEventHandler, verifyInitialOpen } = createSession(host);
                const openFiles = [filesToReload[0].path];
                verifyInitialOpen(filesToReload[0]);
                // Since this is first event, it will have all the files
                verifyProjectsUpdatedInBackgroundEvent(filesToReload);
                return {
                    moduleFile1, file1Consumer1, file1Consumer2, moduleFile2, globalFile3, configFile,
                    files,
                    updateContentOfOpenFile,
                    verifyNoProjectsUpdatedInBackgroundEvent,
                    verifyProjectsUpdatedInBackgroundEvent
                };
                function getFiles(filelist: string[]) {
                    return ts.map(filelist, getFile);
                }
                function getFile(fileName: string) {
                    return ts.find(files, file => file.path === fileName)!;
                }
                function verifyNoProjectsUpdatedInBackgroundEvent(filesToReload?: ts.projectSystem.File[]) {
                    host.reloadFS(filesToReload || files);
                    host.runQueuedTimeoutCallbacks();
                    verifyProjectsUpdatedInBackgroundEventHandler([]);
                }
                function verifyProjectsUpdatedInBackgroundEvent(filesToReload?: ts.projectSystem.File[]) {
                    host.reloadFS(filesToReload || files);
                    host.runQueuedTimeoutCallbacks();
                    verifyProjectsUpdatedInBackgroundEventHandler([{
                            eventName: ts.server.ProjectsUpdatedInBackgroundEvent,
                            data: {
                                openFiles
                            }
                        }]);
                }
                function updateContentOfOpenFile(file: ts.projectSystem.File, newContent: string) {
                    session.executeCommandSeq<ts.projectSystem.protocol.ChangeRequest>({
                        command: ts.server.CommandNames.Change,
                        arguments: {
                            file: file.path,
                            insertString: newContent,
                            endLine: 1,
                            endOffset: file.content.length,
                            line: 1,
                            offset: 1
                        }
                    });
                    file.content = newContent;
                }
            }
            it("should contains only itself if a module file's shape didn't change, and all files referencing it if its shape changed", () => {
                const { moduleFile1, verifyProjectsUpdatedInBackgroundEvent } = getInitialState();
                // Change the content of moduleFile1 to `export var T: number;export function Foo() { };`
                moduleFile1.content = `export var T: number;export function Foo() { };`;
                verifyProjectsUpdatedInBackgroundEvent();
                // Change the content of moduleFile1 to `export var T: number;export function Foo() { console.log('hi'); };`
                moduleFile1.content = `export var T: number;export function Foo() { console.log('hi'); };`;
                verifyProjectsUpdatedInBackgroundEvent();
            });
            it("should be up-to-date with the reference map changes", () => {
                const { moduleFile1, file1Consumer1, updateContentOfOpenFile, verifyProjectsUpdatedInBackgroundEvent, verifyNoProjectsUpdatedInBackgroundEvent } = getInitialState();
                // Change file1Consumer1 content to `export let y = Foo();`
                updateContentOfOpenFile(file1Consumer1, "export let y = Foo();");
                verifyNoProjectsUpdatedInBackgroundEvent();
                // Change the content of moduleFile1 to `export var T: number;export function Foo() { };`
                moduleFile1.content = `export var T: number;export function Foo() { };`;
                verifyProjectsUpdatedInBackgroundEvent();
                // Add the import statements back to file1Consumer1
                updateContentOfOpenFile(file1Consumer1, `import {Foo} from "./moduleFile1";let y = Foo();`);
                verifyNoProjectsUpdatedInBackgroundEvent();
                // Change the content of moduleFile1 to `export var T: number;export var T2: string;export function Foo() { };`
                moduleFile1.content = `export var T: number;export var T2: string;export function Foo() { };`;
                verifyProjectsUpdatedInBackgroundEvent();
                // Multiple file edits in one go:
                // Change file1Consumer1 content to `export let y = Foo();`
                // Change the content of moduleFile1 to `export var T: number;export function Foo() { };`
                updateContentOfOpenFile(file1Consumer1, `export let y = Foo();`);
                moduleFile1.content = `export var T: number;export function Foo() { };`;
                verifyProjectsUpdatedInBackgroundEvent();
            });
            it("should be up-to-date with deleted files", () => {
                const { moduleFile1, file1Consumer2, files, verifyProjectsUpdatedInBackgroundEvent } = getInitialState();
                // Change the content of moduleFile1 to `export var T: number;export function Foo() { };`
                moduleFile1.content = `export var T: number;export function Foo() { };`;
                // Delete file1Consumer2
                const filesToLoad = ts.filter(files, file => file !== file1Consumer2);
                verifyProjectsUpdatedInBackgroundEvent(filesToLoad);
            });
            it("should be up-to-date with newly created files", () => {
                const { moduleFile1, files, verifyProjectsUpdatedInBackgroundEvent, } = getInitialState();
                const file1Consumer3: ts.projectSystem.File = {
                    path: "/a/b/file1Consumer3.ts",
                    content: `import {Foo} from "./moduleFile1"; let y = Foo();`
                };
                moduleFile1.content = `export var T: number;export function Foo() { };`;
                verifyProjectsUpdatedInBackgroundEvent(files.concat(file1Consumer3));
            });
            it("should detect changes in non-root files", () => {
                const { moduleFile1, verifyProjectsUpdatedInBackgroundEvent } = getInitialState({
                    configObj: { files: [file1Consumer1Path] },
                });
                moduleFile1.content = `export var T: number;export function Foo() { };`;
                verifyProjectsUpdatedInBackgroundEvent();
                // change file1 internal, and verify only file1 is affected
                moduleFile1.content += "var T1: number;";
                verifyProjectsUpdatedInBackgroundEvent();
            });
            it("should return all files if a global file changed shape", () => {
                const { globalFile3, verifyProjectsUpdatedInBackgroundEvent } = getInitialState();
                globalFile3.content += "var T2: string;";
                verifyProjectsUpdatedInBackgroundEvent();
            });
            it("should always return the file itself if '--isolatedModules' is specified", () => {
                const { moduleFile1, verifyProjectsUpdatedInBackgroundEvent } = getInitialState({
                    configObj: { compilerOptions: { isolatedModules: true } }
                });
                moduleFile1.content = `export var T: number;export function Foo() { };`;
                verifyProjectsUpdatedInBackgroundEvent();
            });
            it("should always return the file itself if '--out' or '--outFile' is specified", () => {
                const outFilePath = "/a/b/out.js";
                const { moduleFile1, verifyProjectsUpdatedInBackgroundEvent } = getInitialState({
                    configObj: { compilerOptions: { module: "system", outFile: outFilePath } }
                });
                moduleFile1.content = `export var T: number;export function Foo() { };`;
                verifyProjectsUpdatedInBackgroundEvent();
            });
            it("should return cascaded affected file list", () => {
                const file1Consumer1Consumer1: ts.projectSystem.File = {
                    path: "/a/b/file1Consumer1Consumer1.ts",
                    content: `import {y} from "./file1Consumer1";`
                };
                const { moduleFile1, file1Consumer1, updateContentOfOpenFile, verifyNoProjectsUpdatedInBackgroundEvent, verifyProjectsUpdatedInBackgroundEvent } = getInitialState({
                    getAdditionalFileOrFolder: () => [file1Consumer1Consumer1]
                });
                updateContentOfOpenFile(file1Consumer1, file1Consumer1.content + "export var T: number;");
                verifyNoProjectsUpdatedInBackgroundEvent();
                // Doesnt change the shape of file1Consumer1
                moduleFile1.content = `export var T: number;export function Foo() { };`;
                verifyProjectsUpdatedInBackgroundEvent();
                // Change both files before the timeout
                updateContentOfOpenFile(file1Consumer1, file1Consumer1.content + "export var T2: number;");
                moduleFile1.content = `export var T2: number;export function Foo() { };`;
                verifyProjectsUpdatedInBackgroundEvent();
            });
            it("should work fine for files with circular references", () => {
                const file1: ts.projectSystem.File = {
                    path: "/a/b/file1.ts",
                    content: `
                    /// <reference path="./file2.ts" />
                    export var t1 = 10;`
                };
                const file2: ts.projectSystem.File = {
                    path: "/a/b/file2.ts",
                    content: `
                    /// <reference path="./file1.ts" />
                    export var t2 = 10;`
                };
                const { configFile, verifyProjectsUpdatedInBackgroundEvent } = getInitialState({
                    getAdditionalFileOrFolder: () => [file1, file2],
                    firstReloadFileList: [file1.path, ts.projectSystem.libFile.path, file2.path, configFilePath]
                });
                file2.content += "export var t3 = 10;";
                verifyProjectsUpdatedInBackgroundEvent([file1, file2, ts.projectSystem.libFile, configFile]);
            });
            it("should detect removed code file", () => {
                const referenceFile1: ts.projectSystem.File = {
                    path: "/a/b/referenceFile1.ts",
                    content: `
                    /// <reference path="./moduleFile1.ts" />
                    export var x = Foo();`
                };
                const { configFile, verifyProjectsUpdatedInBackgroundEvent } = getInitialState({
                    getAdditionalFileOrFolder: () => [referenceFile1],
                    firstReloadFileList: [referenceFile1.path, ts.projectSystem.libFile.path, moduleFile1Path, configFilePath]
                });
                verifyProjectsUpdatedInBackgroundEvent([ts.projectSystem.libFile, referenceFile1, configFile]);
            });
            it("should detect non-existing code file", () => {
                const referenceFile1: ts.projectSystem.File = {
                    path: "/a/b/referenceFile1.ts",
                    content: `
                    /// <reference path="./moduleFile2.ts" />
                    export var x = Foo();`
                };
                const { configFile, moduleFile2, updateContentOfOpenFile, verifyNoProjectsUpdatedInBackgroundEvent, verifyProjectsUpdatedInBackgroundEvent } = getInitialState({
                    getAdditionalFileOrFolder: () => [referenceFile1],
                    firstReloadFileList: [referenceFile1.path, ts.projectSystem.libFile.path, configFilePath]
                });
                updateContentOfOpenFile(referenceFile1, referenceFile1.content + "export var yy = Foo();");
                verifyNoProjectsUpdatedInBackgroundEvent([ts.projectSystem.libFile, referenceFile1, configFile]);
                // Create module File2 and see both files are saved
                verifyProjectsUpdatedInBackgroundEvent([ts.projectSystem.libFile, moduleFile2, referenceFile1, configFile]);
            });
        });
        describe("resolution when resolution cache size", () => {
            function verifyWithMaxCacheLimit(limitHit: boolean, useSlashRootAsSomeNotRootFolderInUserDirectory: boolean) {
                const rootFolder = useSlashRootAsSomeNotRootFolderInUserDirectory ? "/user/username/rootfolder/otherfolder/" : "/";
                const file1: ts.projectSystem.File = {
                    path: rootFolder + "a/b/project/file1.ts",
                    content: 'import a from "file2"'
                };
                const file2: ts.projectSystem.File = {
                    path: rootFolder + "a/b/node_modules/file2.d.ts",
                    content: "export class a { }"
                };
                const file3: ts.projectSystem.File = {
                    path: rootFolder + "a/b/project/file3.ts",
                    content: "export class c { }"
                };
                const configFile: ts.projectSystem.File = {
                    path: rootFolder + "a/b/project/tsconfig.json",
                    content: JSON.stringify({ compilerOptions: { typeRoots: [] } })
                };
                const projectFiles = [file1, file3, ts.projectSystem.libFile, configFile];
                const openFiles = [file1.path];
                const watchedRecursiveDirectories = useSlashRootAsSomeNotRootFolderInUserDirectory ?
                    // Folders of node_modules lookup not in changedRoot
                    ["a/b/project", "a/b/project/node_modules", "a/b/node_modules", "a/node_modules", "node_modules"].map(v => rootFolder + v) :
                    // Folder of tsconfig
                    ["/a/b/project", "/a/b/project/node_modules"];
                const host = ts.projectSystem.createServerHost(projectFiles);
                const { session, verifyInitialOpen, verifyProjectsUpdatedInBackgroundEventHandler } = createSession(host);
                const projectService = session.getProjectService();
                verifyInitialOpen(file1);
                ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1 });
                const project = projectService.configuredProjects.get(configFile.path)!;
                verifyProject();
                if (limitHit) {
                    (project as ts.ResolutionCacheHost).maxNumberOfFilesToIterateForInvalidation = 1;
                }
                file3.content += "export class d {}";
                host.reloadFS(projectFiles);
                host.checkTimeoutQueueLengthAndRun(2);
                // Since this is first event
                verifyProject();
                verifyProjectsUpdatedInBackgroundEventHandler([{
                        eventName: ts.server.ProjectsUpdatedInBackgroundEvent,
                        data: {
                            openFiles
                        }
                    }]);
                projectFiles.push(file2);
                host.reloadFS(projectFiles);
                host.runQueuedTimeoutCallbacks();
                if (useSlashRootAsSomeNotRootFolderInUserDirectory) {
                    watchedRecursiveDirectories.length = 3;
                }
                else {
                    // file2 addition wont be detected
                    projectFiles.pop();
                    assert.isTrue(host.fileExists(file2.path));
                }
                verifyProject();
                verifyProjectsUpdatedInBackgroundEventHandler(useSlashRootAsSomeNotRootFolderInUserDirectory ? [{
                        eventName: ts.server.ProjectsUpdatedInBackgroundEvent,
                        data: {
                            openFiles
                        }
                    }] : []);
                function verifyProject() {
                    ts.projectSystem.checkProjectActualFiles(project, ts.map(projectFiles, file => file.path));
                    ts.projectSystem.checkWatchedDirectories(host, [], /*recursive*/ false);
                    ts.projectSystem.checkWatchedDirectories(host, watchedRecursiveDirectories, /*recursive*/ true);
                }
            }
            it("limit not hit and project is not at root level", () => {
                verifyWithMaxCacheLimit(/*limitHit*/ false, /*useSlashRootAsSomeNotRootFolderInUserDirectory*/ true);
            });
            it("limit hit and project is not at root level", () => {
                verifyWithMaxCacheLimit(/*limitHit*/ true, /*useSlashRootAsSomeNotRootFolderInUserDirectory*/ true);
            });
            it("limit not hit and project is at root level", () => {
                verifyWithMaxCacheLimit(/*limitHit*/ false, /*useSlashRootAsSomeNotRootFolderInUserDirectory*/ false);
            });
            it("limit hit and project is at root level", () => {
                verifyWithMaxCacheLimit(/*limitHit*/ true, /*useSlashRootAsSomeNotRootFolderInUserDirectory*/ false);
            });
        });
    }
    describe("when event handler is set in the session", () => {
        verifyProjectsUpdatedInBackgroundEvent(createSessionWithProjectChangedEventHandler);
        function createSessionWithProjectChangedEventHandler(host: ts.projectSystem.TestServerHost): ProjectsUpdatedInBackgroundEventVerifier {
            const { session, events: projectChangedEvents } = ts.projectSystem.createSessionWithEventTracking<ts.server.ProjectsUpdatedInBackgroundEvent>(host, ts.server.ProjectsUpdatedInBackgroundEvent);
            return {
                session,
                verifyProjectsUpdatedInBackgroundEventHandler,
                verifyInitialOpen: createVerifyInitialOpen(session, verifyProjectsUpdatedInBackgroundEventHandler)
            };
            function eventToString(event: ts.server.ProjectsUpdatedInBackgroundEvent) {
                return JSON.stringify(event && { eventName: event.eventName, data: event.data });
            }
            function eventsToString(events: readonly ts.server.ProjectsUpdatedInBackgroundEvent[]) {
                return "[" + ts.map(events, eventToString).join(",") + "]";
            }
            function verifyProjectsUpdatedInBackgroundEventHandler(expectedEvents: readonly ts.server.ProjectsUpdatedInBackgroundEvent[]) {
                assert.equal(projectChangedEvents.length, expectedEvents.length, `Incorrect number of events Actual: ${eventsToString(projectChangedEvents)} Expected: ${eventsToString(expectedEvents)}`);
                ts.forEach(projectChangedEvents, (actualEvent, i) => {
                    const expectedEvent = expectedEvents[i];
                    assert.strictEqual(actualEvent.eventName, expectedEvent.eventName);
                    verifyFiles("openFiles", actualEvent.data.openFiles, expectedEvent.data.openFiles);
                });
                // Verified the events, reset them
                projectChangedEvents.length = 0;
            }
        }
    });
    describe("when event handler is not set but session is created with canUseEvents = true", () => {
        describe("without noGetErrOnBackgroundUpdate, diagnostics for open files are queued", () => {
            verifyProjectsUpdatedInBackgroundEvent(createSessionThatUsesEvents);
        });
        describe("with noGetErrOnBackgroundUpdate, diagnostics for open file are not queued", () => {
            verifyProjectsUpdatedInBackgroundEvent(host => createSessionThatUsesEvents(host, /*noGetErrOnBackgroundUpdate*/ true));
        });
        function createSessionThatUsesEvents(host: ts.projectSystem.TestServerHost, noGetErrOnBackgroundUpdate?: boolean): ProjectsUpdatedInBackgroundEventVerifier {
            const { session, getEvents, clearEvents } = ts.projectSystem.createSessionWithDefaultEventHandler<ts.projectSystem.protocol.ProjectsUpdatedInBackgroundEvent>(host, ts.server.ProjectsUpdatedInBackgroundEvent, { noGetErrOnBackgroundUpdate });
            return {
                session,
                verifyProjectsUpdatedInBackgroundEventHandler,
                verifyInitialOpen: createVerifyInitialOpen(session, verifyProjectsUpdatedInBackgroundEventHandler)
            };
            function verifyProjectsUpdatedInBackgroundEventHandler(expected: readonly ts.server.ProjectsUpdatedInBackgroundEvent[]) {
                const expectedEvents: ts.projectSystem.protocol.ProjectsUpdatedInBackgroundEventBody[] = ts.map(expected, e => {
                    return {
                        openFiles: e.data.openFiles
                    };
                });
                const events = getEvents();
                assert.equal(events.length, expectedEvents.length, `Incorrect number of events Actual: ${ts.map(events, e => e.body)} Expected: ${expectedEvents}`);
                ts.forEach(events, (actualEvent, i) => {
                    const expectedEvent = expectedEvents[i];
                    verifyFiles("openFiles", actualEvent.body.openFiles, expectedEvent.openFiles);
                });
                // Verified the events, reset them
                clearEvents();
                if (events.length) {
                    host.checkTimeoutQueueLength(noGetErrOnBackgroundUpdate ? 0 : 1); // Error checking queued only if not noGetErrOnBackgroundUpdate
                }
            }
        }
    });
});
