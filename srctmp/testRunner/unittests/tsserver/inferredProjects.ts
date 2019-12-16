import * as ts from "../../ts";
describe("unittests:: tsserver:: Inferred projects", () => {
    it("create inferred project", () => {
        const appFile: ts.projectSystem.File = {
            path: `${ts.tscWatch.projectRoot}/app.ts`,
            content: `
                import {f} from "./module"
                console.log(f)
                `
        };
        const moduleFile: ts.projectSystem.File = {
            path: `${ts.tscWatch.projectRoot}/module.d.ts`,
            content: `export let x: number`
        };
        const host = ts.projectSystem.createServerHost([appFile, moduleFile, ts.projectSystem.libFile]);
        const projectService = ts.projectSystem.createProjectService(host);
        const { configFileName } = projectService.openClientFile(appFile.path);
        assert(!configFileName, `should not find config, got: '${configFileName}`);
        ts.projectSystem.checkNumberOfConfiguredProjects(projectService, 0);
        ts.projectSystem.checkNumberOfInferredProjects(projectService, 1);
        const project = projectService.inferredProjects[0];
        ts.projectSystem.checkArray("inferred project", project.getFileNames(), [appFile.path, ts.projectSystem.libFile.path, moduleFile.path]);
        ts.projectSystem.checkWatchedFiles(host, ts.projectSystem.getConfigFilesToWatch(ts.tscWatch.projectRoot).concat(ts.projectSystem.libFile.path, moduleFile.path));
        ts.projectSystem.checkWatchedDirectories(host, [ts.tscWatch.projectRoot], /*recursive*/ false);
        ts.projectSystem.checkWatchedDirectories(host, [ts.combinePaths(ts.tscWatch.projectRoot, ts.projectSystem.nodeModulesAtTypes)], /*recursive*/ true);
    });
    it("should use only one inferred project if 'useOneInferredProject' is set", () => {
        const file1 = {
            path: `${ts.tscWatch.projectRoot}/a/b/main.ts`,
            content: "let x =1;"
        };
        const configFile: ts.projectSystem.File = {
            path: `${ts.tscWatch.projectRoot}/a/b/tsconfig.json`,
            content: `{
                    "compilerOptions": {
                        "target": "es6"
                    },
                    "files": [ "main.ts" ]
                }`
        };
        const file2 = {
            path: `${ts.tscWatch.projectRoot}/a/c/main.ts`,
            content: "let x =1;"
        };
        const file3 = {
            path: `${ts.tscWatch.projectRoot}/a/d/main.ts`,
            content: "let x =1;"
        };
        const host = ts.projectSystem.createServerHost([file1, file2, file3, ts.projectSystem.libFile]);
        const projectService = ts.projectSystem.createProjectService(host, { useSingleInferredProject: true });
        projectService.openClientFile(file1.path);
        projectService.openClientFile(file2.path);
        projectService.openClientFile(file3.path);
        ts.projectSystem.checkNumberOfConfiguredProjects(projectService, 0);
        ts.projectSystem.checkNumberOfInferredProjects(projectService, 1);
        ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[0], [file1.path, file2.path, file3.path, ts.projectSystem.libFile.path]);
        host.reloadFS([file1, configFile, file2, file3, ts.projectSystem.libFile]);
        host.checkTimeoutQueueLengthAndRun(2); // load configured project from disk + ensureProjectsForOpenFiles
        ts.projectSystem.checkNumberOfConfiguredProjects(projectService, 1);
        ts.projectSystem.checkNumberOfInferredProjects(projectService, 1);
        ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[0], [file2.path, file3.path, ts.projectSystem.libFile.path]);
    });
    it("disable inferred project", () => {
        const file1 = {
            path: "/a/b/f1.ts",
            content: "let x =1;"
        };
        const host = ts.projectSystem.createServerHost([file1]);
        const projectService = ts.projectSystem.createProjectService(host, { useSingleInferredProject: true }, { syntaxOnly: true });
        projectService.openClientFile(file1.path, file1.content);
        ts.projectSystem.checkNumberOfProjects(projectService, { inferredProjects: 1 });
        const proj = projectService.inferredProjects[0];
        assert.isDefined(proj);
        assert.isFalse(proj.languageServiceEnabled);
    });
    it("project settings for inferred projects", () => {
        const file1 = {
            path: "/a/b/app.ts",
            content: `import {x} from "mod"`
        };
        const modFile = {
            path: "/a/mod.ts",
            content: "export let x: number"
        };
        const host = ts.projectSystem.createServerHost([file1, modFile]);
        const projectService = ts.projectSystem.createProjectService(host);
        projectService.openClientFile(file1.path);
        projectService.openClientFile(modFile.path);
        ts.projectSystem.checkNumberOfProjects(projectService, { inferredProjects: 2 });
        const inferredProjects = projectService.inferredProjects.slice();
        ts.projectSystem.checkProjectActualFiles(inferredProjects[0], [file1.path]);
        ts.projectSystem.checkProjectActualFiles(inferredProjects[1], [modFile.path]);
        projectService.setCompilerOptionsForInferredProjects({ moduleResolution: ts.ModuleResolutionKind.Classic });
        host.checkTimeoutQueueLengthAndRun(3);
        ts.projectSystem.checkNumberOfProjects(projectService, { inferredProjects: 2 });
        assert.strictEqual(projectService.inferredProjects[0], inferredProjects[0]);
        assert.strictEqual(projectService.inferredProjects[1], inferredProjects[1]);
        ts.projectSystem.checkProjectActualFiles(inferredProjects[0], [file1.path, modFile.path]);
        assert.isTrue(inferredProjects[1].isOrphan());
    });
    it("should support files without extensions", () => {
        const f = {
            path: "/a/compile",
            content: "let x = 1"
        };
        const host = ts.projectSystem.createServerHost([f]);
        const session = ts.projectSystem.createSession(host);
        session.executeCommand((<ts.server.protocol.SetCompilerOptionsForInferredProjectsRequest>{
            seq: 1,
            type: "request",
            command: "compilerOptionsForInferredProjects",
            arguments: {
                options: {
                    allowJs: true
                }
            }
        }));
        session.executeCommand((<ts.server.protocol.OpenRequest>{
            seq: 2,
            type: "request",
            command: "open",
            arguments: {
                file: f.path,
                fileContent: f.content,
                scriptKindName: "JS"
            }
        }));
        const projectService = session.getProjectService();
        ts.projectSystem.checkNumberOfProjects(projectService, { inferredProjects: 1 });
        ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[0], [f.path]);
    });
    it("inferred projects per project root", () => {
        const file1 = { path: "/a/file1.ts", content: "let x = 1;", projectRootPath: "/a" };
        const file2 = { path: "/a/file2.ts", content: "let y = 2;", projectRootPath: "/a" };
        const file3 = { path: "/b/file2.ts", content: "let x = 3;", projectRootPath: "/b" };
        const file4 = { path: "/c/file3.ts", content: "let z = 4;" };
        const host = ts.projectSystem.createServerHost([file1, file2, file3, file4]);
        const session = ts.projectSystem.createSession(host, {
            useSingleInferredProject: true,
            useInferredProjectPerProjectRoot: true
        });
        session.executeCommand((<ts.server.protocol.SetCompilerOptionsForInferredProjectsRequest>{
            seq: 1,
            type: "request",
            command: ts.projectSystem.CommandNames.CompilerOptionsForInferredProjects,
            arguments: {
                options: {
                    allowJs: true,
                    target: ts.ScriptTarget.ESNext
                }
            }
        }));
        session.executeCommand((<ts.server.protocol.SetCompilerOptionsForInferredProjectsRequest>{
            seq: 2,
            type: "request",
            command: ts.projectSystem.CommandNames.CompilerOptionsForInferredProjects,
            arguments: {
                options: {
                    allowJs: true,
                    target: ts.ScriptTarget.ES2015
                },
                projectRootPath: "/b"
            }
        }));
        session.executeCommand((<ts.server.protocol.OpenRequest>{
            seq: 3,
            type: "request",
            command: ts.projectSystem.CommandNames.Open,
            arguments: {
                file: file1.path,
                fileContent: file1.content,
                scriptKindName: "JS",
                projectRootPath: file1.projectRootPath
            }
        }));
        session.executeCommand((<ts.server.protocol.OpenRequest>{
            seq: 4,
            type: "request",
            command: ts.projectSystem.CommandNames.Open,
            arguments: {
                file: file2.path,
                fileContent: file2.content,
                scriptKindName: "JS",
                projectRootPath: file2.projectRootPath
            }
        }));
        session.executeCommand((<ts.server.protocol.OpenRequest>{
            seq: 5,
            type: "request",
            command: ts.projectSystem.CommandNames.Open,
            arguments: {
                file: file3.path,
                fileContent: file3.content,
                scriptKindName: "JS",
                projectRootPath: file3.projectRootPath
            }
        }));
        session.executeCommand((<ts.server.protocol.OpenRequest>{
            seq: 6,
            type: "request",
            command: ts.projectSystem.CommandNames.Open,
            arguments: {
                file: file4.path,
                fileContent: file4.content,
                scriptKindName: "JS"
            }
        }));
        const projectService = session.getProjectService();
        ts.projectSystem.checkNumberOfProjects(projectService, { inferredProjects: 3 });
        ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[0], [file4.path]);
        ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[1], [file1.path, file2.path]);
        ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[2], [file3.path]);
        assert.equal(projectService.inferredProjects[0].getCompilationSettings().target, ts.ScriptTarget.ESNext);
        assert.equal(projectService.inferredProjects[1].getCompilationSettings().target, ts.ScriptTarget.ESNext);
        assert.equal(projectService.inferredProjects[2].getCompilationSettings().target, ts.ScriptTarget.ES2015);
    });
    function checkInferredProject(inferredProject: ts.server.InferredProject, actualFiles: ts.projectSystem.File[], target: ts.ScriptTarget) {
        ts.projectSystem.checkProjectActualFiles(inferredProject, actualFiles.map(f => f.path));
        assert.equal(inferredProject.getCompilationSettings().target, target);
    }
    function verifyProjectRootWithCaseSensitivity(useCaseSensitiveFileNames: boolean) {
        const files: [ts.projectSystem.File, ts.projectSystem.File, ts.projectSystem.File, ts.projectSystem.File] = [
            { path: "/a/file1.ts", content: "let x = 1;" },
            { path: "/A/file2.ts", content: "let y = 2;" },
            { path: "/b/file2.ts", content: "let x = 3;" },
            { path: "/c/file3.ts", content: "let z = 4;" }
        ];
        const host = ts.projectSystem.createServerHost(files, { useCaseSensitiveFileNames });
        const projectService = ts.projectSystem.createProjectService(host, { useSingleInferredProject: true, }, { useInferredProjectPerProjectRoot: true });
        projectService.setCompilerOptionsForInferredProjects({
            allowJs: true,
            target: ts.ScriptTarget.ESNext
        });
        projectService.setCompilerOptionsForInferredProjects({
            allowJs: true,
            target: ts.ScriptTarget.ES2015
        }, "/a");
        openClientFiles(["/a", "/a", "/b", undefined]);
        verifyInferredProjectsState([
            [[files[3]], ts.ScriptTarget.ESNext],
            [[files[0], files[1]], ts.ScriptTarget.ES2015],
            [[files[2]], ts.ScriptTarget.ESNext]
        ]);
        closeClientFiles();
        openClientFiles(["/a", "/A", "/b", undefined]);
        if (useCaseSensitiveFileNames) {
            verifyInferredProjectsState([
                [[files[3]], ts.ScriptTarget.ESNext],
                [[files[0]], ts.ScriptTarget.ES2015],
                [[files[1]], ts.ScriptTarget.ESNext],
                [[files[2]], ts.ScriptTarget.ESNext]
            ]);
        }
        else {
            verifyInferredProjectsState([
                [[files[3]], ts.ScriptTarget.ESNext],
                [[files[0], files[1]], ts.ScriptTarget.ES2015],
                [[files[2]], ts.ScriptTarget.ESNext]
            ]);
        }
        closeClientFiles();
        projectService.setCompilerOptionsForInferredProjects({
            allowJs: true,
            target: ts.ScriptTarget.ES2017
        }, "/A");
        openClientFiles(["/a", "/a", "/b", undefined]);
        verifyInferredProjectsState([
            [[files[3]], ts.ScriptTarget.ESNext],
            [[files[0], files[1]], useCaseSensitiveFileNames ? ts.ScriptTarget.ES2015 : ts.ScriptTarget.ES2017],
            [[files[2]], ts.ScriptTarget.ESNext]
        ]);
        closeClientFiles();
        openClientFiles(["/a", "/A", "/b", undefined]);
        if (useCaseSensitiveFileNames) {
            verifyInferredProjectsState([
                [[files[3]], ts.ScriptTarget.ESNext],
                [[files[0]], ts.ScriptTarget.ES2015],
                [[files[1]], ts.ScriptTarget.ES2017],
                [[files[2]], ts.ScriptTarget.ESNext]
            ]);
        }
        else {
            verifyInferredProjectsState([
                [[files[3]], ts.ScriptTarget.ESNext],
                [[files[0], files[1]], ts.ScriptTarget.ES2017],
                [[files[2]], ts.ScriptTarget.ESNext]
            ]);
        }
        closeClientFiles();
        function openClientFiles(projectRoots: [string | undefined, string | undefined, string | undefined, string | undefined]) {
            files.forEach((file, index) => {
                projectService.openClientFile(file.path, file.content, ts.ScriptKind.JS, projectRoots[index]);
            });
        }
        function closeClientFiles() {
            files.forEach(file => projectService.closeClientFile(file.path));
        }
        function verifyInferredProjectsState(expected: [ts.projectSystem.File[], ts.ScriptTarget][]) {
            ts.projectSystem.checkNumberOfProjects(projectService, { inferredProjects: expected.length });
            projectService.inferredProjects.forEach((p, index) => {
                const [actualFiles, target] = expected[index];
                checkInferredProject(p, actualFiles, target);
            });
        }
    }
    it("inferred projects per project root with case sensitive system", () => {
        verifyProjectRootWithCaseSensitivity(/*useCaseSensitiveFileNames*/ true);
    });
    it("inferred projects per project root with case insensitive system", () => {
        verifyProjectRootWithCaseSensitivity(/*useCaseSensitiveFileNames*/ false);
    });
    it("should still retain configured project created while opening the file", () => {
        const appFile: ts.projectSystem.File = {
            path: `${ts.tscWatch.projectRoot}/app.ts`,
            content: `const app = 20;`
        };
        const config: ts.projectSystem.File = {
            path: `${ts.tscWatch.projectRoot}/tsconfig.json`,
            content: "{}"
        };
        const jsFile1: ts.projectSystem.File = {
            path: `${ts.tscWatch.projectRoot}/jsFile1.js`,
            content: `const jsFile1 = 10;`
        };
        const jsFile2: ts.projectSystem.File = {
            path: `${ts.tscWatch.projectRoot}/jsFile2.js`,
            content: `const jsFile2 = 10;`
        };
        const host = ts.projectSystem.createServerHost([appFile, ts.projectSystem.libFile, config, jsFile1, jsFile2]);
        const projectService = ts.projectSystem.createProjectService(host);
        const originalSet = projectService.configuredProjects.set;
        const originalDelete = projectService.configuredProjects.delete;
        const configuredCreated = ts.createMap<true>();
        const configuredRemoved = ts.createMap<true>();
        projectService.configuredProjects.set = (key, value) => {
            assert.isFalse(configuredCreated.has(key));
            configuredCreated.set(key, true);
            return originalSet.call(projectService.configuredProjects, key, value);
        };
        projectService.configuredProjects.delete = key => {
            assert.isFalse(configuredRemoved.has(key));
            configuredRemoved.set(key, true);
            return originalDelete.call(projectService.configuredProjects, key);
        };
        // Do not remove config project when opening jsFile that is not present as part of config project
        projectService.openClientFile(jsFile1.path);
        ts.projectSystem.checkNumberOfProjects(projectService, { inferredProjects: 1, configuredProjects: 1 });
        ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[0], [jsFile1.path, ts.projectSystem.libFile.path]);
        const project = projectService.configuredProjects.get(config.path)!;
        ts.projectSystem.checkProjectActualFiles(project, [appFile.path, config.path, ts.projectSystem.libFile.path]);
        checkConfiguredProjectCreatedAndNotDeleted();
        // Do not remove config project when opening jsFile that is not present as part of config project
        projectService.closeClientFile(jsFile1.path);
        ts.projectSystem.checkNumberOfProjects(projectService, { inferredProjects: 1, configuredProjects: 1 });
        projectService.openClientFile(jsFile2.path);
        ts.projectSystem.checkNumberOfProjects(projectService, { inferredProjects: 1, configuredProjects: 1 });
        ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[0], [jsFile2.path, ts.projectSystem.libFile.path]);
        ts.projectSystem.checkProjectActualFiles(project, [appFile.path, config.path, ts.projectSystem.libFile.path]);
        checkConfiguredProjectNotCreatedAndNotDeleted();
        // Do not remove config project when opening jsFile that is not present as part of config project
        projectService.openClientFile(jsFile1.path);
        ts.projectSystem.checkNumberOfProjects(projectService, { inferredProjects: 2, configuredProjects: 1 });
        ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[0], [jsFile2.path, ts.projectSystem.libFile.path]);
        ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[1], [jsFile1.path, ts.projectSystem.libFile.path]);
        ts.projectSystem.checkProjectActualFiles(project, [appFile.path, config.path, ts.projectSystem.libFile.path]);
        checkConfiguredProjectNotCreatedAndNotDeleted();
        // When opening file that doesnt fall back to the config file, we remove the config project
        projectService.openClientFile(ts.projectSystem.libFile.path);
        ts.projectSystem.checkNumberOfProjects(projectService, { inferredProjects: 2 });
        ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[0], [jsFile2.path, ts.projectSystem.libFile.path]);
        ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[1], [jsFile1.path, ts.projectSystem.libFile.path]);
        checkConfiguredProjectNotCreatedButDeleted();
        function checkConfiguredProjectCreatedAndNotDeleted() {
            assert.equal(configuredCreated.size, 1);
            assert.isTrue(configuredCreated.has(config.path));
            assert.equal(configuredRemoved.size, 0);
            configuredCreated.clear();
        }
        function checkConfiguredProjectNotCreatedAndNotDeleted() {
            assert.equal(configuredCreated.size, 0);
            assert.equal(configuredRemoved.size, 0);
        }
        function checkConfiguredProjectNotCreatedButDeleted() {
            assert.equal(configuredCreated.size, 0);
            assert.equal(configuredRemoved.size, 1);
            assert.isTrue(configuredRemoved.has(config.path));
            configuredRemoved.clear();
        }
    });
});
