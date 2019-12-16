/*@internal*/
namespace ts.server {
    export interface PackageJsonCache {
        addOrUpdate(fileName: ts.Path): void;
        delete(fileName: ts.Path): void;
        getInDirectory(directory: ts.Path): ts.PackageJsonInfo | undefined;
        directoryHasPackageJson(directory: ts.Path): ts.Ternary;
        searchDirectoryAndAncestors(directory: ts.Path): void;
    }
    export function createPackageJsonCache(project: ts.server.Project): PackageJsonCache {
        const packageJsons = ts.createMap<ts.PackageJsonInfo | false>();
        const directoriesWithoutPackageJson = ts.createMap<true>();
        return {
            addOrUpdate,
            delete: fileName => {
                packageJsons.delete(fileName);
                directoriesWithoutPackageJson.set(ts.getDirectoryPath(fileName), true);
            },
            getInDirectory: directory => {
                return packageJsons.get(ts.combinePaths(directory, "package.json")) || undefined;
            },
            directoryHasPackageJson,
            searchDirectoryAndAncestors: directory => {
                ts.forEachAncestorDirectory(directory, ancestor => {
                    if (directoryHasPackageJson(ancestor) !== ts.Ternary.Maybe) {
                        return true;
                    }
                    const packageJsonFileName = project.toPath(ts.combinePaths(ancestor, "package.json"));
                    if (ts.tryFileExists(project, packageJsonFileName)) {
                        addOrUpdate(packageJsonFileName);
                    }
                    else {
                        directoriesWithoutPackageJson.set(ancestor, true);
                    }
                });
            },
        };
        function addOrUpdate(fileName: ts.Path) {
            const packageJsonInfo = ts.createPackageJsonInfo(fileName, project);
            if (packageJsonInfo !== undefined) {
                packageJsons.set(fileName, packageJsonInfo);
                directoriesWithoutPackageJson.delete(ts.getDirectoryPath(fileName));
            }
        }
        function directoryHasPackageJson(directory: ts.Path) {
            return packageJsons.has(ts.combinePaths(directory, "package.json")) ? ts.Ternary.True :
                directoriesWithoutPackageJson.has(directory) ? ts.Ternary.False :
                    ts.Ternary.Maybe;
        }
    }
}
