import * as ts from "../../ts";
import Tsc_WatchDirectory = ts.TestFSWithWatch.Tsc_WatchDirectory;
describe("unittests:: tsserver:: watchEnvironment:: tsserverProjectSystem watchDirectories implementation", () => {
    function verifyCompletionListWithNewFileInSubFolder(tscWatchDirectory: Tsc_WatchDirectory) {
        const projectFolder = "/a/username/project";
        const projectSrcFolder = `${projectFolder}/src`;
        const configFile: ts.projectSystem.File = {
            path: `${projectFolder}/tsconfig.json`,
            content: JSON.stringify({
                watchOptions: {
                    synchronousWatchDirectory: true
                }
            })
        };
        const index: ts.projectSystem.File = {
            path: `${projectSrcFolder}/index.ts`,
            content: `import {} from "./"`
        };
        const file1: ts.projectSystem.File = {
            path: `${projectSrcFolder}/file1.ts`,
            content: ""
        };
        const files = [index, file1, configFile, ts.projectSystem.libFile];
        const fileNames = files.map(file => file.path);
        // All closed files(files other than index), project folder, project/src folder and project/node_modules/@types folder
        const expectedWatchedFiles = ts.arrayToMap(fileNames.slice(1), s => s, () => 1);
        const expectedWatchedDirectories = ts.createMap<number>();
        const mapOfDirectories = tscWatchDirectory === Tsc_WatchDirectory.NonRecursiveWatchDirectory ?
            expectedWatchedDirectories :
            tscWatchDirectory === Tsc_WatchDirectory.WatchFile ?
                expectedWatchedFiles :
                ts.createMap();
        // For failed resolution lookup and tsconfig files => cached so only watched only once
        mapOfDirectories.set(projectFolder, 1);
        // Through above recursive watches
        mapOfDirectories.set(projectSrcFolder, 1);
        // node_modules/@types folder
        mapOfDirectories.set(`${projectFolder}/${ts.projectSystem.nodeModulesAtTypes}`, 1);
        const expectedCompletions = ["file1"];
        const completionPosition = index.content.lastIndexOf('"');
        const environmentVariables = ts.createMap<string>();
        environmentVariables.set("TSC_WATCHDIRECTORY", tscWatchDirectory);
        const host = ts.projectSystem.createServerHost(files, { environmentVariables });
        const projectService = ts.projectSystem.createProjectService(host);
        projectService.openClientFile(index.path);
        const project = ts.Debug.assertDefined(projectService.configuredProjects.get(configFile.path));
        verifyProjectAndCompletions();
        // Add file2
        const file2: ts.projectSystem.File = {
            path: `${projectSrcFolder}/file2.ts`,
            content: ""
        };
        files.push(file2);
        fileNames.push(file2.path);
        expectedWatchedFiles.set(file2.path, 1);
        expectedCompletions.push("file2");
        host.reloadFS(files);
        host.runQueuedTimeoutCallbacks();
        assert.equal(projectService.configuredProjects.get(configFile.path), project);
        verifyProjectAndCompletions();
        function verifyProjectAndCompletions() {
            const completions = project.getLanguageService().getCompletionsAtPosition(index.path, completionPosition, { includeExternalModuleExports: false, includeInsertTextCompletions: false })!;
            ts.projectSystem.checkArray("Completion Entries", completions.entries.map(e => e.name), expectedCompletions);
            ts.projectSystem.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ true);
            ts.projectSystem.checkWatchedFilesDetailed(host, expectedWatchedFiles);
            ts.projectSystem.checkWatchedDirectoriesDetailed(host, expectedWatchedDirectories, /*recursive*/ false);
            ts.projectSystem.checkProjectActualFiles(project, fileNames);
        }
    }
    it("uses watchFile when file is added to subfolder, completion list has new file", () => {
        verifyCompletionListWithNewFileInSubFolder(Tsc_WatchDirectory.WatchFile);
    });
    it("uses non recursive watchDirectory when file is added to subfolder, completion list has new file", () => {
        verifyCompletionListWithNewFileInSubFolder(Tsc_WatchDirectory.NonRecursiveWatchDirectory);
    });
    it("uses dynamic polling when file is added to subfolder, completion list has new file", () => {
        verifyCompletionListWithNewFileInSubFolder(Tsc_WatchDirectory.DynamicPolling);
    });
});
describe("unittests:: tsserver:: watchEnvironment:: tsserverProjectSystem Watched recursive directories with windows style file system", () => {
    function verifyWatchedDirectories(rootedPath: string, useProjectAtRoot: boolean) {
        const root = useProjectAtRoot ? rootedPath : `${rootedPath}myfolder/allproject/`;
        const configFile: ts.projectSystem.File = {
            path: root + "project/tsconfig.json",
            content: "{}"
        };
        const file1: ts.projectSystem.File = {
            path: root + "project/file1.ts",
            content: "let x = 10;"
        };
        const file2: ts.projectSystem.File = {
            path: root + "project/file2.ts",
            content: "let y = 10;"
        };
        const files = [configFile, file1, file2, ts.projectSystem.libFile];
        const host = ts.projectSystem.createServerHost(files, { windowsStyleRoot: "c:/" });
        const projectService = ts.projectSystem.createProjectService(host);
        projectService.openClientFile(file1.path);
        const project = projectService.configuredProjects.get(configFile.path)!;
        assert.isDefined(project);
        const winsowsStyleLibFilePath = "c:/" + ts.projectSystem.libFile.path.substring(1);
        ts.projectSystem.checkProjectActualFiles(project, files.map(f => f === ts.projectSystem.libFile ? winsowsStyleLibFilePath : f.path));
        ts.projectSystem.checkWatchedFiles(host, ts.mapDefined(files, f => f === ts.projectSystem.libFile ? winsowsStyleLibFilePath : f === file1 ? undefined : f.path));
        ts.projectSystem.checkWatchedDirectories(host, [], /*recursive*/ false);
        ts.projectSystem.checkWatchedDirectories(host, [
            root + "project",
            root + "project/node_modules/@types"
        ].concat(useProjectAtRoot ? [] : [root + ts.projectSystem.nodeModulesAtTypes]), /*recursive*/ true);
    }
    function verifyRootedDirectoryWatch(rootedPath: string) {
        it("When project is in rootFolder of style c:/", () => {
            verifyWatchedDirectories(rootedPath, /*useProjectAtRoot*/ true);
        });
        it("When files at some folder other than root", () => {
            verifyWatchedDirectories(rootedPath, /*useProjectAtRoot*/ false);
        });
    }
    describe("for rootFolder of style c:/", () => {
        verifyRootedDirectoryWatch("c:/");
    });
    describe("for rootFolder of style c:/users/username", () => {
        verifyRootedDirectoryWatch("c:/users/username/");
    });
});
it(`unittests:: tsserver:: watchEnvironment:: tsserverProjectSystem recursive watch directory implementation does not watch files/directories in node_modules starting with "."`, () => {
    const projectFolder = "/a/username/project";
    const projectSrcFolder = `${projectFolder}/src`;
    const configFile: ts.projectSystem.File = {
        path: `${projectFolder}/tsconfig.json`,
        content: "{}"
    };
    const index: ts.projectSystem.File = {
        path: `${projectSrcFolder}/index.ts`,
        content: `import {} from "file"`
    };
    const file1: ts.projectSystem.File = {
        path: `${projectSrcFolder}/file1.ts`,
        content: ""
    };
    const nodeModulesExistingUnusedFile: ts.projectSystem.File = {
        path: `${projectFolder}/node_modules/someFile.d.ts`,
        content: ""
    };
    const fileNames = [index, file1, configFile, ts.projectSystem.libFile].map(file => file.path);
    // All closed files(files other than index), project folder, project/src folder and project/node_modules/@types folder
    const expectedWatchedFiles = ts.arrayToMap(fileNames.slice(1), ts.identity, () => 1);
    const expectedWatchedDirectories = ts.arrayToMap([projectFolder, projectSrcFolder, `${projectFolder}/${ts.projectSystem.nodeModules}`, `${projectFolder}/${ts.projectSystem.nodeModulesAtTypes}`], ts.identity, () => 1);
    const environmentVariables = ts.createMap<string>();
    environmentVariables.set("TSC_WATCHDIRECTORY", Tsc_WatchDirectory.NonRecursiveWatchDirectory);
    const host = ts.projectSystem.createServerHost([index, file1, configFile, ts.projectSystem.libFile, nodeModulesExistingUnusedFile], { environmentVariables });
    const projectService = ts.projectSystem.createProjectService(host);
    projectService.openClientFile(index.path);
    const project = ts.Debug.assertDefined(projectService.configuredProjects.get(configFile.path));
    verifyProject();
    const nodeModulesIgnoredFileFromIgnoreDirectory: ts.projectSystem.File = {
        path: `${projectFolder}/node_modules/.cache/someFile.d.ts`,
        content: ""
    };
    const nodeModulesIgnoredFile: ts.projectSystem.File = {
        path: `${projectFolder}/node_modules/.cacheFile.ts`,
        content: ""
    };
    const gitIgnoredFileFromIgnoreDirectory: ts.projectSystem.File = {
        path: `${projectFolder}/.git/someFile.d.ts`,
        content: ""
    };
    const gitIgnoredFile: ts.projectSystem.File = {
        path: `${projectFolder}/.gitCache.d.ts`,
        content: ""
    };
    const emacsIgnoredFileFromIgnoreDirectory: ts.projectSystem.File = {
        path: `${projectFolder}/src/.#field.ts`,
        content: ""
    };
    [
        nodeModulesIgnoredFileFromIgnoreDirectory,
        nodeModulesIgnoredFile,
        gitIgnoredFileFromIgnoreDirectory,
        gitIgnoredFile,
        emacsIgnoredFileFromIgnoreDirectory
    ].forEach(ignoredEntity => {
        host.ensureFileOrFolder(ignoredEntity);
        host.checkTimeoutQueueLength(0);
        verifyProject();
    });
    function verifyProject() {
        ts.projectSystem.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ true);
        ts.projectSystem.checkWatchedFilesDetailed(host, expectedWatchedFiles);
        ts.projectSystem.checkWatchedDirectoriesDetailed(host, expectedWatchedDirectories, /*recursive*/ false);
        ts.projectSystem.checkProjectActualFiles(project, fileNames);
    }
});
describe("unittests:: tsserver:: watchEnvironment:: tsserverProjectSystem watching files with network style paths", () => {
    function verifyFilePathStyle(path: string) {
        const windowsStyleRoot = path.substr(0, ts.getRootLength(path));
        const host = ts.projectSystem.createServerHost([ts.projectSystem.libFile, { path, content: "const x = 10" }], { windowsStyleRoot });
        const service = ts.projectSystem.createProjectService(host);
        service.openClientFile(path);
        ts.projectSystem.checkNumberOfProjects(service, { inferredProjects: 1 });
        const libPath = `${windowsStyleRoot}${ts.projectSystem.libFile.path.substring(1)}`;
        ts.projectSystem.checkProjectActualFiles(service.inferredProjects[0], [path, libPath]);
        ts.projectSystem.checkWatchedFiles(host, [libPath, `${ts.getDirectoryPath(path)}/tsconfig.json`, `${ts.getDirectoryPath(path)}/jsconfig.json`]);
    }
    it("for file of style c:/myprojects/project/x.js", () => {
        verifyFilePathStyle("c:/myprojects/project/x.js");
    });
    it("for file of style //vda1cs4850/myprojects/project/x.js", () => {
        verifyFilePathStyle("//vda1cs4850/myprojects/project/x.js");
    });
    it("for file of style //vda1cs4850/c$/myprojects/project/x.js", () => {
        verifyFilePathStyle("//vda1cs4850/c$/myprojects/project/x.js");
    });
    it("for file of style c:/users/username/myprojects/project/x.js", () => {
        verifyFilePathStyle("c:/users/username/myprojects/project/x.js");
    });
    it("for file of style //vda1cs4850/c$/users/username/myprojects/project/x.js", () => {
        verifyFilePathStyle("//vda1cs4850/c$/users/username/myprojects/project/x.js");
    });
});
describe("unittests:: tsserver:: watchEnvironment:: handles watch compiler options", () => {
    it("with watchFile option as host configuration", () => {
        const configFile: ts.projectSystem.File = {
            path: "/a/b/tsconfig.json",
            content: "{}"
        };
        const files = [ts.projectSystem.libFile, ts.projectSystem.commonFile2, configFile];
        const host = ts.projectSystem.createServerHost(files.concat(ts.projectSystem.commonFile1));
        const session = ts.projectSystem.createSession(host);
        session.executeCommandSeq<ts.projectSystem.protocol.ConfigureRequest>({
            command: ts.projectSystem.protocol.CommandTypes.Configure,
            arguments: {
                watchOptions: {
                    watchFile: ts.projectSystem.protocol.WatchFileKind.UseFsEvents
                }
            }
        });
        const service = session.getProjectService();
        ts.projectSystem.openFilesForSession([{ file: ts.projectSystem.commonFile1, projectRootPath: "/a/b" }], session);
        ts.projectSystem.checkProjectActualFiles((service.configuredProjects.get(configFile.path)!), files.map(f => f.path).concat(ts.projectSystem.commonFile1.path));
        // Instead of polling watch (= watchedFiles), uses fsWatch
        ts.projectSystem.checkWatchedFiles(host, ts.emptyArray);
        ts.projectSystem.checkWatchedDirectoriesDetailed(host, files.map(f => f.path.toLowerCase()), 1, 
        /*recursive*/ false, ts.arrayToMap(files, f => f.path.toLowerCase(), f => [{
                fallbackPollingInterval: f === configFile ? ts.PollingInterval.High : ts.PollingInterval.Medium,
                fallbackOptions: { watchFile: ts.WatchFileKind.PriorityPollingInterval }
            }]));
        ts.projectSystem.checkWatchedDirectoriesDetailed(host, ["/a/b", "/a/b/node_modules/@types"], 1, 
        /*recursive*/ true, ts.arrayToMap(["/a/b", "/a/b/node_modules/@types"], ts.identity, () => [{
                fallbackPollingInterval: ts.PollingInterval.Medium,
                fallbackOptions: { watchFile: ts.WatchFileKind.PriorityPollingInterval }
            }]));
    });
    it("with watchDirectory option as host configuration", () => {
        const configFile: ts.projectSystem.File = {
            path: "/a/b/tsconfig.json",
            content: "{}"
        };
        const files = [ts.projectSystem.libFile, ts.projectSystem.commonFile2, configFile];
        const host = ts.projectSystem.createServerHost(files.concat(ts.projectSystem.commonFile1), { runWithoutRecursiveWatches: true });
        const session = ts.projectSystem.createSession(host);
        session.executeCommandSeq<ts.projectSystem.protocol.ConfigureRequest>({
            command: ts.projectSystem.protocol.CommandTypes.Configure,
            arguments: {
                watchOptions: {
                    watchDirectory: ts.projectSystem.protocol.WatchDirectoryKind.UseFsEvents
                }
            }
        });
        const service = session.getProjectService();
        ts.projectSystem.openFilesForSession([{ file: ts.projectSystem.commonFile1, projectRootPath: "/a/b" }], session);
        ts.projectSystem.checkProjectActualFiles((service.configuredProjects.get(configFile.path)!), files.map(f => f.path).concat(ts.projectSystem.commonFile1.path));
        ts.projectSystem.checkWatchedFilesDetailed(host, files.map(f => f.path.toLowerCase()), 1, ts.arrayToMap(files, f => f.path.toLowerCase(), () => [ts.PollingInterval.Low]));
        ts.projectSystem.checkWatchedDirectoriesDetailed(host, ["/a/b", "/a/b/node_modules/@types"], 1, 
        /*recursive*/ false, ts.arrayToMap(["/a/b", "/a/b/node_modules/@types"], ts.identity, () => [{
                fallbackPollingInterval: ts.PollingInterval.Medium,
                fallbackOptions: { watchFile: ts.WatchFileKind.PriorityPollingInterval }
            }]));
        ts.projectSystem.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ true);
    });
    it("with fallbackPolling option as host configuration", () => {
        const configFile: ts.projectSystem.File = {
            path: "/a/b/tsconfig.json",
            content: "{}"
        };
        const files = [ts.projectSystem.libFile, ts.projectSystem.commonFile2, configFile];
        const host = ts.projectSystem.createServerHost(files.concat(ts.projectSystem.commonFile1), { runWithoutRecursiveWatches: true, runWithFallbackPolling: true });
        const session = ts.projectSystem.createSession(host);
        session.executeCommandSeq<ts.projectSystem.protocol.ConfigureRequest>({
            command: ts.projectSystem.protocol.CommandTypes.Configure,
            arguments: {
                watchOptions: {
                    fallbackPolling: ts.projectSystem.protocol.PollingWatchKind.PriorityInterval
                }
            }
        });
        const service = session.getProjectService();
        ts.projectSystem.openFilesForSession([{ file: ts.projectSystem.commonFile1, projectRootPath: "/a/b" }], session);
        ts.projectSystem.checkProjectActualFiles((service.configuredProjects.get(configFile.path)!), files.map(f => f.path).concat(ts.projectSystem.commonFile1.path));
        const filePaths = files.map(f => f.path.toLowerCase());
        ts.projectSystem.checkWatchedFilesDetailed(host, filePaths.concat(["/a/b", "/a/b/node_modules/@types"]), 1, ts.arrayToMap(filePaths.concat(["/a/b", "/a/b/node_modules/@types"]), ts.identity, f => [ts.contains(filePaths, f) ? ts.PollingInterval.Low : ts.PollingInterval.Medium]));
        ts.projectSystem.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ false);
        ts.projectSystem.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ true);
    });
    it("with watchFile option in configFile", () => {
        const configFile: ts.projectSystem.File = {
            path: "/a/b/tsconfig.json",
            content: JSON.stringify({
                watchOptions: {
                    watchFile: "UseFsEvents"
                }
            })
        };
        const files = [ts.projectSystem.libFile, ts.projectSystem.commonFile2, configFile];
        const host = ts.projectSystem.createServerHost(files.concat(ts.projectSystem.commonFile1));
        const session = ts.projectSystem.createSession(host);
        const service = session.getProjectService();
        ts.projectSystem.openFilesForSession([{ file: ts.projectSystem.commonFile1, projectRootPath: "/a/b" }], session);
        ts.projectSystem.checkProjectActualFiles((service.configuredProjects.get(configFile.path)!), files.map(f => f.path).concat(ts.projectSystem.commonFile1.path));
        // The closed script infos are watched using host settings
        ts.projectSystem.checkWatchedFilesDetailed(host, [ts.projectSystem.libFile, ts.projectSystem.commonFile2].map(f => f.path.toLowerCase()), 1, ts.arrayToMap([ts.projectSystem.libFile, ts.projectSystem.commonFile2], f => f.path.toLowerCase(), () => [ts.PollingInterval.Low]));
        // Config file with the setting with fsWatch
        ts.projectSystem.checkWatchedDirectoriesDetailed(host, [configFile.path.toLowerCase()], 1, 
        /*recursive*/ false, ts.arrayToMap([configFile.path.toLowerCase()], ts.identity, () => [{
                fallbackPollingInterval: ts.PollingInterval.High,
                fallbackOptions: { watchFile: ts.WatchFileKind.PriorityPollingInterval }
            }]));
        ts.projectSystem.checkWatchedDirectoriesDetailed(host, ["/a/b", "/a/b/node_modules/@types"], 1, 
        /*recursive*/ true, ts.arrayToMap(["/a/b", "/a/b/node_modules/@types"], ts.identity, () => [{
                fallbackPollingInterval: ts.PollingInterval.Medium,
                fallbackOptions: { watchFile: ts.WatchFileKind.PriorityPollingInterval }
            }]));
    });
    it("with watchDirectory option in configFile", () => {
        const configFile: ts.projectSystem.File = {
            path: "/a/b/tsconfig.json",
            content: JSON.stringify({
                watchOptions: {
                    watchDirectory: "UseFsEvents"
                }
            })
        };
        const files = [ts.projectSystem.libFile, ts.projectSystem.commonFile2, configFile];
        const host = ts.projectSystem.createServerHost(files.concat(ts.projectSystem.commonFile1), { runWithoutRecursiveWatches: true });
        const session = ts.projectSystem.createSession(host);
        const service = session.getProjectService();
        ts.projectSystem.openFilesForSession([{ file: ts.projectSystem.commonFile1, projectRootPath: "/a/b" }], session);
        ts.projectSystem.checkProjectActualFiles((service.configuredProjects.get(configFile.path)!), files.map(f => f.path).concat(ts.projectSystem.commonFile1.path));
        ts.projectSystem.checkWatchedFilesDetailed(host, files.map(f => f.path.toLowerCase()), 1, ts.arrayToMap(files, f => f.path.toLowerCase(), () => [ts.PollingInterval.Low]));
        ts.projectSystem.checkWatchedDirectoriesDetailed(host, ["/a/b", "/a/b/node_modules/@types"], 1, 
        /*recursive*/ false, ts.arrayToMap(["/a/b", "/a/b/node_modules/@types"], ts.identity, () => [{
                fallbackPollingInterval: ts.PollingInterval.Medium,
                fallbackOptions: { watchFile: ts.WatchFileKind.PriorityPollingInterval }
            }]));
        ts.projectSystem.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ true);
    });
    it("with fallbackPolling option in configFile", () => {
        const configFile: ts.projectSystem.File = {
            path: "/a/b/tsconfig.json",
            content: JSON.stringify({
                watchOptions: {
                    fallbackPolling: "PriorityInterval"
                }
            })
        };
        const files = [ts.projectSystem.libFile, ts.projectSystem.commonFile2, configFile];
        const host = ts.projectSystem.createServerHost(files.concat(ts.projectSystem.commonFile1), { runWithoutRecursiveWatches: true, runWithFallbackPolling: true });
        const session = ts.projectSystem.createSession(host);
        session.executeCommandSeq<ts.projectSystem.protocol.ConfigureRequest>({
            command: ts.projectSystem.protocol.CommandTypes.Configure,
            arguments: {
                watchOptions: {
                    fallbackPolling: ts.projectSystem.protocol.PollingWatchKind.PriorityInterval
                }
            }
        });
        const service = session.getProjectService();
        ts.projectSystem.openFilesForSession([{ file: ts.projectSystem.commonFile1, projectRootPath: "/a/b" }], session);
        ts.projectSystem.checkProjectActualFiles((service.configuredProjects.get(configFile.path)!), files.map(f => f.path).concat(ts.projectSystem.commonFile1.path));
        const filePaths = files.map(f => f.path.toLowerCase());
        ts.projectSystem.checkWatchedFilesDetailed(host, filePaths.concat(["/a/b", "/a/b/node_modules/@types"]), 1, ts.arrayToMap(filePaths.concat(["/a/b", "/a/b/node_modules/@types"]), ts.identity, f => [ts.contains(filePaths, f) ? ts.PollingInterval.Low : ts.PollingInterval.Medium]));
        ts.projectSystem.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ false);
        ts.projectSystem.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ true);
    });
});
