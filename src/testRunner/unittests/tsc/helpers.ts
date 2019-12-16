namespace ts {
    export type TscCompileSystem = fakes.System & {
        writtenFiles: ts.Map<true>;
        baseLine(): void;
    };
    export enum BuildKind {
        Initial = "initial-build",
        IncrementalDtsChange = "incremental-declaration-changes",
        IncrementalDtsUnchanged = "incremental-declaration-doesnt-change",
        IncrementalHeadersChange = "incremental-headers-change-without-dts-changes",
        NoChangeRun = "no-change-run"
    }
    export const noChangeRun: ts.TscIncremental = {
        buildKind: BuildKind.NoChangeRun,
        modifyFs: ts.noop
    };
    export interface TscCompile {
        scenario: string;
        subScenario: string;
        buildKind?: BuildKind; // Should be defined for tsc --b
        fs: () => vfs.FileSystem;
        commandLineArgs: readonly string[];
        modifyFs?: (fs: vfs.FileSystem) => void;
        baselineSourceMap?: boolean;
        baselineReadFileCalls?: boolean;
    }
    export function tscCompile(input: TscCompile) {
        const baseFs = input.fs();
        const fs = baseFs.shadow();
        const { scenario, subScenario, buildKind, commandLineArgs, modifyFs, baselineSourceMap, baselineReadFileCalls } = input;
        if (modifyFs)
            modifyFs(fs);
        // Create system
        const sys = new fakes.System(fs, { executingFilePath: "/lib/tsc" }) as TscCompileSystem;
        const writtenFiles = sys.writtenFiles = ts.createMap<true>();
        const originalWriteFile = sys.writeFile;
        sys.writeFile = (fileName, content, writeByteOrderMark) => {
            assert.isFalse(writtenFiles.has(fileName));
            writtenFiles.set(fileName, true);
            return originalWriteFile.call(sys, fileName, content, writeByteOrderMark);
        };
        const actualReadFileMap: ts.MapLike<number> = {};
        const originalReadFile = sys.readFile;
        sys.readFile = path => {
            // Dont record libs
            if (path.startsWith("/src/")) {
                actualReadFileMap[path] = (ts.getProperty(actualReadFileMap, path) || 0) + 1;
            }
            return originalReadFile.call(sys, path);
        };
        sys.write(`${sys.getExecutingFilePath()} ${commandLineArgs.join(" ")}\n`);
        sys.exit = exitCode => sys.exitCode = exitCode;
        ts.executeCommandLine(sys, {
            onCompilerHostCreate: host => fakes.patchHostForBuildInfoReadWrite(host),
            onCompilationComplete: config => ts.baselineBuildInfo([config], sys.vfs, sys.writtenFiles),
            onSolutionBuilderHostCreate: host => fakes.patchSolutionBuilderHost(host, sys),
            onSolutionBuildComplete: configs => ts.baselineBuildInfo(configs, sys.vfs, sys.writtenFiles),
        }, commandLineArgs);
        sys.write(`exitCode:: ExitStatus.${ts.ExitStatus[sys.exitCode as ts.ExitStatus]}\n`);
        if (baselineReadFileCalls) {
            sys.write(`readFiles:: ${JSON.stringify(actualReadFileMap, /*replacer*/ undefined, " ")} `);
        }
        if (baselineSourceMap)
            ts.generateSourceMapBaselineFiles(fs, ts.mapDefinedIterator(writtenFiles.keys(), f => f.endsWith(".map") ? f : undefined));
        // Baseline the errors
        fs.writeFileSync(`/lib/${buildKind || BuildKind.Initial}Output.txt`, sys.output.join(""));
        fs.makeReadonly();
        sys.baseLine = () => {
            const patch = fs.diff(baseFs, { includeChangedFileWithSameContent: true });
            // eslint-disable-next-line no-null/no-null
            Harness.Baseline.runBaseline(`${ts.isBuild(commandLineArgs) ? "tsbuild" : "tsc"}/${scenario}/${buildKind || BuildKind.Initial}/${subScenario.split(" ").join("-")}.js`, patch ? vfs.formatPatch(patch) : null);
        };
        return sys;
    }
    export function verifyTscBaseline(sys: () => TscCompileSystem) {
        it(`Generates files matching the baseline`, () => {
            sys().baseLine();
        });
    }
    export function verifyTsc(input: TscCompile) {
        describe(input.scenario, () => {
            describe(input.subScenario, () => {
                let sys: TscCompileSystem;
                before(() => {
                    sys = tscCompile({
                        ...input,
                        fs: () => ts.getFsWithTime(input.fs()).fs.makeReadonly()
                    });
                });
                after(() => {
                    sys = undefined!;
                });
                verifyTscBaseline(() => sys);
            });
        });
    }
}
