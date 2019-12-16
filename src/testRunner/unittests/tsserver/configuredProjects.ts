namespace ts.projectSystem {
    describe("unittests:: tsserver:: ConfiguredProjects", () => {
        it("create configured project without file list", () => {
            const configFile: ts.projectSystem.File = {
                path: "/a/b/tsconfig.json",
                content: `
                {
                    "compilerOptions": {},
                    "exclude": [
                        "e"
                    ]
                }`
            };
            const file1: ts.projectSystem.File = {
                path: "/a/b/c/f1.ts",
                content: "let x = 1"
            };
            const file2: ts.projectSystem.File = {
                path: "/a/b/d/f2.ts",
                content: "let y = 1"
            };
            const file3: ts.projectSystem.File = {
                path: "/a/b/e/f3.ts",
                content: "let z = 1"
            };
            const host = ts.projectSystem.createServerHost([configFile, ts.projectSystem.libFile, file1, file2, file3]);
            const projectService = ts.projectSystem.createProjectService(host);
            const { configFileName, configFileErrors } = projectService.openClientFile(file1.path);
            assert(configFileName, "should find config file");
            assert.isTrue(!configFileErrors || configFileErrors.length === 0, `expect no errors in config file, got ${JSON.stringify(configFileErrors)}`);
            ts.projectSystem.checkNumberOfInferredProjects(projectService, 0);
            ts.projectSystem.checkNumberOfConfiguredProjects(projectService, 1);
            const project = ts.projectSystem.configuredProjectAt(projectService, 0);
            ts.projectSystem.checkProjectActualFiles(project, [file1.path, ts.projectSystem.libFile.path, file2.path, configFile.path]);
            ts.projectSystem.checkProjectRootFiles(project, [file1.path, file2.path]);
            // watching all files except one that was open
            ts.projectSystem.checkWatchedFiles(host, [configFile.path, file2.path, ts.projectSystem.libFile.path]);
            const configFileDirectory = ts.getDirectoryPath(configFile.path);
            ts.projectSystem.checkWatchedDirectories(host, [configFileDirectory, ts.combinePaths(configFileDirectory, ts.projectSystem.nodeModulesAtTypes)], /*recursive*/ true);
        });
        it("create configured project with the file list", () => {
            const configFile: ts.projectSystem.File = {
                path: "/a/b/tsconfig.json",
                content: `
                {
                    "compilerOptions": {},
                    "include": ["*.ts"]
                }`
            };
            const file1: ts.projectSystem.File = {
                path: "/a/b/f1.ts",
                content: "let x = 1"
            };
            const file2: ts.projectSystem.File = {
                path: "/a/b/f2.ts",
                content: "let y = 1"
            };
            const file3: ts.projectSystem.File = {
                path: "/a/b/c/f3.ts",
                content: "let z = 1"
            };
            const host = ts.projectSystem.createServerHost([configFile, ts.projectSystem.libFile, file1, file2, file3]);
            const projectService = ts.projectSystem.createProjectService(host);
            const { configFileName, configFileErrors } = projectService.openClientFile(file1.path);
            assert(configFileName, "should find config file");
            assert.isTrue(!configFileErrors || configFileErrors.length === 0, `expect no errors in config file, got ${JSON.stringify(configFileErrors)}`);
            ts.projectSystem.checkNumberOfInferredProjects(projectService, 0);
            ts.projectSystem.checkNumberOfConfiguredProjects(projectService, 1);
            const project = ts.projectSystem.configuredProjectAt(projectService, 0);
            ts.projectSystem.checkProjectActualFiles(project, [file1.path, ts.projectSystem.libFile.path, file2.path, configFile.path]);
            ts.projectSystem.checkProjectRootFiles(project, [file1.path, file2.path]);
            // watching all files except one that was open
            ts.projectSystem.checkWatchedFiles(host, [configFile.path, file2.path, ts.projectSystem.libFile.path]);
            ts.projectSystem.checkWatchedDirectories(host, [ts.getDirectoryPath(configFile.path)], /*recursive*/ false);
        });
        it("add and then remove a config file in a folder with loose files", () => {
            const configFile: ts.projectSystem.File = {
                path: `${ts.tscWatch.projectRoot}/tsconfig.json`,
                content: `{
                    "files": ["commonFile1.ts"]
                }`
            };
            const commonFile1: ts.projectSystem.File = {
                path: `${ts.tscWatch.projectRoot}/commonFile1.ts`,
                content: "let x = 1"
            };
            const commonFile2: ts.projectSystem.File = {
                path: `${ts.tscWatch.projectRoot}/commonFile2.ts`,
                content: "let y = 1"
            };
            const filesWithoutConfig = [ts.projectSystem.libFile, commonFile1, commonFile2];
            const host = ts.projectSystem.createServerHost(filesWithoutConfig);
            const filesWithConfig = [ts.projectSystem.libFile, commonFile1, commonFile2, configFile];
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(commonFile1.path);
            projectService.openClientFile(commonFile2.path);
            projectService.checkNumberOfProjects({ inferredProjects: 2 });
            ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[0], [commonFile1.path, ts.projectSystem.libFile.path]);
            ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[1], [commonFile2.path, ts.projectSystem.libFile.path]);
            const watchedFiles = ts.projectSystem.getConfigFilesToWatch(ts.tscWatch.projectRoot).concat(ts.projectSystem.libFile.path);
            ts.projectSystem.checkWatchedFiles(host, watchedFiles);
            // Add a tsconfig file
            host.reloadFS(filesWithConfig);
            host.checkTimeoutQueueLengthAndRun(2); // load configured project from disk + ensureProjectsForOpenFiles
            projectService.checkNumberOfProjects({ inferredProjects: 2, configuredProjects: 1 });
            assert.isTrue(projectService.inferredProjects[0].isOrphan());
            ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[1], [commonFile2.path, ts.projectSystem.libFile.path]);
            ts.projectSystem.checkProjectActualFiles((projectService.configuredProjects.get(configFile.path)!), [ts.projectSystem.libFile.path, commonFile1.path, configFile.path]);
            ts.projectSystem.checkWatchedFiles(host, watchedFiles);
            // remove the tsconfig file
            host.reloadFS(filesWithoutConfig);
            projectService.checkNumberOfProjects({ inferredProjects: 2 });
            assert.isTrue(projectService.inferredProjects[0].isOrphan());
            ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[1], [commonFile2.path, ts.projectSystem.libFile.path]);
            host.checkTimeoutQueueLengthAndRun(1); // Refresh inferred projects
            projectService.checkNumberOfProjects({ inferredProjects: 2 });
            ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[0], [commonFile1.path, ts.projectSystem.libFile.path]);
            ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[1], [commonFile2.path, ts.projectSystem.libFile.path]);
            ts.projectSystem.checkWatchedFiles(host, watchedFiles);
        });
        it("add new files to a configured project without file list", () => {
            const configFile: ts.projectSystem.File = {
                path: "/a/b/tsconfig.json",
                content: `{}`
            };
            const host = ts.projectSystem.createServerHost([ts.projectSystem.commonFile1, ts.projectSystem.libFile, configFile]);
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(ts.projectSystem.commonFile1.path);
            const configFileDir = ts.getDirectoryPath(configFile.path);
            ts.projectSystem.checkWatchedDirectories(host, [configFileDir, ts.combinePaths(configFileDir, ts.projectSystem.nodeModulesAtTypes)], /*recursive*/ true);
            ts.projectSystem.checkNumberOfConfiguredProjects(projectService, 1);
            const project = ts.projectSystem.configuredProjectAt(projectService, 0);
            ts.projectSystem.checkProjectRootFiles(project, [ts.projectSystem.commonFile1.path]);
            // add a new ts file
            host.reloadFS([ts.projectSystem.commonFile1, ts.projectSystem.commonFile2, ts.projectSystem.libFile, configFile]);
            host.checkTimeoutQueueLengthAndRun(2);
            // project service waits for 250ms to update the project structure, therefore the assertion needs to wait longer.
            ts.projectSystem.checkProjectRootFiles(project, [ts.projectSystem.commonFile1.path, ts.projectSystem.commonFile2.path]);
        });
        it("should ignore non-existing files specified in the config file", () => {
            const configFile: ts.projectSystem.File = {
                path: "/a/b/tsconfig.json",
                content: `{
                    "compilerOptions": {},
                    "files": [
                        "commonFile1.ts",
                        "commonFile3.ts"
                    ]
                }`
            };
            const host = ts.projectSystem.createServerHost([ts.projectSystem.commonFile1, ts.projectSystem.commonFile2, configFile]);
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(ts.projectSystem.commonFile1.path);
            projectService.openClientFile(ts.projectSystem.commonFile2.path);
            ts.projectSystem.checkNumberOfConfiguredProjects(projectService, 1);
            const project = ts.projectSystem.configuredProjectAt(projectService, 0);
            ts.projectSystem.checkProjectRootFiles(project, [ts.projectSystem.commonFile1.path]);
            ts.projectSystem.checkNumberOfInferredProjects(projectService, 1);
        });
        it("handle recreated files correctly", () => {
            const configFile: ts.projectSystem.File = {
                path: "/a/b/tsconfig.json",
                content: `{}`
            };
            const host = ts.projectSystem.createServerHost([ts.projectSystem.commonFile1, ts.projectSystem.commonFile2, configFile]);
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(ts.projectSystem.commonFile1.path);
            ts.projectSystem.checkNumberOfConfiguredProjects(projectService, 1);
            const project = ts.projectSystem.configuredProjectAt(projectService, 0);
            ts.projectSystem.checkProjectRootFiles(project, [ts.projectSystem.commonFile1.path, ts.projectSystem.commonFile2.path]);
            // delete commonFile2
            host.reloadFS([ts.projectSystem.commonFile1, configFile]);
            host.checkTimeoutQueueLengthAndRun(2);
            ts.projectSystem.checkProjectRootFiles(project, [ts.projectSystem.commonFile1.path]);
            // re-add commonFile2
            host.reloadFS([ts.projectSystem.commonFile1, ts.projectSystem.commonFile2, configFile]);
            host.checkTimeoutQueueLengthAndRun(2);
            ts.projectSystem.checkProjectRootFiles(project, [ts.projectSystem.commonFile1.path, ts.projectSystem.commonFile2.path]);
        });
        it("files explicitly excluded in config file", () => {
            const configFile: ts.projectSystem.File = {
                path: "/a/b/tsconfig.json",
                content: `{
                    "compilerOptions": {},
                    "exclude": ["/a/c"]
                }`
            };
            const excludedFile1: ts.projectSystem.File = {
                path: "/a/c/excluedFile1.ts",
                content: `let t = 1;`
            };
            const host = ts.projectSystem.createServerHost([ts.projectSystem.commonFile1, ts.projectSystem.commonFile2, excludedFile1, configFile]);
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(ts.projectSystem.commonFile1.path);
            ts.projectSystem.checkNumberOfConfiguredProjects(projectService, 1);
            const project = ts.projectSystem.configuredProjectAt(projectService, 0);
            ts.projectSystem.checkProjectRootFiles(project, [ts.projectSystem.commonFile1.path, ts.projectSystem.commonFile2.path]);
            projectService.openClientFile(excludedFile1.path);
            ts.projectSystem.checkNumberOfInferredProjects(projectService, 1);
        });
        it("should properly handle module resolution changes in config file", () => {
            const file1: ts.projectSystem.File = {
                path: "/a/b/file1.ts",
                content: `import { T } from "module1";`
            };
            const nodeModuleFile: ts.projectSystem.File = {
                path: "/a/b/node_modules/module1.ts",
                content: `export interface T {}`
            };
            const classicModuleFile: ts.projectSystem.File = {
                path: "/a/module1.ts",
                content: `export interface T {}`
            };
            const randomFile: ts.projectSystem.File = {
                path: "/a/file1.ts",
                content: `export interface T {}`
            };
            const configFile: ts.projectSystem.File = {
                path: "/a/b/tsconfig.json",
                content: `{
                    "compilerOptions": {
                        "moduleResolution": "node"
                    },
                    "files": ["${file1.path}"]
                }`
            };
            const files = [file1, nodeModuleFile, classicModuleFile, configFile, randomFile];
            const host = ts.projectSystem.createServerHost(files);
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(file1.path);
            projectService.openClientFile(nodeModuleFile.path);
            projectService.openClientFile(classicModuleFile.path);
            ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1, inferredProjects: 1 });
            const project = ts.projectSystem.configuredProjectAt(projectService, 0);
            const inferredProject0 = projectService.inferredProjects[0];
            ts.projectSystem.checkProjectActualFiles(project, [file1.path, nodeModuleFile.path, configFile.path]);
            ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[0], [classicModuleFile.path]);
            configFile.content = `{
                "compilerOptions": {
                    "moduleResolution": "classic"
                },
                "files": ["${file1.path}"]
            }`;
            host.reloadFS(files);
            host.checkTimeoutQueueLengthAndRun(2);
            ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1, inferredProjects: 2 }); // will not remove project 1
            ts.projectSystem.checkProjectActualFiles(project, [file1.path, classicModuleFile.path, configFile.path]);
            assert.strictEqual(projectService.inferredProjects[0], inferredProject0);
            assert.isTrue(projectService.inferredProjects[0].isOrphan());
            const inferredProject1 = projectService.inferredProjects[1];
            ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[1], [nodeModuleFile.path]);
            // Open random file and it will reuse first inferred project
            projectService.openClientFile(randomFile.path);
            ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1, inferredProjects: 2 });
            ts.projectSystem.checkProjectActualFiles(project, [file1.path, classicModuleFile.path, configFile.path]);
            assert.strictEqual(projectService.inferredProjects[0], inferredProject0);
            ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[0], [randomFile.path]); // Reuses first inferred project
            assert.strictEqual(projectService.inferredProjects[1], inferredProject1);
            ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[1], [nodeModuleFile.path]);
        });
        it("should keep the configured project when the opened file is referenced by the project but not its root", () => {
            const file1: ts.projectSystem.File = {
                path: "/a/b/main.ts",
                content: "import { objA } from './obj-a';"
            };
            const file2: ts.projectSystem.File = {
                path: "/a/b/obj-a.ts",
                content: `export const objA = Object.assign({foo: "bar"}, {bar: "baz"});`
            };
            const configFile: ts.projectSystem.File = {
                path: "/a/b/tsconfig.json",
                content: `{
                    "compilerOptions": {
                        "target": "es6"
                    },
                    "files": [ "main.ts" ]
                }`
            };
            const host = ts.projectSystem.createServerHost([file1, file2, configFile]);
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(file1.path);
            projectService.closeClientFile(file1.path);
            projectService.openClientFile(file2.path);
            ts.projectSystem.checkNumberOfConfiguredProjects(projectService, 1);
            ts.projectSystem.checkNumberOfInferredProjects(projectService, 0);
        });
        it("should keep the configured project when the opened file is referenced by the project but not its root", () => {
            const file1: ts.projectSystem.File = {
                path: "/a/b/main.ts",
                content: "import { objA } from './obj-a';"
            };
            const file2: ts.projectSystem.File = {
                path: "/a/b/obj-a.ts",
                content: `export const objA = Object.assign({foo: "bar"}, {bar: "baz"});`
            };
            const configFile: ts.projectSystem.File = {
                path: "/a/b/tsconfig.json",
                content: `{
                    "compilerOptions": {
                        "target": "es6"
                    },
                    "files": [ "main.ts" ]
                }`
            };
            const host = ts.projectSystem.createServerHost([file1, file2, configFile]);
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(file1.path);
            projectService.closeClientFile(file1.path);
            projectService.openClientFile(file2.path);
            ts.projectSystem.checkNumberOfConfiguredProjects(projectService, 1);
            ts.projectSystem.checkNumberOfInferredProjects(projectService, 0);
        });
        it("should tolerate config file errors and still try to build a project", () => {
            const configFile: ts.projectSystem.File = {
                path: "/a/b/tsconfig.json",
                content: `{
                    "compilerOptions": {
                        "target": "es6",
                        "allowAnything": true
                    },
                    "someOtherProperty": {}
                }`
            };
            const host = ts.projectSystem.createServerHost([ts.projectSystem.commonFile1, ts.projectSystem.commonFile2, ts.projectSystem.libFile, configFile]);
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(ts.projectSystem.commonFile1.path);
            ts.projectSystem.checkNumberOfConfiguredProjects(projectService, 1);
            ts.projectSystem.checkProjectRootFiles(ts.projectSystem.configuredProjectAt(projectService, 0), [ts.projectSystem.commonFile1.path, ts.projectSystem.commonFile2.path]);
        });
        it("should reuse same project if file is opened from the configured project that has no open files", () => {
            const file1 = {
                path: "/a/b/main.ts",
                content: "let x =1;"
            };
            const file2 = {
                path: "/a/b/main2.ts",
                content: "let y =1;"
            };
            const configFile: ts.projectSystem.File = {
                path: "/a/b/tsconfig.json",
                content: `{
                    "compilerOptions": {
                        "target": "es6"
                    },
                    "files": [ "main.ts", "main2.ts" ]
                }`
            };
            const host = ts.projectSystem.createServerHost([file1, file2, configFile, ts.projectSystem.libFile]);
            const projectService = ts.projectSystem.createProjectService(host, { useSingleInferredProject: true });
            projectService.openClientFile(file1.path);
            ts.projectSystem.checkNumberOfConfiguredProjects(projectService, 1);
            const project = projectService.configuredProjects.get(configFile.path)!;
            assert.isTrue(project.hasOpenRef()); // file1
            projectService.closeClientFile(file1.path);
            ts.projectSystem.checkNumberOfConfiguredProjects(projectService, 1);
            assert.strictEqual(projectService.configuredProjects.get(configFile.path), project);
            assert.isFalse(project.hasOpenRef()); // No open files
            assert.isFalse(project.isClosed());
            projectService.openClientFile(file2.path);
            ts.projectSystem.checkNumberOfConfiguredProjects(projectService, 1);
            assert.strictEqual(projectService.configuredProjects.get(configFile.path), project);
            assert.isTrue(project.hasOpenRef()); // file2
            assert.isFalse(project.isClosed());
        });
        it("should not close configured project after closing last open file, but should be closed on next file open if its not the file from same project", () => {
            const file1 = {
                path: "/a/b/main.ts",
                content: "let x =1;"
            };
            const configFile: ts.projectSystem.File = {
                path: "/a/b/tsconfig.json",
                content: `{
                    "compilerOptions": {
                        "target": "es6"
                    },
                    "files": [ "main.ts" ]
                }`
            };
            const host = ts.projectSystem.createServerHost([file1, configFile, ts.projectSystem.libFile]);
            const projectService = ts.projectSystem.createProjectService(host, { useSingleInferredProject: true });
            projectService.openClientFile(file1.path);
            ts.projectSystem.checkNumberOfConfiguredProjects(projectService, 1);
            const project = projectService.configuredProjects.get(configFile.path)!;
            assert.isTrue(project.hasOpenRef()); // file1
            projectService.closeClientFile(file1.path);
            ts.projectSystem.checkNumberOfConfiguredProjects(projectService, 1);
            assert.strictEqual(projectService.configuredProjects.get(configFile.path), project);
            assert.isFalse(project.hasOpenRef()); // No files
            assert.isFalse(project.isClosed());
            projectService.openClientFile(ts.projectSystem.libFile.path);
            ts.projectSystem.checkNumberOfConfiguredProjects(projectService, 0);
            assert.isFalse(project.hasOpenRef()); // No files + project closed
            assert.isTrue(project.isClosed());
        });
        it("open file become a part of configured project if it is referenced from root file", () => {
            const file1 = {
                path: `${ts.tscWatch.projectRoot}/a/b/f1.ts`,
                content: "export let x = 5"
            };
            const file2 = {
                path: `${ts.tscWatch.projectRoot}/a/c/f2.ts`,
                content: `import {x} from "../b/f1"`
            };
            const file3 = {
                path: `${ts.tscWatch.projectRoot}/a/c/f3.ts`,
                content: "export let y = 1"
            };
            const configFile = {
                path: `${ts.tscWatch.projectRoot}/a/c/tsconfig.json`,
                content: JSON.stringify({ compilerOptions: {}, files: ["f2.ts", "f3.ts"] })
            };
            const host = ts.projectSystem.createServerHost([file1, file2, file3]);
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(file1.path);
            ts.projectSystem.checkNumberOfProjects(projectService, { inferredProjects: 1 });
            ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[0], [file1.path]);
            projectService.openClientFile(file3.path);
            ts.projectSystem.checkNumberOfProjects(projectService, { inferredProjects: 2 });
            ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[0], [file1.path]);
            ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[1], [file3.path]);
            host.reloadFS([file1, file2, file3, configFile]);
            host.checkTimeoutQueueLengthAndRun(2); // load configured project from disk + ensureProjectsForOpenFiles
            ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1, inferredProjects: 2 });
            ts.projectSystem.checkProjectActualFiles(ts.projectSystem.configuredProjectAt(projectService, 0), [file1.path, file2.path, file3.path, configFile.path]);
            assert.isTrue(projectService.inferredProjects[0].isOrphan());
            assert.isTrue(projectService.inferredProjects[1].isOrphan());
        });
        it("can correctly update configured project when set of root files has changed (new file on disk)", () => {
            const file1 = {
                path: "/a/b/f1.ts",
                content: "let x = 1"
            };
            const file2 = {
                path: "/a/b/f2.ts",
                content: "let y = 1"
            };
            const configFile = {
                path: "/a/b/tsconfig.json",
                content: JSON.stringify({ compilerOptions: {} })
            };
            const host = ts.projectSystem.createServerHost([file1, configFile]);
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(file1.path);
            ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1 });
            ts.projectSystem.checkProjectActualFiles(ts.projectSystem.configuredProjectAt(projectService, 0), [file1.path, configFile.path]);
            host.reloadFS([file1, file2, configFile]);
            host.checkTimeoutQueueLengthAndRun(2);
            ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1 });
            ts.projectSystem.checkProjectRootFiles(ts.projectSystem.configuredProjectAt(projectService, 0), [file1.path, file2.path]);
        });
        it("can correctly update configured project when set of root files has changed (new file in list of files)", () => {
            const file1 = {
                path: "/a/b/f1.ts",
                content: "let x = 1"
            };
            const file2 = {
                path: "/a/b/f2.ts",
                content: "let y = 1"
            };
            const configFile = {
                path: "/a/b/tsconfig.json",
                content: JSON.stringify({ compilerOptions: {}, files: ["f1.ts"] })
            };
            const host = ts.projectSystem.createServerHost([file1, file2, configFile]);
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(file1.path);
            ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1 });
            ts.projectSystem.checkProjectActualFiles(ts.projectSystem.configuredProjectAt(projectService, 0), [file1.path, configFile.path]);
            const modifiedConfigFile = {
                path: configFile.path,
                content: JSON.stringify({ compilerOptions: {}, files: ["f1.ts", "f2.ts"] })
            };
            host.reloadFS([file1, file2, modifiedConfigFile]);
            ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1 });
            host.checkTimeoutQueueLengthAndRun(2);
            ts.projectSystem.checkProjectRootFiles(ts.projectSystem.configuredProjectAt(projectService, 0), [file1.path, file2.path]);
        });
        it("can update configured project when set of root files was not changed", () => {
            const file1 = {
                path: "/a/b/f1.ts",
                content: "let x = 1"
            };
            const file2 = {
                path: "/a/b/f2.ts",
                content: "let y = 1"
            };
            const configFile = {
                path: "/a/b/tsconfig.json",
                content: JSON.stringify({ compilerOptions: {}, files: ["f1.ts", "f2.ts"] })
            };
            const host = ts.projectSystem.createServerHost([file1, file2, configFile]);
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(file1.path);
            ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1 });
            ts.projectSystem.checkProjectActualFiles(ts.projectSystem.configuredProjectAt(projectService, 0), [file1.path, file2.path, configFile.path]);
            const modifiedConfigFile = {
                path: configFile.path,
                content: JSON.stringify({ compilerOptions: { outFile: "out.js" }, files: ["f1.ts", "f2.ts"] })
            };
            host.reloadFS([file1, file2, modifiedConfigFile]);
            ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1 });
            ts.projectSystem.checkProjectRootFiles(ts.projectSystem.configuredProjectAt(projectService, 0), [file1.path, file2.path]);
        });
        it("Open ref of configured project when open file gets added to the project as part of configured file update", () => {
            const file1: ts.projectSystem.File = {
                path: "/a/b/src/file1.ts",
                content: "let x = 1;"
            };
            const file2: ts.projectSystem.File = {
                path: "/a/b/src/file2.ts",
                content: "let y = 1;"
            };
            const file3: ts.projectSystem.File = {
                path: "/a/b/file3.ts",
                content: "let z = 1;"
            };
            const file4: ts.projectSystem.File = {
                path: "/a/file4.ts",
                content: "let z = 1;"
            };
            const configFile = {
                path: "/a/b/tsconfig.json",
                content: JSON.stringify({ files: ["src/file1.ts", "file3.ts"] })
            };
            const files = [file1, file2, file3, file4];
            const host = ts.projectSystem.createServerHost(files.concat(configFile));
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(file1.path);
            projectService.openClientFile(file2.path);
            projectService.openClientFile(file3.path);
            projectService.openClientFile(file4.path);
            const infos = files.map(file => projectService.getScriptInfoForPath((file.path as ts.Path))!);
            ts.projectSystem.checkOpenFiles(projectService, files);
            ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1, inferredProjects: 2 });
            const configProject1 = projectService.configuredProjects.get(configFile.path)!;
            assert.isTrue(configProject1.hasOpenRef()); // file1 and file3
            ts.projectSystem.checkProjectActualFiles(configProject1, [file1.path, file3.path, configFile.path]);
            const inferredProject1 = projectService.inferredProjects[0];
            ts.projectSystem.checkProjectActualFiles(inferredProject1, [file2.path]);
            const inferredProject2 = projectService.inferredProjects[1];
            ts.projectSystem.checkProjectActualFiles(inferredProject2, [file4.path]);
            configFile.content = "{}";
            host.reloadFS(files.concat(configFile));
            host.runQueuedTimeoutCallbacks();
            verifyScriptInfos();
            ts.projectSystem.checkOpenFiles(projectService, files);
            verifyConfiguredProjectStateAfterUpdate(/*hasOpenRef*/ true, 2); // file1, file2, file3
            assert.isTrue(projectService.inferredProjects[0].isOrphan());
            const inferredProject3 = projectService.inferredProjects[1];
            ts.projectSystem.checkProjectActualFiles(inferredProject3, [file4.path]);
            assert.strictEqual(inferredProject3, inferredProject2);
            projectService.closeClientFile(file1.path);
            projectService.closeClientFile(file2.path);
            projectService.closeClientFile(file4.path);
            verifyScriptInfos();
            ts.projectSystem.checkOpenFiles(projectService, [file3]);
            verifyConfiguredProjectStateAfterUpdate(/*hasOpenRef*/ true, 2); // file3
            assert.isTrue(projectService.inferredProjects[0].isOrphan());
            assert.isTrue(projectService.inferredProjects[1].isOrphan());
            projectService.openClientFile(file4.path);
            verifyScriptInfos();
            ts.projectSystem.checkOpenFiles(projectService, [file3, file4]);
            verifyConfiguredProjectStateAfterUpdate(/*hasOpenRef*/ true, 1); // file3
            const inferredProject4 = projectService.inferredProjects[0];
            ts.projectSystem.checkProjectActualFiles(inferredProject4, [file4.path]);
            projectService.closeClientFile(file3.path);
            verifyScriptInfos();
            ts.projectSystem.checkOpenFiles(projectService, [file4]);
            verifyConfiguredProjectStateAfterUpdate(/*hasOpenRef*/ false, 1); // No open files
            const inferredProject5 = projectService.inferredProjects[0];
            ts.projectSystem.checkProjectActualFiles(inferredProject4, [file4.path]);
            assert.strictEqual(inferredProject5, inferredProject4);
            const file5: ts.projectSystem.File = {
                path: "/file5.ts",
                content: "let zz = 1;"
            };
            host.reloadFS(files.concat(configFile, file5));
            projectService.openClientFile(file5.path);
            verifyScriptInfosAreUndefined([file1, file2, file3]);
            assert.strictEqual(projectService.getScriptInfoForPath((file4.path as ts.Path)), ts.find(infos, info => info.path === file4.path));
            assert.isDefined(projectService.getScriptInfoForPath((file5.path as ts.Path)));
            ts.projectSystem.checkOpenFiles(projectService, [file4, file5]);
            ts.projectSystem.checkNumberOfProjects(projectService, { inferredProjects: 2 });
            ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[0], [file4.path]);
            ts.projectSystem.checkProjectActualFiles(projectService.inferredProjects[1], [file5.path]);
            function verifyScriptInfos() {
                infos.forEach(info => assert.strictEqual(projectService.getScriptInfoForPath(info.path), info));
            }
            function verifyScriptInfosAreUndefined(files: ts.projectSystem.File[]) {
                for (const file of files) {
                    assert.isUndefined(projectService.getScriptInfoForPath((file.path as ts.Path)));
                }
            }
            function verifyConfiguredProjectStateAfterUpdate(hasOpenRef: boolean, inferredProjects: number) {
                ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1, inferredProjects });
                const configProject2 = projectService.configuredProjects.get(configFile.path)!;
                assert.strictEqual(configProject2, configProject1);
                ts.projectSystem.checkProjectActualFiles(configProject2, [file1.path, file2.path, file3.path, configFile.path]);
                assert.equal(configProject2.hasOpenRef(), hasOpenRef);
            }
        });
        it("Open ref of configured project when open file gets added to the project as part of configured file update buts its open file references are all closed when the update happens", () => {
            const file1: ts.projectSystem.File = {
                path: "/a/b/src/file1.ts",
                content: "let x = 1;"
            };
            const file2: ts.projectSystem.File = {
                path: "/a/b/src/file2.ts",
                content: "let y = 1;"
            };
            const file3: ts.projectSystem.File = {
                path: "/a/b/file3.ts",
                content: "let z = 1;"
            };
            const file4: ts.projectSystem.File = {
                path: "/a/file4.ts",
                content: "let z = 1;"
            };
            const configFile = {
                path: "/a/b/tsconfig.json",
                content: JSON.stringify({ files: ["src/file1.ts", "file3.ts"] })
            };
            const files = [file1, file2, file3];
            const hostFiles = files.concat(file4, configFile);
            const host = ts.projectSystem.createServerHost(hostFiles);
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(file1.path);
            projectService.openClientFile(file2.path);
            projectService.openClientFile(file3.path);
            ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1, inferredProjects: 1 });
            const configuredProject = projectService.configuredProjects.get(configFile.path)!;
            assert.isTrue(configuredProject.hasOpenRef()); // file1 and file3
            ts.projectSystem.checkProjectActualFiles(configuredProject, [file1.path, file3.path, configFile.path]);
            const inferredProject1 = projectService.inferredProjects[0];
            ts.projectSystem.checkProjectActualFiles(inferredProject1, [file2.path]);
            projectService.closeClientFile(file1.path);
            projectService.closeClientFile(file3.path);
            assert.isFalse(configuredProject.hasOpenRef()); // No files
            configFile.content = "{}";
            host.reloadFS(files.concat(configFile));
            // Time out is not yet run so there is project update pending
            assert.isTrue(configuredProject.hasOpenRef()); // Pending update and file2 might get into the project
            projectService.openClientFile(file4.path);
            ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1, inferredProjects: 2 });
            assert.strictEqual(projectService.configuredProjects.get(configFile.path), configuredProject);
            assert.isTrue(configuredProject.hasOpenRef()); // Pending update and F2 might get into the project
            assert.strictEqual(projectService.inferredProjects[0], inferredProject1);
            const inferredProject2 = projectService.inferredProjects[1];
            ts.projectSystem.checkProjectActualFiles(inferredProject2, [file4.path]);
            host.runQueuedTimeoutCallbacks();
            ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1, inferredProjects: 2 });
            assert.strictEqual(projectService.configuredProjects.get(configFile.path), configuredProject);
            assert.isTrue(configuredProject.hasOpenRef()); // file2
            ts.projectSystem.checkProjectActualFiles(configuredProject, [file1.path, file2.path, file3.path, configFile.path]);
            assert.strictEqual(projectService.inferredProjects[0], inferredProject1);
            assert.isTrue(inferredProject1.isOrphan());
            assert.strictEqual(projectService.inferredProjects[1], inferredProject2);
            ts.projectSystem.checkProjectActualFiles(inferredProject2, [file4.path]);
        });
        it("files are properly detached when language service is disabled", () => {
            const f1 = {
                path: "/a/app.js",
                content: "var x = 1"
            };
            const f2 = {
                path: "/a/largefile.js",
                content: ""
            };
            const f3 = {
                path: "/a/lib.js",
                content: "var x = 1"
            };
            const config = {
                path: "/a/tsconfig.json",
                content: JSON.stringify({ compilerOptions: { allowJs: true } })
            };
            const host = ts.projectSystem.createServerHost([f1, f2, f3, config]);
            const originalGetFileSize = host.getFileSize;
            host.getFileSize = (filePath: string) => filePath === f2.path ? ts.server.maxProgramSizeForNonTsFiles + 1 : originalGetFileSize.call(host, filePath);
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(f1.path);
            projectService.checkNumberOfProjects({ configuredProjects: 1 });
            const project = projectService.configuredProjects.get(config.path)!;
            assert.isTrue(project.hasOpenRef()); // f1
            assert.isFalse(project.isClosed());
            projectService.closeClientFile(f1.path);
            projectService.checkNumberOfProjects({ configuredProjects: 1 });
            assert.strictEqual(projectService.configuredProjects.get(config.path), project);
            assert.isFalse(project.hasOpenRef()); // No files
            assert.isFalse(project.isClosed());
            for (const f of [f1, f2, f3]) {
                // All the script infos should be present and contain the project since it is still alive.
                const scriptInfo = (projectService.getScriptInfoForNormalizedPath(ts.server.toNormalizedPath(f.path))!);
                assert.equal(scriptInfo.containingProjects.length, 1, `expect 1 containing projects for '${f.path}'`);
                assert.equal(scriptInfo.containingProjects[0], project, `expect configured project to be the only containing project for '${f.path}'`);
            }
            const f4 = {
                path: "/aa.js",
                content: "var x = 1"
            };
            host.reloadFS([f1, f2, f3, config, f4]);
            projectService.openClientFile(f4.path);
            projectService.checkNumberOfProjects({ inferredProjects: 1 });
            assert.isFalse(project.hasOpenRef()); // No files
            assert.isTrue(project.isClosed());
            for (const f of [f1, f2, f3]) {
                // All the script infos should not be present since the project is closed and orphan script infos are collected
                assert.isUndefined(projectService.getScriptInfoForNormalizedPath(ts.server.toNormalizedPath(f.path)));
            }
        });
        it("syntactic features work even if language service is disabled", () => {
            const f1 = {
                path: "/a/app.js",
                content: "let x =   1;"
            };
            const f2 = {
                path: "/a/largefile.js",
                content: ""
            };
            const config = {
                path: "/a/jsconfig.json",
                content: "{}"
            };
            const host = ts.projectSystem.createServerHost([f1, f2, config]);
            const originalGetFileSize = host.getFileSize;
            host.getFileSize = (filePath: string) => filePath === f2.path ? ts.server.maxProgramSizeForNonTsFiles + 1 : originalGetFileSize.call(host, filePath);
            const { session, events } = ts.projectSystem.createSessionWithEventTracking<ts.server.ProjectLanguageServiceStateEvent>(host, ts.server.ProjectLanguageServiceStateEvent);
            session.executeCommand((<ts.projectSystem.protocol.OpenRequest>{
                seq: 0,
                type: "request",
                command: "open",
                arguments: { file: f1.path }
            }));
            const projectService = session.getProjectService();
            ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1 });
            const project = ts.projectSystem.configuredProjectAt(projectService, 0);
            assert.isFalse(project.languageServiceEnabled, "Language service enabled");
            assert.equal(events.length, 1, "should receive event");
            assert.equal(events[0].data.project, project, "project name");
            assert.isFalse(events[0].data.languageServiceEnabled, "Language service state");
            const options = projectService.getFormatCodeOptions((f1.path as ts.server.NormalizedPath));
            const edits = project.getLanguageService().getFormattingEditsForDocument(f1.path, options);
            assert.deepEqual(edits, [{ span: ts.createTextSpan(/*start*/ 7, /*length*/ 3), newText: " " }]);
        });
        it("when multiple projects are open, detects correct default project", () => {
            const barConfig: ts.projectSystem.File = {
                path: `${ts.tscWatch.projectRoot}/bar/tsconfig.json`,
                content: JSON.stringify({
                    include: ["index.ts"],
                    compilerOptions: {
                        lib: ["dom", "es2017"]
                    }
                })
            };
            const barIndex: ts.projectSystem.File = {
                path: `${ts.tscWatch.projectRoot}/bar/index.ts`,
                content: `
export function bar() {
  console.log("hello world");
}`
            };
            const fooConfig: ts.projectSystem.File = {
                path: `${ts.tscWatch.projectRoot}/foo/tsconfig.json`,
                content: JSON.stringify({
                    include: ["index.ts"],
                    compilerOptions: {
                        lib: ["es2017"]
                    }
                })
            };
            const fooIndex: ts.projectSystem.File = {
                path: `${ts.tscWatch.projectRoot}/foo/index.ts`,
                content: `
import { bar } from "bar";
bar();`
            };
            const barSymLink: ts.projectSystem.SymLink = {
                path: `${ts.tscWatch.projectRoot}/foo/node_modules/bar`,
                symLink: `${ts.tscWatch.projectRoot}/bar`
            };
            const lib2017: ts.projectSystem.File = {
                path: `${ts.getDirectoryPath(ts.projectSystem.libFile.path)}/lib.es2017.d.ts`,
                content: ts.projectSystem.libFile.content
            };
            const libDom: ts.projectSystem.File = {
                path: `${ts.getDirectoryPath(ts.projectSystem.libFile.path)}/lib.dom.d.ts`,
                content: `
declare var console: {
    log(...args: any[]): void;
};`
            };
            const host = ts.projectSystem.createServerHost([barConfig, barIndex, fooConfig, fooIndex, barSymLink, lib2017, libDom]);
            const session = ts.projectSystem.createSession(host, { canUseEvents: true, });
            ts.projectSystem.openFilesForSession([fooIndex, barIndex], session);
            ts.projectSystem.verifyGetErrRequest({
                session,
                host,
                expected: [
                    { file: barIndex, syntax: [], semantic: [], suggestion: [] },
                    { file: fooIndex, syntax: [], semantic: [], suggestion: [] },
                ]
            });
        });
    });
    describe("unittests:: tsserver:: ConfiguredProjects:: non-existing directories listed in config file input array", () => {
        it("should be tolerated without crashing the server", () => {
            const configFile = {
                path: "/a/b/tsconfig.json",
                content: `{
                    "compilerOptions": {},
                    "include": ["app/*", "test/**/*", "something"]
                }`
            };
            const file1 = {
                path: "/a/b/file1.ts",
                content: "let t = 10;"
            };
            const host = ts.projectSystem.createServerHost([file1, configFile]);
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(file1.path);
            host.runQueuedTimeoutCallbacks();
            // Since file1 refers to config file as the default project, it needs to be kept alive
            ts.projectSystem.checkNumberOfProjects(projectService, { inferredProjects: 1, configuredProjects: 1 });
            const inferredProject = projectService.inferredProjects[0];
            assert.isTrue(inferredProject.containsFile((<ts.server.NormalizedPath>file1.path)));
            assert.isFalse(projectService.configuredProjects.get(configFile.path)!.containsFile((<ts.server.NormalizedPath>file1.path)));
        });
        it("should be able to handle @types if input file list is empty", () => {
            const f = {
                path: "/a/app.ts",
                content: "let x = 1"
            };
            const config = {
                path: "/a/tsconfig.json",
                content: JSON.stringify({
                    compiler: {},
                    files: []
                })
            };
            const t1 = {
                path: "/a/node_modules/@types/typings/index.d.ts",
                content: `export * from "./lib"`
            };
            const t2 = {
                path: "/a/node_modules/@types/typings/lib.d.ts",
                content: `export const x: number`
            };
            const host = ts.projectSystem.createServerHost([f, config, t1, t2], { currentDirectory: ts.getDirectoryPath(f.path) });
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(f.path);
            // Since f refers to config file as the default project, it needs to be kept alive
            projectService.checkNumberOfProjects({ configuredProjects: 1, inferredProjects: 1 });
        });
        it("should tolerate invalid include files that start in subDirectory", () => {
            const f = {
                path: `${ts.tscWatch.projectRoot}/src/server/index.ts`,
                content: "let x = 1"
            };
            const config = {
                path: `${ts.tscWatch.projectRoot}/src/server/tsconfig.json`,
                content: JSON.stringify({
                    compiler: {
                        module: "commonjs",
                        outDir: "../../build"
                    },
                    include: [
                        "../src/**/*.ts"
                    ]
                })
            };
            const host = ts.projectSystem.createServerHost([f, config, ts.projectSystem.libFile], { useCaseSensitiveFileNames: true });
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(f.path);
            // Since f refers to config file as the default project, it needs to be kept alive
            projectService.checkNumberOfProjects({ configuredProjects: 1, inferredProjects: 1 });
        });
        it("Changed module resolution reflected when specifying files list", () => {
            const file1: ts.projectSystem.File = {
                path: "/a/b/file1.ts",
                content: 'import classc from "file2"'
            };
            const file2a: ts.projectSystem.File = {
                path: "/a/file2.ts",
                content: "export classc { method2a() { return 10; } }"
            };
            const file2: ts.projectSystem.File = {
                path: "/a/b/file2.ts",
                content: "export classc { method2() { return 10; } }"
            };
            const configFile: ts.projectSystem.File = {
                path: "/a/b/tsconfig.json",
                content: JSON.stringify({ files: [file1.path], compilerOptions: { module: "amd" } })
            };
            const files = [file1, file2a, configFile, ts.projectSystem.libFile];
            const host = ts.projectSystem.createServerHost(files);
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(file1.path);
            ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1 });
            const project = projectService.configuredProjects.get(configFile.path)!;
            assert.isDefined(project);
            ts.projectSystem.checkProjectActualFiles(project, ts.map(files, file => file.path));
            ts.projectSystem.checkWatchedFiles(host, ts.mapDefined(files, file => file === file1 ? undefined : file.path));
            ts.projectSystem.checkWatchedDirectoriesDetailed(host, ["/a/b"], 1, /*recursive*/ false);
            ts.projectSystem.checkWatchedDirectoriesDetailed(host, ["/a/b/node_modules/@types"], 1, /*recursive*/ true);
            files.push(file2);
            host.reloadFS(files);
            host.runQueuedTimeoutCallbacks();
            ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1 });
            assert.strictEqual(projectService.configuredProjects.get(configFile.path), project);
            ts.projectSystem.checkProjectActualFiles(project, ts.mapDefined(files, file => file === file2a ? undefined : file.path));
            ts.projectSystem.checkWatchedFiles(host, ts.mapDefined(files, file => file === file1 ? undefined : file.path));
            ts.projectSystem.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ false);
            ts.projectSystem.checkWatchedDirectoriesDetailed(host, ["/a/b/node_modules/@types"], 1, /*recursive*/ true);
            // On next file open the files file2a should be closed and not watched any more
            projectService.openClientFile(file2.path);
            ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1 });
            assert.strictEqual(projectService.configuredProjects.get(configFile.path), project);
            ts.projectSystem.checkProjectActualFiles(project, ts.mapDefined(files, file => file === file2a ? undefined : file.path));
            ts.projectSystem.checkWatchedFiles(host, [ts.projectSystem.libFile.path, configFile.path]);
            ts.projectSystem.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ false);
            ts.projectSystem.checkWatchedDirectoriesDetailed(host, ["/a/b/node_modules/@types"], 1, /*recursive*/ true);
        });
        it("Failed lookup locations uses parent most node_modules directory", () => {
            const root = "/user/username/rootfolder";
            const file1: ts.projectSystem.File = {
                path: "/a/b/src/file1.ts",
                content: 'import { classc } from "module1"'
            };
            const module1: ts.projectSystem.File = {
                path: "/a/b/node_modules/module1/index.d.ts",
                content: `import { class2 } from "module2";
                          export classc { method2a(): class2; }`
            };
            const module2: ts.projectSystem.File = {
                path: "/a/b/node_modules/module2/index.d.ts",
                content: "export class2 { method2() { return 10; } }"
            };
            const module3: ts.projectSystem.File = {
                path: "/a/b/node_modules/module/node_modules/module3/index.d.ts",
                content: "export class3 { method2() { return 10; } }"
            };
            const configFile: ts.projectSystem.File = {
                path: "/a/b/src/tsconfig.json",
                content: JSON.stringify({ files: ["file1.ts"] })
            };
            const nonLibFiles = [file1, module1, module2, module3, configFile];
            nonLibFiles.forEach(f => f.path = root + f.path);
            const files = nonLibFiles.concat(ts.projectSystem.libFile);
            const host = ts.projectSystem.createServerHost(files);
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(file1.path);
            ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 1 });
            const project = projectService.configuredProjects.get(configFile.path)!;
            assert.isDefined(project);
            ts.projectSystem.checkProjectActualFiles(project, [file1.path, ts.projectSystem.libFile.path, module1.path, module2.path, configFile.path]);
            ts.projectSystem.checkWatchedFiles(host, [ts.projectSystem.libFile.path, configFile.path]);
            ts.projectSystem.checkWatchedDirectories(host, [], /*recursive*/ false);
            const watchedRecursiveDirectories = ts.projectSystem.getTypeRootsFromLocation(root + "/a/b/src");
            watchedRecursiveDirectories.push(`${root}/a/b/src/node_modules`, `${root}/a/b/node_modules`);
            ts.projectSystem.checkWatchedDirectories(host, watchedRecursiveDirectories, /*recursive*/ true);
        });
    });
}
