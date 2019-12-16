import * as ts from "../../ts";
describe("unittests:: tsserver:: symLinks", () => {
    it("rename in common file renames all project", () => {
        const projects = "/users/username/projects";
        const folderA = `${projects}/a`;
        const aFile: ts.projectSystem.File = {
            path: `${folderA}/a.ts`,
            content: `import {C} from "./c/fc"; console.log(C)`
        };
        const aTsconfig: ts.projectSystem.File = {
            path: `${folderA}/tsconfig.json`,
            content: JSON.stringify({ compilerOptions: { module: "commonjs" } })
        };
        const aC: ts.projectSystem.SymLink = {
            path: `${folderA}/c`,
            symLink: "../c"
        };
        const aFc = `${folderA}/c/fc.ts`;
        const folderB = `${projects}/b`;
        const bFile: ts.projectSystem.File = {
            path: `${folderB}/b.ts`,
            content: `import {C} from "./c/fc"; console.log(C)`
        };
        const bTsconfig: ts.projectSystem.File = {
            path: `${folderB}/tsconfig.json`,
            content: JSON.stringify({ compilerOptions: { module: "commonjs" } })
        };
        const bC: ts.projectSystem.SymLink = {
            path: `${folderB}/c`,
            symLink: "../c"
        };
        const bFc = `${folderB}/c/fc.ts`;
        const folderC = `${projects}/c`;
        const cFile: ts.projectSystem.File = {
            path: `${folderC}/fc.ts`,
            content: `export const C = 8`
        };
        const files = [cFile, ts.projectSystem.libFile, aFile, aTsconfig, aC, bFile, bTsconfig, bC];
        const host = ts.projectSystem.createServerHost(files);
        const session = ts.projectSystem.createSession(host);
        const projectService = session.getProjectService();
        ts.projectSystem.openFilesForSession([
            { file: aFile, projectRootPath: folderA },
            { file: bFile, projectRootPath: folderB },
            { file: aFc, projectRootPath: folderA },
            { file: bFc, projectRootPath: folderB },
        ], session);
        ts.projectSystem.checkNumberOfProjects(projectService, { configuredProjects: 2 });
        assert.isDefined(projectService.configuredProjects.get(aTsconfig.path));
        assert.isDefined(projectService.configuredProjects.get(bTsconfig.path));
        const response = ts.projectSystem.executeSessionRequest<ts.projectSystem.protocol.RenameRequest, ts.projectSystem.protocol.RenameResponse>(session, ts.projectSystem.protocol.CommandTypes.Rename, { file: aFc, ...ts.projectSystem.protocolLocationFromSubstring(cFile.content, "C") });
        assert.equal(aFile.content, bFile.content);
        const abLocs: ts.projectSystem.protocol.RenameTextSpan[] = [
            ts.projectSystem.protocolRenameSpanFromSubstring({
                fileText: aFile.content,
                text: "C",
                contextText: `import {C} from "./c/fc";`
            }),
            ts.projectSystem.protocolRenameSpanFromSubstring({
                fileText: aFile.content,
                text: "C",
                options: { index: 1 }
            }),
        ];
        const span = ts.projectSystem.protocolRenameSpanFromSubstring({
            fileText: cFile.content,
            text: "C",
            contextText: "export const C = 8"
        });
        const cLocs: ts.projectSystem.protocol.RenameTextSpan[] = [span];
        assert.deepEqual<ts.projectSystem.protocol.RenameResponseBody | undefined>(response, {
            info: {
                canRename: true,
                displayName: "C",
                fileToRename: undefined,
                fullDisplayName: '"/users/username/projects/a/c/fc".C',
                kind: ts.ScriptElementKind.constElement,
                kindModifiers: ts.ScriptElementKindModifier.exportedModifier,
                triggerSpan: ts.projectSystem.protocolTextSpanFromSubstring(cFile.content, "C"),
            },
            locs: [
                { file: aFc, locs: cLocs },
                { file: aFile.path, locs: abLocs },
                { file: bFc, locs: cLocs },
                { file: bFile.path, locs: abLocs },
            ],
        });
    });
    describe("module resolution when symlinked folder contents change and resolve modules", () => {
        const projectRootPath = "/users/username/projects/myproject";
        const packages = `${projectRootPath}/javascript/packages`;
        const recognizersDateTime = `${packages}/recognizers-date-time`;
        const recognizersText = `${packages}/recognizers-text`;
        const recognizersTextDist = `${recognizersText}/dist`;
        const moduleName = "@microsoft/recognizers-text";
        const moduleNameInFile = `"${moduleName}"`;
        const recognizersDateTimeSrcFile: ts.projectSystem.File = {
            path: `${recognizersDateTime}/src/datetime/baseDate.ts`,
            content: `import {C} from ${moduleNameInFile};
new C();`
        };
        const recognizerDateTimeTsconfigPath = `${recognizersDateTime}/tsconfig.json`;
        const recognizerDateTimeTsconfigWithoutPathMapping: ts.projectSystem.File = {
            path: recognizerDateTimeTsconfigPath,
            content: JSON.stringify({
                include: ["src"]
            })
        };
        const recognizerDateTimeTsconfigWithPathMapping: ts.projectSystem.File = {
            path: recognizerDateTimeTsconfigPath,
            content: JSON.stringify({
                compilerOptions: {
                    rootDir: "src",
                    baseUrl: "./",
                    paths: {
                        "@microsoft/*": ["../*"]
                    }
                },
                include: ["src"]
            })
        };
        const nodeModulesRecorgnizersText: ts.projectSystem.SymLink = {
            path: `${recognizersDateTime}/node_modules/@microsoft/recognizers-text`,
            symLink: recognizersText
        };
        const recognizerTextSrcFile: ts.projectSystem.File = {
            path: `${recognizersText}/src/recognizers-text.ts`,
            content: `export class C { method () { return 10; } }`
        };
        const recongnizerTextDistTypingFile: ts.projectSystem.File = {
            path: `${recognizersTextDist}/types/recognizers-text.d.ts`,
            content: `export class C { method(): number; }`
        };
        const recongnizerTextPackageJson: ts.projectSystem.File = {
            path: `${recognizersText}/package.json`,
            content: JSON.stringify({
                typings: "dist/types/recognizers-text.d.ts"
            })
        };
        const filesInProjectWithUnresolvedModule = [recognizerDateTimeTsconfigPath, ts.projectSystem.libFile.path, recognizersDateTimeSrcFile.path];
        const filesInProjectWithResolvedModule = [...filesInProjectWithUnresolvedModule, recongnizerTextDistTypingFile.path];
        function verifyErrors(session: ts.projectSystem.TestSession, semanticErrors: ts.projectSystem.protocol.Diagnostic[]) {
            ts.projectSystem.verifyGetErrRequest({
                session,
                host: session.testhost,
                expected: [{
                        file: recognizersDateTimeSrcFile,
                        syntax: [],
                        semantic: semanticErrors,
                        suggestion: []
                    }]
            });
        }
        function verifyWatchedFilesAndDirectories(host: ts.projectSystem.TestServerHost, files: string[], recursiveDirectories: ts.ReadonlyMap<number>, nonRecursiveDirectories: string[]) {
            ts.projectSystem.checkWatchedFilesDetailed(host, files.filter(f => f !== recognizersDateTimeSrcFile.path), 1);
            ts.projectSystem.checkWatchedDirectoriesDetailed(host, nonRecursiveDirectories, 1, /*recursive*/ false);
            ts.projectSystem.checkWatchedDirectoriesDetailed(host, recursiveDirectories, /*recursive*/ true);
        }
        function createSessionAndOpenFile(host: ts.projectSystem.TestServerHost) {
            const session = ts.projectSystem.createSession(host, { canUseEvents: true });
            session.executeCommandSeq<ts.projectSystem.protocol.OpenRequest>({
                command: ts.projectSystem.protocol.CommandTypes.Open,
                arguments: {
                    file: recognizersDateTimeSrcFile.path,
                    projectRootPath
                }
            });
            return session;
        }
        function verifyModuleResolution(withPathMapping: boolean) {
            describe(withPathMapping ? "when tsconfig file contains path mapping" : "when tsconfig does not contain path mapping", () => {
                const filesWithSources = [ts.projectSystem.libFile, recognizersDateTimeSrcFile, withPathMapping ? recognizerDateTimeTsconfigWithPathMapping : recognizerDateTimeTsconfigWithoutPathMapping, recognizerTextSrcFile, recongnizerTextPackageJson];
                const filesWithNodeModulesSetup = [...filesWithSources, nodeModulesRecorgnizersText];
                const filesAfterCompilation = [...filesWithNodeModulesSetup, recongnizerTextDistTypingFile];
                const watchedDirectoriesWithResolvedModule = ts.arrayToMap(ts.projectSystem.getTypeRootsFromLocation(recognizersDateTime), k => k, () => 1);
                watchedDirectoriesWithResolvedModule.set(`${recognizersDateTime}/src`, withPathMapping ? 1 : 2); // wild card + failed lookups
                if (!withPathMapping) {
                    watchedDirectoriesWithResolvedModule.set(`${recognizersDateTime}/node_modules`, 1); // failed lookups
                }
                const watchedDirectoriesWithUnresolvedModule = ts.cloneMap(watchedDirectoriesWithResolvedModule);
                watchedDirectoriesWithUnresolvedModule.set(`${recognizersDateTime}/src`, 2); // wild card + failed lookups
                [`${recognizersDateTime}/node_modules`, ...(withPathMapping ? [recognizersText] : ts.emptyArray), ...ts.projectSystem.getNodeModuleDirectories(packages)].forEach(d => {
                    watchedDirectoriesWithUnresolvedModule.set(d, 1);
                });
                const nonRecursiveWatchedDirectories = withPathMapping ? [packages] : ts.emptyArray;
                function verifyProjectWithResolvedModule(session: ts.projectSystem.TestSession) {
                    const projectService = session.getProjectService();
                    const project = projectService.configuredProjects.get(recognizerDateTimeTsconfigPath)!;
                    ts.projectSystem.checkProjectActualFiles(project, filesInProjectWithResolvedModule);
                    verifyWatchedFilesAndDirectories(session.testhost, filesInProjectWithResolvedModule, watchedDirectoriesWithResolvedModule, nonRecursiveWatchedDirectories);
                    verifyErrors(session, []);
                }
                function verifyProjectWithUnresolvedModule(session: ts.projectSystem.TestSession) {
                    const projectService = session.getProjectService();
                    const project = projectService.configuredProjects.get(recognizerDateTimeTsconfigPath)!;
                    ts.projectSystem.checkProjectActualFiles(project, filesInProjectWithUnresolvedModule);
                    verifyWatchedFilesAndDirectories(session.testhost, filesInProjectWithUnresolvedModule, watchedDirectoriesWithUnresolvedModule, nonRecursiveWatchedDirectories);
                    const startOffset = recognizersDateTimeSrcFile.content.indexOf('"') + 1;
                    verifyErrors(session, [
                        ts.projectSystem.createDiagnostic({ line: 1, offset: startOffset }, { line: 1, offset: startOffset + moduleNameInFile.length }, ts.Diagnostics.Cannot_find_module_0, [moduleName])
                    ]);
                }
                it("when project compiles from sources", () => {
                    const host = ts.projectSystem.createServerHost(filesWithSources);
                    const session = createSessionAndOpenFile(host);
                    verifyProjectWithUnresolvedModule(session);
                    host.reloadFS(filesAfterCompilation);
                    host.runQueuedTimeoutCallbacks();
                    verifyProjectWithResolvedModule(session);
                });
                it("when project has node_modules setup but doesnt have modules in typings folder and then recompiles", () => {
                    const host = ts.projectSystem.createServerHost(filesWithNodeModulesSetup);
                    const session = createSessionAndOpenFile(host);
                    verifyProjectWithUnresolvedModule(session);
                    host.reloadFS(filesAfterCompilation);
                    host.runQueuedTimeoutCallbacks();
                    if (withPathMapping) {
                        verifyProjectWithResolvedModule(session);
                    }
                    else {
                        // Cannot handle the resolution update
                        verifyProjectWithUnresolvedModule(session);
                    }
                });
                it("when project recompiles after deleting generated folders", () => {
                    const host = ts.projectSystem.createServerHost(filesAfterCompilation);
                    const session = createSessionAndOpenFile(host);
                    verifyProjectWithResolvedModule(session);
                    host.deleteFolder(recognizersTextDist, /*recursive*/ true);
                    host.runQueuedTimeoutCallbacks();
                    verifyProjectWithUnresolvedModule(session);
                    host.ensureFileOrFolder(recongnizerTextDistTypingFile);
                    host.runQueuedTimeoutCallbacks();
                    if (withPathMapping) {
                        verifyProjectWithResolvedModule(session);
                    }
                    else {
                        // Cannot handle the resolution update
                        verifyProjectWithUnresolvedModule(session);
                    }
                });
            });
        }
        verifyModuleResolution(/*withPathMapping*/ false);
        verifyModuleResolution(/*withPathMapping*/ true);
    });
});
