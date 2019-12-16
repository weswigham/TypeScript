import * as ts from "../../ts";
describe("unittests:: tsc-watch:: Emit times and Error updates in builder after program changes", () => {
    const config: ts.tscWatch.File = {
        path: `${ts.tscWatch.projectRoot}/tsconfig.json`,
        content: `{}`
    };
    function getOutputFileStampAndError(host: ts.tscWatch.WatchedSystem, watch: ts.tscWatch.Watch, file: ts.tscWatch.File) {
        const builderProgram = watch.getBuilderProgram();
        const state = builderProgram.getState();
        return {
            file,
            fileStamp: host.getModifiedTime(file.path.replace(".ts", ".js")),
            errors: builderProgram.getSemanticDiagnostics(watch().getSourceFileByPath((file.path as ts.Path))),
            errorsFromOldState: !!state.semanticDiagnosticsFromOldState && state.semanticDiagnosticsFromOldState.has(file.path),
            dtsStamp: host.getModifiedTime(file.path.replace(".ts", ".d.ts"))
        };
    }
    function getOutputFileStampsAndErrors(host: ts.tscWatch.WatchedSystem, watch: ts.tscWatch.Watch, directoryFiles: readonly ts.tscWatch.File[]) {
        return directoryFiles.map(d => getOutputFileStampAndError(host, watch, d));
    }
    function findStampAndErrors(stampsAndErrors: readonly ReturnType<typeof getOutputFileStampAndError>[], file: ts.tscWatch.File) {
        return ts.find(stampsAndErrors, info => info.file === file)!;
    }
    interface VerifyOutputFileStampAndErrors {
        file: ts.tscWatch.File;
        jsEmitExpected: boolean;
        dtsEmitExpected: boolean;
        errorRefershExpected: boolean;
        beforeChangeFileStampsAndErrors: readonly ReturnType<typeof getOutputFileStampAndError>[];
        afterChangeFileStampsAndErrors: readonly ReturnType<typeof getOutputFileStampAndError>[];
    }
    function verifyOutputFileStampsAndErrors({ file, jsEmitExpected, dtsEmitExpected, errorRefershExpected, beforeChangeFileStampsAndErrors, afterChangeFileStampsAndErrors }: VerifyOutputFileStampAndErrors) {
        const beforeChange = findStampAndErrors(beforeChangeFileStampsAndErrors, file);
        const afterChange = findStampAndErrors(afterChangeFileStampsAndErrors, file);
        if (jsEmitExpected) {
            assert.notStrictEqual(afterChange.fileStamp, beforeChange.fileStamp, `Expected emit for file ${file.path}`);
        }
        else {
            assert.strictEqual(afterChange.fileStamp, beforeChange.fileStamp, `Did not expect new emit for file ${file.path}`);
        }
        if (dtsEmitExpected) {
            assert.notStrictEqual(afterChange.dtsStamp, beforeChange.dtsStamp, `Expected emit for file ${file.path}`);
        }
        else {
            assert.strictEqual(afterChange.dtsStamp, beforeChange.dtsStamp, `Did not expect new emit for file ${file.path}`);
        }
        if (errorRefershExpected) {
            if (afterChange.errors !== ts.emptyArray || beforeChange.errors !== ts.emptyArray) {
                assert.notStrictEqual(afterChange.errors, beforeChange.errors, `Expected new errors for file ${file.path}`);
            }
            assert.isFalse(afterChange.errorsFromOldState, `Expected errors to be not copied from old state for file ${file.path}`);
        }
        else {
            assert.strictEqual(afterChange.errors, beforeChange.errors, `Expected errors to not change for file ${file.path}`);
            assert.isTrue(afterChange.errorsFromOldState, `Expected errors to be copied from old state for file ${file.path}`);
        }
    }
    interface VerifyEmitAndErrorUpdatesWorker extends VerifyEmitAndErrorUpdates {
        configFile: ts.tscWatch.File;
    }
    function verifyEmitAndErrorUpdatesWorker({ fileWithChange, filesWithNewEmit, filesWithOnlyErrorRefresh, filesNotTouched, configFile, change, getInitialErrors, getIncrementalErrors }: VerifyEmitAndErrorUpdatesWorker) {
        const nonLibFiles = [...filesWithNewEmit, ...filesWithOnlyErrorRefresh, ...filesNotTouched];
        const files = [...nonLibFiles, configFile, ts.tscWatch.libFile];
        const compilerOptions = ((JSON.parse(configFile.content).compilerOptions || {}) as ts.CompilerOptions);
        const host = ts.tscWatch.createWatchedSystem(files, { currentDirectory: ts.tscWatch.projectRoot });
        const watch = ts.tscWatch.createWatchOfConfigFile("tsconfig.json", host);
        ts.tscWatch.checkProgramActualFiles(watch(), [...nonLibFiles.map(f => f.path), ts.tscWatch.libFile.path]);
        ts.tscWatch.checkOutputErrorsInitial(host, getInitialErrors(watch));
        const beforeChange = getOutputFileStampsAndErrors(host, watch, nonLibFiles);
        change(host);
        host.runQueuedTimeoutCallbacks();
        ts.tscWatch.checkOutputErrorsIncremental(host, getIncrementalErrors(watch));
        const afterChange = getOutputFileStampsAndErrors(host, watch, nonLibFiles);
        filesWithNewEmit.forEach(file => verifyOutputFileStampsAndErrors({
            file,
            jsEmitExpected: !compilerOptions.isolatedModules || fileWithChange === file,
            dtsEmitExpected: ts.getEmitDeclarations(compilerOptions),
            errorRefershExpected: true,
            beforeChangeFileStampsAndErrors: beforeChange,
            afterChangeFileStampsAndErrors: afterChange
        }));
        filesWithOnlyErrorRefresh.forEach(file => verifyOutputFileStampsAndErrors({
            file,
            jsEmitExpected: false,
            dtsEmitExpected: ts.getEmitDeclarations(compilerOptions) && !file.path.endsWith(".d.ts"),
            errorRefershExpected: true,
            beforeChangeFileStampsAndErrors: beforeChange,
            afterChangeFileStampsAndErrors: afterChange
        }));
        filesNotTouched.forEach(file => verifyOutputFileStampsAndErrors({
            file,
            jsEmitExpected: false,
            dtsEmitExpected: false,
            errorRefershExpected: false,
            beforeChangeFileStampsAndErrors: beforeChange,
            afterChangeFileStampsAndErrors: afterChange
        }));
    }
    function changeCompilerOptions(input: VerifyEmitAndErrorUpdates, additionalOptions: ts.CompilerOptions): ts.tscWatch.File {
        const configFile = input.configFile || config;
        const content = JSON.parse(configFile.content);
        content.compilerOptions = { ...content.compilerOptions, ...additionalOptions };
        return { path: configFile.path, content: JSON.stringify(content) };
    }
    interface VerifyEmitAndErrorUpdates {
        change: (host: ts.tscWatch.WatchedSystem) => void;
        getInitialErrors: (watch: ts.tscWatch.Watch) => readonly ts.Diagnostic[] | readonly string[];
        getIncrementalErrors: (watch: ts.tscWatch.Watch) => readonly ts.Diagnostic[] | readonly string[];
        fileWithChange: ts.tscWatch.File;
        filesWithNewEmit: readonly ts.tscWatch.File[];
        filesWithOnlyErrorRefresh: readonly ts.tscWatch.File[];
        filesNotTouched: readonly ts.tscWatch.File[];
        configFile?: ts.tscWatch.File;
    }
    function verifyEmitAndErrorUpdates(input: VerifyEmitAndErrorUpdates) {
        it("with default config", () => {
            verifyEmitAndErrorUpdatesWorker({
                ...input,
                configFile: input.configFile || config
            });
        });
        it("with default config and --declaration", () => {
            verifyEmitAndErrorUpdatesWorker({
                ...input,
                configFile: changeCompilerOptions(input, { declaration: true })
            });
        });
        it("config with --isolatedModules", () => {
            verifyEmitAndErrorUpdatesWorker({
                ...input,
                configFile: changeCompilerOptions(input, { isolatedModules: true })
            });
        });
        it("config with --isolatedModules and --declaration", () => {
            verifyEmitAndErrorUpdatesWorker({
                ...input,
                configFile: changeCompilerOptions(input, { isolatedModules: true, declaration: true })
            });
        });
    }
    describe("deep import changes", () => {
        const aFile: ts.tscWatch.File = {
            path: `${ts.tscWatch.projectRoot}/a.ts`,
            content: `import {B} from './b';
declare var console: any;
let b = new B();
console.log(b.c.d);`
        };
        function verifyDeepImportChange(bFile: ts.tscWatch.File, cFile: ts.tscWatch.File) {
            const filesWithNewEmit: ts.tscWatch.File[] = [];
            const filesWithOnlyErrorRefresh = [aFile];
            addImportedModule(bFile);
            addImportedModule(cFile);
            verifyEmitAndErrorUpdates({
                fileWithChange: cFile,
                filesWithNewEmit,
                filesWithOnlyErrorRefresh,
                filesNotTouched: ts.emptyArray,
                change: host => host.writeFile(cFile.path, cFile.content.replace("d", "d2")),
                getInitialErrors: () => ts.emptyArray,
                getIncrementalErrors: watch => [
                    ts.tscWatch.getDiagnosticOfFileFromProgram(watch(), aFile.path, aFile.content.lastIndexOf("d"), 1, ts.Diagnostics.Property_0_does_not_exist_on_type_1, "d", "C")
                ]
            });
            function addImportedModule(file: ts.tscWatch.File) {
                if (file.path.endsWith(".d.ts")) {
                    filesWithOnlyErrorRefresh.push(file);
                }
                else {
                    filesWithNewEmit.push(file);
                }
            }
        }
        describe("updates errors when deep import file changes", () => {
            const bFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/b.ts`,
                content: `import {C} from './c';
export class B
{
    c = new C();
}`
            };
            const cFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/c.ts`,
                content: `export class C
{
    d = 1;
}`
            };
            verifyDeepImportChange(bFile, cFile);
        });
        describe("updates errors when deep import through declaration file changes", () => {
            const bFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/b.d.ts`,
                content: `import {C} from './c';
export class B
{
    c: C;
}`
            };
            const cFile: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/c.d.ts`,
                content: `export class C
{
    d: number;
}`
            };
            verifyDeepImportChange(bFile, cFile);
        });
    });
    describe("updates errors in file not exporting a deep multilevel import that changes", () => {
        const aFile: ts.tscWatch.File = {
            path: `${ts.tscWatch.projectRoot}/a.ts`,
            content: `export interface Point {
    name: string;
    c: Coords;
}
export interface Coords {
    x2: number;
    y: number;
}`
        };
        const bFile: ts.tscWatch.File = {
            path: `${ts.tscWatch.projectRoot}/b.ts`,
            content: `import { Point } from "./a";
export interface PointWrapper extends Point {
}`
        };
        const cFile: ts.tscWatch.File = {
            path: `${ts.tscWatch.projectRoot}/c.ts`,
            content: `import { PointWrapper } from "./b";
export function getPoint(): PointWrapper {
    return {
        name: "test",
        c: {
            x: 1,
            y: 2
        }
    }
};`
        };
        const dFile: ts.tscWatch.File = {
            path: `${ts.tscWatch.projectRoot}/d.ts`,
            content: `import { getPoint } from "./c";
getPoint().c.x;`
        };
        const eFile: ts.tscWatch.File = {
            path: `${ts.tscWatch.projectRoot}/e.ts`,
            content: `import "./d";`
        };
        verifyEmitAndErrorUpdates({
            fileWithChange: aFile,
            filesWithNewEmit: [aFile, bFile],
            filesWithOnlyErrorRefresh: [cFile, dFile],
            filesNotTouched: [eFile],
            change: host => host.writeFile(aFile.path, aFile.content.replace("x2", "x")),
            getInitialErrors: watch => [
                ts.tscWatch.getDiagnosticOfFileFromProgram(watch(), cFile.path, cFile.content.indexOf("x: 1"), 4, ts.chainDiagnosticMessages(ts.chainDiagnosticMessages(/*details*/ undefined, ts.Diagnostics.Object_literal_may_only_specify_known_properties_and_0_does_not_exist_in_type_1, "x", "Coords"), ts.Diagnostics.Type_0_is_not_assignable_to_type_1, "{ x: number; y: number; }", "Coords")),
                ts.tscWatch.getDiagnosticOfFileFromProgram(watch(), dFile.path, dFile.content.lastIndexOf("x"), 1, ts.Diagnostics.Property_0_does_not_exist_on_type_1, "x", "Coords")
            ],
            getIncrementalErrors: () => ts.emptyArray
        });
    });
    describe("updates errors when file transitively exported file changes", () => {
        const config: ts.tscWatch.File = {
            path: `${ts.tscWatch.projectRoot}/tsconfig.json`,
            content: JSON.stringify({
                files: ["app.ts"],
                compilerOptions: { baseUrl: "." }
            })
        };
        const app: ts.tscWatch.File = {
            path: `${ts.tscWatch.projectRoot}/app.ts`,
            content: `import { Data } from "lib2/public";
export class App {
    public constructor() {
        new Data().test();
    }
}`
        };
        const lib2Public: ts.tscWatch.File = {
            path: `${ts.tscWatch.projectRoot}/lib2/public.ts`,
            content: `export * from "./data";`
        };
        const lib2Data: ts.tscWatch.File = {
            path: `${ts.tscWatch.projectRoot}/lib2/data.ts`,
            content: `import { ITest } from "lib1/public";
export class Data {
    public test() {
        const result: ITest = {
            title: "title"
        }
        return result;
    }
}`
        };
        const lib1Public: ts.tscWatch.File = {
            path: `${ts.tscWatch.projectRoot}/lib1/public.ts`,
            content: `export * from "./tools/public";`
        };
        const lib1ToolsPublic: ts.tscWatch.File = {
            path: `${ts.tscWatch.projectRoot}/lib1/tools/public.ts`,
            content: `export * from "./tools.interface";`
        };
        const lib1ToolsInterface: ts.tscWatch.File = {
            path: `${ts.tscWatch.projectRoot}/lib1/tools/tools.interface.ts`,
            content: `export interface ITest {
    title: string;
}`
        };
        function verifyTransitiveExports(lib2Data: ts.tscWatch.File, lib2Data2?: ts.tscWatch.File) {
            const filesWithNewEmit = [lib1ToolsInterface, lib1ToolsPublic];
            const filesWithOnlyErrorRefresh = [app, lib2Public, lib1Public, lib2Data];
            if (lib2Data2) {
                filesWithOnlyErrorRefresh.push(lib2Data2);
            }
            verifyEmitAndErrorUpdates({
                fileWithChange: lib1ToolsInterface,
                filesWithNewEmit,
                filesWithOnlyErrorRefresh,
                filesNotTouched: ts.emptyArray,
                configFile: config,
                change: host => host.writeFile(lib1ToolsInterface.path, lib1ToolsInterface.content.replace("title", "title2")),
                getInitialErrors: () => ts.emptyArray,
                getIncrementalErrors: () => [
                    "lib2/data.ts(5,13): error TS2322: Type '{ title: string; }' is not assignable to type 'ITest'.\n  Object literal may only specify known properties, but 'title' does not exist in type 'ITest'. Did you mean to write 'title2'?\n"
                ]
            });
        }
        describe("when there are no circular import and exports", () => {
            verifyTransitiveExports(lib2Data);
        });
        describe("when there are circular import and exports", () => {
            const lib2Data: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/lib2/data.ts`,
                content: `import { ITest } from "lib1/public"; import { Data2 } from "./data2";
export class Data {
    public dat?: Data2; public test() {
        const result: ITest = {
            title: "title"
        }
        return result;
    }
}`
            };
            const lib2Data2: ts.tscWatch.File = {
                path: `${ts.tscWatch.projectRoot}/lib2/data2.ts`,
                content: `import { Data } from "./data";
export class Data2 {
    public dat?: Data;
}`
            };
            verifyTransitiveExports(lib2Data, lib2Data2);
        });
    });
    it("with noEmitOnError", () => {
        const projectLocation = `${ts.TestFSWithWatch.tsbuildProjectsLocation}/noEmitOnError`;
        const allFiles = ["tsconfig.json", "shared/types/db.ts", "src/main.ts", "src/other.ts"]
            .map(f => ts.TestFSWithWatch.getTsBuildProjectFile("noEmitOnError", f));
        const host = ts.TestFSWithWatch.changeToHostTrackingWrittenFiles(ts.tscWatch.createWatchedSystem([...allFiles, { path: ts.tscWatch.libFile.path, content: ts.libContent }], { currentDirectory: projectLocation }));
        const watch = ts.tscWatch.createWatchOfConfigFile("tsconfig.json", host);
        const mainFile = allFiles.find(f => f.path === `${projectLocation}/src/main.ts`)!;
        ts.tscWatch.checkOutputErrorsInitial(host, [
            ts.tscWatch.getDiagnosticOfFileFromProgram(watch(), mainFile.path, mainFile.content.lastIndexOf(";"), 1, ts.Diagnostics._0_expected, ",")
        ]);
        assert.equal(host.writtenFiles.size, 0, `Expected not to write any files: ${ts.arrayFrom(host.writtenFiles.keys())}`);
        // Make changes
        host.writeFile(mainFile.path, `import { A } from "../shared/types/db";
const a = {
    lastName: 'sdsd'
};`);
        host.writtenFiles.clear();
        host.checkTimeoutQueueLengthAndRun(1); // build project
        ts.tscWatch.checkOutputErrorsIncremental(host, ts.emptyArray);
        assert.equal(host.writtenFiles.size, 3, `Expected to write 3 files: Actual:: ${ts.arrayFrom(host.writtenFiles.keys())}`);
        for (const f of [
            `${projectLocation}/dev-build/shared/types/db.js`,
            `${projectLocation}/dev-build/src/main.js`,
            `${projectLocation}/dev-build/src/other.js`,
        ]) {
            assert.isTrue(host.writtenFiles.has(f.toLowerCase()), `Expected to write file: ${f}:: Actual:: ${ts.arrayFrom(host.writtenFiles.keys())}`);
        }
    });
});
