const fs = require("fs") as typeof import("fs");
const path = require("path") as typeof import("path");
const del = require("del") as typeof import("del");
const mkdirp = require("mkdirp") as typeof import("mkdirp");
const cp = require("child_process") as typeof import("child_process");

interface ExecResult {
    stdout: Buffer;
    stderr: Buffer;
    status: number;
}

interface UserConfig {
    types?: string[];
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
    private runTest(directoryName: string) {
        const timeout = this.timeout;
        // tslint:disable-next-line:no-this-assignment
        const cls = this;
        describe(directoryName, function(this: Mocha.ISuiteCallbackContext) {
            this.timeout(timeout);
            let cwd = path.join(Harness.IO.getWorkspaceRoot(), cls.testDir, directoryName);
            const originalCwd = cwd;
            let types: string[] | undefined;
            const stdio = isWorker ? "pipe" : "inherit";

            before(() => {
                if (fs.existsSync(path.join(cwd, "test.json"))) {
                    const submoduleDir = path.join(cwd, directoryName);
                    const reset = cp.spawnSync("git", ["reset", "HEAD", "--hard"], { cwd: submoduleDir, timeout, shell: true, stdio });
                    if (reset.status !== 0) throw new Error(`git reset for ${directoryName} failed: ${reset.stderr && reset.stderr.toString()}`);
                    const clean = cp.spawnSync("git", ["clean", "-f"], { cwd: submoduleDir, timeout, shell: true, stdio });
                    if (clean.status !== 0) throw new Error(`git clean for ${directoryName} failed: ${clean.stderr && clean.stderr.toString()}`);
                    const update = cp.spawnSync("git", ["submodule", "update", "--remote", "."], { cwd: submoduleDir, timeout, shell: true, stdio });
                    if (update.status !== 0) throw new Error(`git submodule update for ${directoryName} failed: ${update.stderr && update.stderr.toString()}`);
                }
            })

            if (fs.existsSync(path.join(cwd, "test.json"))) {
                const submoduleDir = path.join(cwd, directoryName);

                const config = JSON.parse(fs.readFileSync(path.join(cwd, "test.json"), { encoding: "utf8" })) as UserConfig;
                ts.Debug.assert(!!config.types || !!config.monorepo, "Bad format from test.json: 'types' or 'monorepo' field must be present.");
                types = config.types;

                cwd = submoduleDir;
                if (config.monorepo) {
                    it(`should build successfully`, () => {
                        const packagesList = Object.keys(config.monorepo!);
                        const orderedList = cls.reorderDeps(packagesList, submoduleDir, config.monorepo!);
                        const errors: Error[] = [];
                        // Add tests
                        for (const packageName of orderedList) {
                            // Only test/build packages which are TS (other entries may be needed to symlink to satisfy npm)
                            if (fs.existsSync(path.join(submoduleDir, packageName, "tsconfig.json"))) {
                                try {
                                    cls.executeBuildErrorsBaselineTest(`${directoryName}/${packageName.replace("/", "_")}`, path.join(cwd, packageName), submoduleDir, types, cls.installMonorepo(submoduleDir, orderedList, config.monorepo!), /*emit*/ true);
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
                    return;
                }
            }

            it("should build successfully", () => {
                cls.executeBuildErrorsBaselineTest(directoryName, cwd, originalCwd, types, cls.installNormal());
            });
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

    private linkDeps<T extends {[index: string]: string}>(cwd: string, submoduleDir: string, packagesList: (keyof T & string)[], monorepoMap: T) {
        const moduleDir = path.join(cwd, "node_modules");
        mkdirp.sync(moduleDir);
        for (const otherPackagePath of packagesList) {
            const otherPath = path.join(submoduleDir, otherPackagePath);
            const modulePath = path.join(moduleDir, monorepoMap[otherPackagePath]);
            if (fs.existsSync(modulePath)) {
                del.sync(modulePath, { force: true });
            }
            mkdirp.sync(path.dirname(modulePath));
            fs.symlinkSync(otherPath, modulePath, "junction");
        }
    }

    private installMonorepo<T extends {[index: string]: string}>(submoduleDir: string, packagesList: (keyof T & string)[], monorepoMap: T) {
        const baseInstall = this.installNormal(/*cleanModules*/ false);
        return (directoryName: string, cwd: string) => {
            if (fs.existsSync(path.join(cwd, "node_modules"))) {
                del.sync(path.join(cwd, "node_modules"), { force: true });
            }
            // setup `link`s for all projects into the deps of this one (even if they're not all required)
            this.linkDeps(cwd, submoduleDir, packagesList, monorepoMap);
            baseInstall(directoryName, cwd);
            // Then do it again because `npm` is going to munge them/replace them with public versions in an attempt to create the an efficient tree
            this.linkDeps(cwd, submoduleDir, packagesList, monorepoMap);
        }
    }

    private installNormal(cleanModules = true) {
        return (directoryName: string, cwd: string) => {
            const timeout = this.timeout;
            const stdio = isWorker ? "pipe" : "inherit";
            if (cleanModules && fs.existsSync(path.join(cwd, "node_modules"))) {
                del.sync(path.join(cwd, "node_modules"), { force: true });
            }
            const install = cp.spawnSync(`npm`, ["i", "--ignore-scripts", "--no-save"], { cwd, timeout: timeout / 2, shell: true, stdio }); // NPM shouldn't take the entire timeout - if it takes a long time, it should be terminated and we should log the failure
            if (install.status !== 0) throw new Error(`NPM Install for ${directoryName} failed: ${install.stderr && install.stderr.toString()}`);
        }
    }

    private executeBuildErrorsBaselineTest(directoryName: string, cwd: string, originalCwd: string, types: string[] | undefined, installer: (dirname: string, cwd: string) => void, emit?: boolean) {
        const timeout = this.timeout;
        const stdio = isWorker ? "pipe" : "inherit";
        if (fs.existsSync(path.join(cwd, "package.json"))) {
            if (fs.existsSync(path.join(cwd, "package-lock.json"))) {
                fs.unlinkSync(path.join(cwd, "package-lock.json"));
            }
            installer(directoryName, cwd);
        }
        const args = [path.join(Harness.IO.getWorkspaceRoot(), "built/local/tsc.js")];
        if (types) {
            args.push("--types", types.join(","));
            // Also actually install those types (for, eg, the js projects which need node)
            const install = cp.spawnSync(`npm`, ["i", ...types.map(t => `@types/${t}`), "--no-save", "--ignore-scripts"], { cwd: originalCwd, timeout: timeout / 2, shell: true, stdio }); // NPM shouldn't take the entire timeout - if it takes a long time, it should be terminated and we should log the failure
            if (install.status !== 0) throw new Error(`NPM Install types for ${directoryName} failed: ${install.stderr && install.stderr.toString()}`);
        }
        if (!emit) {
            args.push("--noEmit");
        }
        else {
            args.push("--noEmitOnError", "false");
        }
        Harness.Baseline.runBaseline(`${this.kind()}/${directoryName}.log`, () => {
            const report = this.report(cp.spawnSync(`node`, args, { cwd, timeout, shell: true }), cwd);
            if (fs.existsSync(path.join(cwd, "node_modules"))) { // cleanup `node_modules` once done so symlinks dont find nested module folders
                del.sync(path.join(cwd, "node_modules"), { force: true });
            }
            return report;
        });
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
        ts.compareStringsCaseSensitive(remainderA, remainderB);
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
