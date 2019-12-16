namespace ts.server {
    export enum LogLevel {
        terse,
        normal,
        requestTime,
        verbose
    }
    export const emptyArray: ts.SortedReadonlyArray<never> = createSortedArray<never>();
    export interface Logger {
        close(): void;
        hasLevel(level: LogLevel): boolean;
        loggingEnabled(): boolean;
        perftrc(s: string): void;
        info(s: string): void;
        startGroup(): void;
        endGroup(): void;
        msg(s: string, type?: Msg): void;
        getLogFileName(): string | undefined;
    }
    // TODO: Use a const enum (https://github.com/Microsoft/TypeScript/issues/16804)
    export enum Msg {
        Err = "Err",
        Info = "Info",
        Perf = "Perf"
    }
    export namespace Msg {
        /** @deprecated Only here for backwards-compatibility. Prefer just `Msg`. */
        export type Types = Msg;
    }
    export function createInstallTypingsRequest(project: ts.server.Project, typeAcquisition: ts.TypeAcquisition, unresolvedImports: ts.SortedReadonlyArray<string>, cachePath?: string): ts.server.DiscoverTypings {
        return {
            projectName: project.getProjectName(),
            fileNames: project.getFileNames(/*excludeFilesFromExternalLibraries*/ true, /*excludeConfigFiles*/ true).concat(project.getExcludedFiles() as NormalizedPath[]),
            compilerOptions: project.getCompilationSettings(),
            watchOptions: project.projectService.getWatchOptions(project),
            typeAcquisition,
            unresolvedImports,
            projectRootPath: (project.getCurrentDirectory() as ts.Path),
            cachePath,
            kind: "discover"
        };
    }
    export namespace Errors {
        export function ThrowNoProject(): never {
            throw new Error("No Project.");
        }
        export function ThrowProjectLanguageServiceDisabled(): never {
            throw new Error("The project's language service is disabled.");
        }
        export function ThrowProjectDoesNotContainDocument(fileName: string, project: ts.server.Project): never {
            throw new Error(`Project '${project.getProjectName()}' does not contain document '${fileName}'`);
        }
    }
    export type NormalizedPath = string & {
        __normalizedPathTag: any;
    };
    export function toNormalizedPath(fileName: string): NormalizedPath {
        return <NormalizedPath>ts.normalizePath(fileName);
    }
    export function normalizedPathToPath(normalizedPath: NormalizedPath, currentDirectory: string, getCanonicalFileName: (f: string) => string): ts.Path {
        const f = ts.isRootedDiskPath(normalizedPath) ? normalizedPath : ts.getNormalizedAbsolutePath(normalizedPath, currentDirectory);
        return <ts.Path>getCanonicalFileName(f);
    }
    export function asNormalizedPath(fileName: string): NormalizedPath {
        return <NormalizedPath>fileName;
    }
    export interface NormalizedPathMap<T> {
        get(path: NormalizedPath): T | undefined;
        set(path: NormalizedPath, value: T): void;
        contains(path: NormalizedPath): boolean;
        remove(path: NormalizedPath): void;
    }
    export function createNormalizedPathMap<T>(): NormalizedPathMap<T> {
        const map = ts.createMap<T>();
        return {
            get(path) {
                return map.get(path);
            },
            set(path, value) {
                map.set(path, value);
            },
            contains(path) {
                return map.has(path);
            },
            remove(path) {
                map.delete(path);
            }
        };
    }
    /*@internal*/
    export interface ProjectOptions {
        configHasExtendsProperty: boolean;
        /**
         * true if config file explicitly listed files
         */
        configHasFilesProperty: boolean;
        configHasIncludeProperty: boolean;
        configHasExcludeProperty: boolean;
    }
    export function isInferredProjectName(name: string) {
        // POSIX defines /dev/null as a device - there should be no file with this prefix
        return /dev\/null\/inferredProject\d+\*/.test(name);
    }
    export function makeInferredProjectName(counter: number) {
        return `/dev/null/inferredProject${counter}*`;
    }
    export function createSortedArray<T>(): ts.SortedArray<T> {
        return [] as any as ts.SortedArray<T>; // TODO: GH#19873
    }
}
