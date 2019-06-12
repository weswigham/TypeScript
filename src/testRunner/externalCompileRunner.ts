const fs: typeof import("fs") = require("fs");
const path: typeof import("path") = require("path");
const del: typeof import("del") = require("del");
const mkdirp: typeof import("mkdirp") = require("mkdirp");
const cp: typeof import("child_process") = require("child_process");

interface ExecResult {
    stdout: Buffer;
    stderr: Buffer;
    status: number;
}

interface UserConfig {
    types?: string[];
    path?: string;
    monorepo?: {
        [packageName: string]: string;
    }; // Mappings of local package paths to published package names, eg `packages/foobar` to `@repo/foobar`
}

abstract class ExternalCompileRunnerBase extends RunnerBase {
    abstract testDir: string;
    abstract report(result: ExecResult, cwd: string): string | null;
    enumerateTestFiles() {
        return Harness.IO.getDirectories(this.testDir);
    }
    private timeout = 600_000; // 10 minutes
    /** Setup the runner's tests so that they are ready to be executed by the harness
     *  The first test should be a describe/it block that sets up the harness's compiler instance appropriately
     */
    initializeTests(): void {
        // Read in and evaluate the test list
        const testList = this.tests && this.tests.length ? this.tests : this.enumerateTestFiles();

        // tslint:disable-next-line:no-this-assignment
        const cls = this;
        describe(`${this.kind()} code samples`, function(this: Mocha.ISuiteCallbackContext) {
            this.timeout(cls.timeout);
            for (const test of testList) {
                cls.runTest(typeof test === "string" ? test : test.file);
            }
        });
    }

    private getExec(directoryName: string) {
        return (command: string, args: string[], options: { cwd: string, timeout?: number }): void => {
            const stdio = isWorker ? "pipe" : "inherit";
            const res = cp.spawnSync(command, args, { timeout: this.timeout / 2, shell: true, stdio, ...options });
            if (res.status !== 0) {
                throw new Error(`${command} ${args.join(" ")} for ${directoryName} failed: ${res.stderr && res.stderr.toString()}`);
            }
        }
    }

    private runTest(directoryName: string) {
        const timeout = this.timeout;
        // tslint:disable-next-line:no-this-assignment
        const cls = this;
        describe(directoryName, function(this: Mocha.ISuiteCallbackContext) {
            this.timeout(timeout);
            let cwd = path.join(Harness.IO.getWorkspaceRoot(), cls.testDir, directoryName);
            const originalCwd = cwd;
            let types: string[] | undefined;

            before(() => {
                if (fs.existsSync(path.join(cwd, "test.json"))) {
                    const submoduleDir = path.join(cwd, directoryName);
                    const exec = cls.getExec(directoryName);
                    exec("git", ["reset", "HEAD", "--hard"], { cwd: submoduleDir });
                    exec("git", ["clean", "-f"], { cwd: submoduleDir });
                    exec("git", ["submodule", "update", "--init", "--remote", "."], { cwd: submoduleDir });
                }
            })

            if (fs.existsSync(path.join(cwd, "test.json"))) {
                const submoduleDir = path.join(cwd, directoryName);

                const config = JSON.parse(fs.readFileSync(path.join(cwd, "test.json"), { encoding: "utf8" })) as UserConfig;
                ts.Debug.assert(!!config.types || !!config.monorepo, "Bad format from test.json: 'types' or 'monorepo' field must be present.");
                types = config.types;

                cwd = config.path ? path.join(cwd, config.path) : submoduleDir;
                if (config.monorepo) {
                    cls.testMonorepo(directoryName, submoduleDir, types, config.monorepo);
                    return;
                }
            }
            cls.testSinglePackage(directoryName, cwd, originalCwd, types);
        });
    }

    private testSinglePackage(directoryName: string, cwd: string, originalCwd: string, types: string[] | undefined) {
        it("should build successfully", () => {
            this.installNormal(directoryName, cwd, originalCwd, types);
            this.executeBuildErrorsBaselineTest(directoryName, cwd, types);
        });
    }

    private testMonorepo(directoryName: string, submoduleDir: string, types: string[] | undefined, monorepo: NonNullable<UserConfig["monorepo"]>) {
        it(`should build successfully`, () => {
            const packagesList = Object.keys(monorepo);
            const packageNames = packagesList.map(d => monorepo[d]);
            const orderedList = this.reorderDeps(packagesList, submoduleDir, monorepo);
            // collect all dependencies and install them into a single top-level folder
            const installTargets: string[] = [];
            let devDependencies: {[packageName: string]: string} = {};
            for (const packageName of packagesList) {
                const packageJsonPath = path.join(submoduleDir, packageName, "package.json");
                if (fs.existsSync(packageJsonPath)) {
                    installTargets.push(packageName);
                    const packageJson = require(packageJsonPath);
                    const devDeps = packageJson && packageJson.devDependencies;
                    if (devDeps) {
                        // FIXME (maybe): version selection/combination would be appropriate here
                        devDependencies = {...devDeps, ...devDependencies};
                    }
                }
            }
            const commonModules = path.join(submoduleDir, "node_modules");
            if (fs.existsSync(commonModules)) {
                del.sync(commonModules, { force: true });
            }
            const exec = this.getExec(directoryName);
            exec(
                "npm",
                [
                    "i",
                    "--ignore-scripts",
                    "--no-save",
                    ...installTargets.map(t => `file:${t}`),
                    ...ts.map(types, t => `@types/${t}`) || [],
                    ...Object.keys(devDependencies).filter(d => packageNames.indexOf(d) === -1).map(d => devDependencies[d].indexOf(">") === -1 ? `${d}@${devDependencies[d]}` : d),
                ],
                { cwd: submoduleDir }
            );
            // npm should have linked all the subrepos into the common dir, now we need to link the commonModules dir into each subrepo
            for (const packageName of packagesList) {
                const localModules = path.join(submoduleDir, packageName, "node_modules");
                if (fs.existsSync(localModules)) {
                    del.sync(localModules);
                }
                fs.symlinkSync(commonModules, localModules, "junction");
            }

            const errors: Error[] = [];
            // Add tests
            for (const packageName of orderedList) {
                // Only test/build packages which are TS (other entries may be needed to symlink above to satisfy npm)
                const tsconfigPath = path.join(submoduleDir, packageName, "tsconfig.json");
                if (fs.existsSync(tsconfigPath)) {
                    try {
                        const config = ts.parseConfigFileTextToJson(tsconfigPath, fs.readFileSync(tsconfigPath).toString()).config;
                        const localTypes = config && config.compilerOptions && config.compilerOptions.types || [];
                        this.executeBuildErrorsBaselineTest(`${directoryName}/${packageName.replace("/", "_")}`, path.join(submoduleDir, packageName), localTypes, /*emit*/ true);
                    }
                    catch (e) {
                        errors.push(e);
                    }
                }
            }
            if (errors.length) {
                if (errors.length === 1) {
                    throw errors[0];
                }
                else {
                    throw new Error(`Multiple subprojects have differences in their failing baseline or encountered problems:${"\n"}${errors.map(e => e.message).join("\n")}`)
                }
            }
        });
    }

    private invertMap(map: {[index: string]: string}): {[index: string]: string} {
        const keys = Object.keys(map);
        const result: {[index: string]: string} = {};
        for (const key of keys) {
            result[map[key]] = key;
        }
        return result;
    }

    private lookupImmediateDeps(entry: string, cwd: string, mapping: {[index: string]: string}): string[] {
        const jsonPath = path.join(cwd, entry, "package.json");
        if (fs.existsSync(jsonPath)) {
            let deps: string[] | undefined;
            try {
                const doc = require(jsonPath);
                deps = Object.keys(doc.dependencies);
            }
            catch {}
            return ts.mapDefined(deps, d => mapping[d]) || [];
        }
        return [];
    }

    private calculateDepOrder(entry: string, cwd: string, mapping: {[index: string]: string}, prereqs: string[] = []): string[] {
        if (prereqs.indexOf(entry) !== -1) {
            return prereqs;
        }
        const deps = this.lookupImmediateDeps(entry, cwd, mapping);
        for (const d of deps) {
            this.calculateDepOrder(d, cwd, mapping, prereqs);
        }
        if (prereqs.indexOf(entry) === -1) {
            prereqs.push(entry);
        }
        return prereqs;
    }

    private reorderDeps(list: string[], cwd: string, initialMapping: {[index: string]: string}) {
        const inversedMap = this.invertMap(initialMapping);
        const result: string[] = [];
        for (const elem of list) {
            this.calculateDepOrder(elem, cwd, inversedMap, result);
        }
        return result;
    }

    private installNormal(directoryName: string, cwd: string, typesCwd: string, types: string[] | undefined) {
        if (!fs.existsSync(path.join(cwd, "package.json"))) {
            return;
        }
        if (fs.existsSync(path.join(cwd, "package-lock.json"))) {
            fs.unlinkSync(path.join(cwd, "package-lock.json"));
        }
        if (fs.existsSync(path.join(cwd, "node_modules"))) {
            del.sync(path.join(cwd, "node_modules"), { force: true });
        }
        const exec = this.getExec(directoryName);
        exec(`npm`, ["i", "--ignore-scripts", "--no-save"], { cwd }); // NPM shouldn't take the entire timeout - if it takes a long time, it should be terminated and we should log the failure
        if (types) {
            // Also actually install those types (for, eg, the js projects which need node)
            exec(`npm`, ["i", ...types.map(t => `@types/${t}`), "--no-save", "--ignore-scripts"], { cwd: typesCwd }); // NPM shouldn't take the entire timeout - if it takes a long time, it should be terminated and we should log the failure
        }
    }

    private executeBuildErrorsBaselineTest(directoryName: string, cwd: string, types: string[] | undefined, emit?: boolean) {
        const args = [path.join(Harness.IO.getWorkspaceRoot(), "built/local/tsc.js")];
        if (types) {
            args.push("--types", types.join(","));
        }
        if (!emit) {
            args.push("--noEmit");
        }
        else {
            args.push("--noEmitOnError", "false");
        }
        Harness.Baseline.runBaseline(`${this.kind()}/${directoryName}.log`, this.report(cp.spawnSync(`node`, args, { cwd, timeout: this.timeout, shell: true }), cwd));
    }
}

class UserCodeRunner extends ExternalCompileRunnerBase {
    readonly testDir = "tests/cases/user/";
    kind(): TestRunnerKind {
        return "user";
    }
    report(result: ExecResult) {
        // tslint:disable-next-line:no-null-keyword
        return result.status === 0 && !result.stdout.length && !result.stderr.length ? null : `Exit Code: ${result.status}
Standard output:
${sortErrors(stripAbsoluteImportPaths(result.stdout.toString().replace(/\r\n/g, "\n")))}


Standard error:
${stripAbsoluteImportPaths(result.stderr.toString().replace(/\r\n/g, "\n"))}`;
    }
}

/**
 * Import types and some other error messages use absolute paths in errors as they have no context to be written relative to;
 * This is problematic for error baselines, so we grep for them and strip them out.
 */
function stripAbsoluteImportPaths(result: string) {
    const workspaceRegexp = new RegExp(Harness.IO.getWorkspaceRoot().replace(/\\/g, "\\\\"), "g");
    return result
        .replace(/import\(".*?\/tests\/cases\/user\//g, `import("/`)
        .replace(/Module '".*?\/tests\/cases\/user\//g, `Module '"/`)
        .replace(workspaceRegexp, "../../..");
}

function sortErrors(result: string) {
    return ts.flatten(splitBy(result.split("\n"), s => /^\S+/.test(s)).sort(compareErrorStrings)).join("\n");
}

const errorRegexp = /^(.+\.[tj]sx?)\((\d+),(\d+)\)(: error TS.*)/;
function compareErrorStrings(a: string[], b: string[]) {
    ts.Debug.assertGreaterThanOrEqual(a.length, 1);
    ts.Debug.assertGreaterThanOrEqual(b.length, 1);
    const matchA = a[0].match(errorRegexp);
    if (!matchA) {
        return -1;
    }
    const matchB = b[0].match(errorRegexp);
    if (!matchB) {
        return 1;
    }
    const [, errorFileA, lineNumberStringA, columnNumberStringA, remainderA] = matchA;
    const [, errorFileB, lineNumberStringB, columnNumberStringB, remainderB] = matchB;
    return ts.comparePathsCaseSensitive(errorFileA, errorFileB) ||
        ts.compareValues(parseInt(lineNumberStringA), parseInt(lineNumberStringB)) ||
        ts.compareValues(parseInt(columnNumberStringA), parseInt(columnNumberStringB)) ||
        ts.compareStringsCaseSensitive(remainderA, remainderB) ||
        ts.compareStringsCaseSensitive(a.slice(1).join("\n"), b.slice(1).join("\n"));
}

class DefinitelyTypedRunner extends ExternalCompileRunnerBase {
    readonly testDir = "../DefinitelyTyped/types/";
    workingDirectory = this.testDir;
    kind(): TestRunnerKind {
        return "dt";
    }
    report(result: ExecResult, cwd: string) {
        const stdout = removeExpectedErrors(result.stdout.toString(), cwd);
        const stderr = result.stderr.toString();
        // tslint:disable-next-line:no-null-keyword
        return !stdout.length && !stderr.length ? null : `Exit Code: ${result.status}
Standard output:
${stdout.replace(/\r\n/g, "\n")}


Standard error:
${stderr.replace(/\r\n/g, "\n")}`;
    }
}

function removeExpectedErrors(errors: string, cwd: string): string {
    return ts.flatten(splitBy(errors.split("\n"), s => /^\S+/.test(s)).filter(isUnexpectedError(cwd))).join("\n");
}
/**
 * Returns true if the line that caused the error contains '$ExpectError',
 * or if the line before that one contains '$ExpectError'.
 * '$ExpectError' is a marker used in Definitely Typed tests,
 * meaning that the error should not contribute toward our error baslines.
 */
function isUnexpectedError(cwd: string) {
    return (error: string[]) => {
        ts.Debug.assertGreaterThanOrEqual(error.length, 1);
        const match = error[0].match(/(.+\.tsx?)\((\d+),\d+\): error TS/);
        if (!match) {
            return true;
        }
        const [, errorFile, lineNumberString] = match;
        const lines = fs.readFileSync(path.join(cwd, errorFile), { encoding: "utf8" }).split("\n");
        const lineNumber = parseInt(lineNumberString) - 1;
        ts.Debug.assertGreaterThanOrEqual(lineNumber, 0);
        ts.Debug.assertLessThan(lineNumber, lines.length);
        const previousLine = lineNumber - 1 > 0 ? lines[lineNumber - 1] : "";
        return !ts.stringContains(lines[lineNumber], "$ExpectError") && !ts.stringContains(previousLine, "$ExpectError");
    };
}
/**
 * Split an array into multiple arrays whenever `isStart` returns true.
 * @example
 * splitBy([1,2,3,4,5,6], isOdd)
 * ==> [[1, 2], [3, 4], [5, 6]]
 * where
 * const isOdd = n => !!(n % 2)
 */
function splitBy<T>(xs: T[], isStart: (x: T) => boolean): T[][] {
    const result = [];
    let group: T[] = [];
    for (const x of xs) {
        if (isStart(x)) {
            if (group.length) {
                result.push(group);
            }
            group = [x];
        }
        else {
            group.push(x);
        }
    }
    if (group.length) {
        result.push(group);
    }
    return result;
}
