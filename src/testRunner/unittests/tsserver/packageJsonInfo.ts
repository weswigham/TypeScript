namespace ts.projectSystem {
    const tsConfig: ts.projectSystem.File = {
        path: "/tsconfig.json",
        content: "{}"
    };
    const packageJsonContent = {
        dependencies: {
            redux: "*"
        },
        peerDependencies: {
            react: "*"
        },
        optionalDependencies: {
            typescript: "*"
        },
        devDependencies: {
            webpack: "*"
        }
    };
    const packageJson: ts.projectSystem.File = {
        path: "/package.json",
        content: JSON.stringify(packageJsonContent, undefined, 2)
    };
    describe("unittests:: tsserver:: packageJsonInfo", () => {
        it("detects new package.json files that are added, caches them, and watches them", () => {
            // Initialize project without package.json
            const { project, host } = setup([tsConfig]);
            assert.isUndefined(project.packageJsonCache.getInDirectory(("/" as ts.Path)));
            // Add package.json
            host.reloadFS([tsConfig, packageJson]);
            let packageJsonInfo = (project.packageJsonCache.getInDirectory(("/" as ts.Path))!);
            assert.ok(packageJsonInfo);
            assert.ok(packageJsonInfo.dependencies);
            assert.ok(packageJsonInfo.devDependencies);
            assert.ok(packageJsonInfo.peerDependencies);
            assert.ok(packageJsonInfo.optionalDependencies);
            // Edit package.json
            host.reloadFS([
                tsConfig,
                {
                    ...packageJson,
                    content: JSON.stringify({
                        ...packageJsonContent,
                        dependencies: undefined
                    })
                }
            ]);
            packageJsonInfo = (project.packageJsonCache.getInDirectory(("/" as ts.Path))!);
            assert.isUndefined(packageJsonInfo.dependencies);
        });
        it("finds package.json on demand, watches for deletion, and removes them from cache", () => {
            // Initialize project with package.json
            const { project, host } = setup();
            project.getPackageJsonsVisibleToFile(("/src/whatever/blah.ts" as ts.Path));
            assert.ok(project.packageJsonCache.getInDirectory(("/" as ts.Path)));
            // Delete package.json
            host.reloadFS([tsConfig]);
            assert.isUndefined(project.packageJsonCache.getInDirectory(("/" as ts.Path)));
        });
        it("finds multiple package.json files when present", () => {
            // Initialize project with package.json at root
            const { project, host } = setup();
            // Add package.json in /src
            host.reloadFS([tsConfig, packageJson, { ...packageJson, path: "/src/package.json" }]);
            assert.lengthOf(project.getPackageJsonsVisibleToFile(("/a.ts" as ts.Path)), 1);
            assert.lengthOf(project.getPackageJsonsVisibleToFile(("/src/b.ts" as ts.Path)), 2);
        });
        it("handles errors in json parsing of package.json", () => {
            const packageJsonContent = `{ "mod" }`;
            const { project, host } = setup([tsConfig, { path: packageJson.path, content: packageJsonContent }]);
            project.getPackageJsonsVisibleToFile(("/src/whatever/blah.ts" as ts.Path));
            const packageJsonInfo = (project.packageJsonCache.getInDirectory(("/" as ts.Path))!);
            assert.isUndefined(packageJsonInfo);
            host.writeFile(packageJson.path, packageJson.content);
            project.getPackageJsonsVisibleToFile(("/src/whatever/blah.ts" as ts.Path));
            const packageJsonInfo2 = (project.packageJsonCache.getInDirectory(("/" as ts.Path))!);
            assert.ok(packageJsonInfo2);
            assert.ok(packageJsonInfo2.dependencies);
            assert.ok(packageJsonInfo2.devDependencies);
            assert.ok(packageJsonInfo2.peerDependencies);
            assert.ok(packageJsonInfo2.optionalDependencies);
        });
    });
    function setup(files: readonly ts.projectSystem.File[] = [tsConfig, packageJson]) {
        const host = ts.projectSystem.createServerHost(files);
        const session = ts.projectSystem.createSession(host);
        const projectService = session.getProjectService();
        projectService.openClientFile(files[0].path);
        const project = ts.projectSystem.configuredProjectAt(projectService, 0);
        return { host, session, project, projectService };
    }
}
