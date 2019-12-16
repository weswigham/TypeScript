import * as ts from "../../ts";
describe("unittests:: tsserver:: searching for config file", () => {
    it("should stop at projectRootPath if given", () => {
        const f1 = {
            path: "/a/file1.ts",
            content: ""
        };
        const configFile = {
            path: "/tsconfig.json",
            content: "{}"
        };
        const host = ts.projectSystem.createServerHost([f1, configFile]);
        const service = ts.projectSystem.createProjectService(host);
        service.openClientFile(f1.path, /*fileContent*/ undefined, /*scriptKind*/ undefined, "/a");
        ts.projectSystem.checkNumberOfConfiguredProjects(service, 0);
        ts.projectSystem.checkNumberOfInferredProjects(service, 1);
        service.closeClientFile(f1.path);
        service.openClientFile(f1.path);
        ts.projectSystem.checkNumberOfConfiguredProjects(service, 1);
        ts.projectSystem.checkNumberOfInferredProjects(service, 0);
    });
    it("should use projectRootPath when searching for inferred project again", () => {
        const projectDir = "/a/b/projects/project";
        const configFileLocation = `${projectDir}/src`;
        const f1 = {
            path: `${configFileLocation}/file1.ts`,
            content: ""
        };
        const configFile = {
            path: `${configFileLocation}/tsconfig.json`,
            content: "{}"
        };
        const configFile2 = {
            path: "/a/b/projects/tsconfig.json",
            content: "{}"
        };
        const host = ts.projectSystem.createServerHost([f1, ts.projectSystem.libFile, configFile, configFile2]);
        const service = ts.projectSystem.createProjectService(host);
        service.openClientFile(f1.path, /*fileContent*/ undefined, /*scriptKind*/ undefined, projectDir);
        ts.projectSystem.checkNumberOfProjects(service, { configuredProjects: 1 });
        assert.isDefined(service.configuredProjects.get(configFile.path));
        ts.projectSystem.checkWatchedFiles(host, [ts.projectSystem.libFile.path, configFile.path]);
        ts.projectSystem.checkWatchedDirectories(host, [], /*recursive*/ false);
        const typeRootLocations = ts.projectSystem.getTypeRootsFromLocation(configFileLocation);
        ts.projectSystem.checkWatchedDirectories(host, typeRootLocations.concat(configFileLocation), /*recursive*/ true);
        // Delete config file - should create inferred project and not configured project
        host.reloadFS([f1, ts.projectSystem.libFile, configFile2]);
        host.runQueuedTimeoutCallbacks();
        ts.projectSystem.checkNumberOfProjects(service, { inferredProjects: 1 });
        ts.projectSystem.checkWatchedFiles(host, [ts.projectSystem.libFile.path, configFile.path, `${configFileLocation}/jsconfig.json`, `${projectDir}/tsconfig.json`, `${projectDir}/jsconfig.json`]);
        ts.projectSystem.checkWatchedDirectories(host, [], /*recursive*/ false);
        ts.projectSystem.checkWatchedDirectories(host, typeRootLocations, /*recursive*/ true);
    });
    it("should use projectRootPath when searching for inferred project again 2", () => {
        const projectDir = "/a/b/projects/project";
        const configFileLocation = `${projectDir}/src`;
        const f1 = {
            path: `${configFileLocation}/file1.ts`,
            content: ""
        };
        const configFile = {
            path: `${configFileLocation}/tsconfig.json`,
            content: "{}"
        };
        const configFile2 = {
            path: "/a/b/projects/tsconfig.json",
            content: "{}"
        };
        const host = ts.projectSystem.createServerHost([f1, ts.projectSystem.libFile, configFile, configFile2]);
        const service = ts.projectSystem.createProjectService(host, { useSingleInferredProject: true }, { useInferredProjectPerProjectRoot: true });
        service.openClientFile(f1.path, /*fileContent*/ undefined, /*scriptKind*/ undefined, projectDir);
        ts.projectSystem.checkNumberOfProjects(service, { configuredProjects: 1 });
        assert.isDefined(service.configuredProjects.get(configFile.path));
        ts.projectSystem.checkWatchedFiles(host, [ts.projectSystem.libFile.path, configFile.path]);
        ts.projectSystem.checkWatchedDirectories(host, [], /*recursive*/ false);
        ts.projectSystem.checkWatchedDirectories(host, ts.projectSystem.getTypeRootsFromLocation(configFileLocation).concat(configFileLocation), /*recursive*/ true);
        // Delete config file - should create inferred project with project root path set
        host.reloadFS([f1, ts.projectSystem.libFile, configFile2]);
        host.runQueuedTimeoutCallbacks();
        ts.projectSystem.checkNumberOfProjects(service, { inferredProjects: 1 });
        assert.equal(service.inferredProjects[0].projectRootPath, projectDir);
        ts.projectSystem.checkWatchedFiles(host, [ts.projectSystem.libFile.path, configFile.path, `${configFileLocation}/jsconfig.json`, `${projectDir}/tsconfig.json`, `${projectDir}/jsconfig.json`]);
        ts.projectSystem.checkWatchedDirectories(host, [], /*recursive*/ false);
        ts.projectSystem.checkWatchedDirectories(host, ts.projectSystem.getTypeRootsFromLocation(projectDir), /*recursive*/ true);
    });
    describe("when the opened file is not from project root", () => {
        const projectRoot = "/a/b/projects/project";
        const file: ts.projectSystem.File = {
            path: `${projectRoot}/src/index.ts`,
            content: "let y = 10"
        };
        const tsconfig: ts.projectSystem.File = {
            path: `${projectRoot}/tsconfig.json`,
            content: "{}"
        };
        const files = [file, ts.projectSystem.libFile];
        const filesWithConfig = files.concat(tsconfig);
        const dirOfFile = ts.getDirectoryPath(file.path);
        function openClientFile(files: ts.projectSystem.File[]) {
            const host = ts.projectSystem.createServerHost(files);
            const projectService = ts.projectSystem.createProjectService(host);
            projectService.openClientFile(file.path, /*fileContent*/ undefined, /*scriptKind*/ undefined, "/a/b/projects/proj");
            return { host, projectService };
        }
        function verifyConfiguredProject(host: ts.projectSystem.TestServerHost, projectService: ts.projectSystem.TestProjectService, orphanInferredProject?: boolean) {
            projectService.checkNumberOfProjects({ configuredProjects: 1, inferredProjects: orphanInferredProject ? 1 : 0 });
            const project = ts.Debug.assertDefined(projectService.configuredProjects.get(tsconfig.path));
            if (orphanInferredProject) {
                const inferredProject = projectService.inferredProjects[0];
                assert.isTrue(inferredProject.isOrphan());
            }
            ts.projectSystem.checkProjectActualFiles(project, [file.path, ts.projectSystem.libFile.path, tsconfig.path]);
            ts.projectSystem.checkWatchedFiles(host, [ts.projectSystem.libFile.path, tsconfig.path]);
            ts.projectSystem.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ false);
            ts.projectSystem.checkWatchedDirectories(host, (orphanInferredProject ? [projectRoot, `${dirOfFile}/node_modules/@types`] : [projectRoot]).concat(ts.projectSystem.getTypeRootsFromLocation(projectRoot)), /*recursive*/ true);
        }
        function verifyInferredProject(host: ts.projectSystem.TestServerHost, projectService: ts.projectSystem.TestProjectService) {
            projectService.checkNumberOfProjects({ inferredProjects: 1 });
            const project = projectService.inferredProjects[0];
            assert.isDefined(project);
            const filesToWatch = [ts.projectSystem.libFile.path, ...ts.projectSystem.getConfigFilesToWatch(dirOfFile)];
            ts.projectSystem.checkProjectActualFiles(project, [file.path, ts.projectSystem.libFile.path]);
            ts.projectSystem.checkWatchedFiles(host, filesToWatch);
            ts.projectSystem.checkWatchedDirectories(host, ts.emptyArray, /*recursive*/ false);
            ts.projectSystem.checkWatchedDirectories(host, ts.projectSystem.getTypeRootsFromLocation(dirOfFile), /*recursive*/ true);
        }
        it("tsconfig for the file exists", () => {
            const { host, projectService } = openClientFile(filesWithConfig);
            verifyConfiguredProject(host, projectService);
            host.reloadFS(files);
            host.runQueuedTimeoutCallbacks();
            verifyInferredProject(host, projectService);
            host.reloadFS(filesWithConfig);
            host.runQueuedTimeoutCallbacks();
            verifyConfiguredProject(host, projectService, /*orphanInferredProject*/ true);
        });
        it("tsconfig for the file does not exist", () => {
            const { host, projectService } = openClientFile(files);
            verifyInferredProject(host, projectService);
            host.reloadFS(filesWithConfig);
            host.runQueuedTimeoutCallbacks();
            verifyConfiguredProject(host, projectService, /*orphanInferredProject*/ true);
            host.reloadFS(files);
            host.runQueuedTimeoutCallbacks();
            verifyInferredProject(host, projectService);
        });
    });
    describe("should not search and watch config files from directories that cannot be watched", () => {
        const root = "/root/teams/VSCode68/Shared Documents/General/jt-ts-test-workspace";
        function verifyConfigFileWatch(projectRootPath: string | undefined) {
            const path = `${root}/x.js`;
            const host = ts.projectSystem.createServerHost([ts.projectSystem.libFile, { path, content: "const x = 10" }], { useCaseSensitiveFileNames: true });
            const service = ts.projectSystem.createProjectService(host);
            service.openClientFile(path, /*fileContent*/ undefined, /*scriptKind*/ undefined, projectRootPath);
            ts.projectSystem.checkNumberOfProjects(service, { inferredProjects: 1 });
            ts.projectSystem.checkProjectActualFiles(service.inferredProjects[0], [path, ts.projectSystem.libFile.path]);
            ts.projectSystem.checkWatchedFilesDetailed(host, [ts.projectSystem.libFile.path, ...ts.projectSystem.getConfigFilesToWatch(root)], 1);
        }
        it("when projectRootPath is not present", () => {
            verifyConfigFileWatch(/*projectRootPath*/ undefined);
        });
        it("when projectRootPath is present but file is not from project root", () => {
            verifyConfigFileWatch("/a/b");
        });
    });
});
