import { RunnerBase, TestRunnerKind, CompilerBaselineRunner, CompilerTestType, FourSlashRunner, Test262BaselineRunner, UserCodeRunner, DefinitelyTypedRunner, DockerfileRunner, IO, setLightMode, setShardId, setShards, GeneratedFourslashRunner } from "./Harness";
import { forEach, Debug, getUILocale, setUILocale, noop } from "./ts";
import { FourSlashTestType } from "./FourSlash";
import { ProjectRunner } from "./project";
import { RWCRunner } from "./RWC";
import { start } from "./Harness.Parallel.Worker";
import { Host } from "./Harness.Parallel";
/* eslint-disable prefer-const */
export let runners: RunnerBase[] = [];
export let iterations = 1;
/* eslint-enable prefer-const */
function runTests(runners: RunnerBase[]) {
    for (let i = iterations; i > 0; i--) {
        for (const runner of runners) {
            runner.initializeTests();
        }
    }
}
function tryGetConfig(args: string[]) {
    const prefix = "--config=";
    const configPath = forEach(args, arg => arg.lastIndexOf(prefix, 0) === 0 && arg.substr(prefix.length));
    // strip leading and trailing quotes from the path (necessary on Windows since shell does not do it automatically)
    return configPath && configPath.replace(/(^[\"'])|([\"']$)/g, "");
}
export function createRunner(kind: TestRunnerKind): RunnerBase {
    switch (kind) {
        case "conformance":
            return new CompilerBaselineRunner(CompilerTestType.Conformance);
        case "compiler":
            return new CompilerBaselineRunner(CompilerTestType.Regressions);
        case "fourslash":
            return new FourSlashRunner(FourSlashTestType.Native);
        case "fourslash-shims":
            return new FourSlashRunner(FourSlashTestType.Shims);
        case "fourslash-shims-pp":
            return new FourSlashRunner(FourSlashTestType.ShimsWithPreprocess);
        case "fourslash-server":
            return new FourSlashRunner(FourSlashTestType.Server);
        case "project":
            return new ProjectRunner();
        case "rwc":
            return new RWCRunner();
        case "test262":
            return new Test262BaselineRunner();
        case "user":
            return new UserCodeRunner();
        case "dt":
            return new DefinitelyTypedRunner();
        case "docker":
            return new DockerfileRunner();
    }
    return Debug.fail(`Unknown runner kind ${kind}`);
}
// users can define tests to run in mytest.config that will override cmd line args, otherwise use cmd line args (test.config), otherwise no options
const mytestconfigFileName = "mytest.config";
const testconfigFileName = "test.config";
const customConfig = tryGetConfig(IO.args());
const testConfigContent = customConfig && IO.fileExists(customConfig)
    ? IO.readFile(customConfig)!
    : IO.fileExists(mytestconfigFileName)
        ? IO.readFile(mytestconfigFileName)!
        : IO.fileExists(testconfigFileName) ? IO.readFile(testconfigFileName)! : "";
export let taskConfigsFolder: string;
export let workerCount: number;
export let runUnitTests: boolean | undefined;
export let stackTraceLimit: number | "full" | undefined;
export let noColors = false;
export let keepFailed = false;
export interface TestConfig {
    light?: boolean;
    taskConfigsFolder?: string;
    listenForWork?: boolean;
    workerCount?: number;
    stackTraceLimit?: number | "full";
    test?: string[];
    runners?: string[];
    runUnitTests?: boolean;
    noColors?: boolean;
    timeout?: number;
    keepFailed?: boolean;
    shardId?: number;
    shards?: number;
}
export interface TaskSet {
    runner: TestRunnerKind;
    files: string[];
}
export let configOption: string;
export let globalTimeout: number;
function handleTestConfig() {
    if (testConfigContent !== "") {
        const testConfig = <TestConfig>JSON.parse(testConfigContent);
        if (testConfig.light) {
            setLightMode(true);
        }
        if (testConfig.timeout) {
            globalTimeout = testConfig.timeout;
        }
        runUnitTests = testConfig.runUnitTests;
        if (testConfig.workerCount) {
            workerCount = +testConfig.workerCount;
        }
        if (testConfig.taskConfigsFolder) {
            taskConfigsFolder = testConfig.taskConfigsFolder;
        }
        if (testConfig.noColors !== undefined) {
            noColors = testConfig.noColors;
        }
        if (testConfig.keepFailed) {
            keepFailed = true;
        }
        if (testConfig.shardId) {
            setShardId(testConfig.shardId);
        }
        if (testConfig.shards) {
            setShards(testConfig.shards);
        }
        if (testConfig.stackTraceLimit === "full") {
            (<any>Error).stackTraceLimit = Infinity;
            stackTraceLimit = testConfig.stackTraceLimit;
        }
        else if ((+testConfig.stackTraceLimit! | 0) > 0) {
            (<any>Error).stackTraceLimit = +testConfig.stackTraceLimit! | 0;
            stackTraceLimit = +testConfig.stackTraceLimit! | 0;
        }
        if (testConfig.listenForWork) {
            return true;
        }
        const runnerConfig = testConfig.runners || testConfig.test;
        if (runnerConfig && runnerConfig.length > 0) {
            if (testConfig.runners) {
                runUnitTests = runnerConfig.indexOf("unittest") !== -1;
            }
            for (const option of runnerConfig) {
                if (!option) {
                    continue;
                }
                if (!configOption) {
                    configOption = option;
                }
                else {
                    configOption += "+" + option;
                }
                switch (option) {
                    case "compiler":
                        runners.push(new CompilerBaselineRunner(CompilerTestType.Conformance));
                        runners.push(new CompilerBaselineRunner(CompilerTestType.Regressions));
                        break;
                    case "conformance":
                        runners.push(new CompilerBaselineRunner(CompilerTestType.Conformance));
                        break;
                    case "project":
                        runners.push(new ProjectRunner());
                        break;
                    case "fourslash":
                        runners.push(new FourSlashRunner(FourSlashTestType.Native));
                        break;
                    case "fourslash-shims":
                        runners.push(new FourSlashRunner(FourSlashTestType.Shims));
                        break;
                    case "fourslash-shims-pp":
                        runners.push(new FourSlashRunner(FourSlashTestType.ShimsWithPreprocess));
                        break;
                    case "fourslash-server":
                        runners.push(new FourSlashRunner(FourSlashTestType.Server));
                        break;
                    case "fourslash-generated":
                        runners.push(new GeneratedFourslashRunner(FourSlashTestType.Native));
                        break;
                    case "rwc":
                        runners.push(new RWCRunner());
                        break;
                    case "test262":
                        runners.push(new Test262BaselineRunner());
                        break;
                    case "user":
                        runners.push(new UserCodeRunner());
                        break;
                    case "dt":
                        runners.push(new DefinitelyTypedRunner());
                        break;
                    case "docker":
                        runners.push(new DockerfileRunner());
                        break;
                }
            }
        }
    }
    if (runners.length === 0) {
        // compiler
        runners.push(new CompilerBaselineRunner(CompilerTestType.Conformance));
        runners.push(new CompilerBaselineRunner(CompilerTestType.Regressions));
        runners.push(new ProjectRunner());
        // language services
        runners.push(new FourSlashRunner(FourSlashTestType.Native));
        runners.push(new FourSlashRunner(FourSlashTestType.Shims));
        runners.push(new FourSlashRunner(FourSlashTestType.ShimsWithPreprocess));
        runners.push(new FourSlashRunner(FourSlashTestType.Server));
        // runners.push(new GeneratedFourslashRunner());
        // CRON-only tests
        if (process.env.TRAVIS_EVENT_TYPE === "cron") {
            runners.push(new UserCodeRunner());
            runners.push(new DockerfileRunner());
        }
    }
    if (runUnitTests === undefined) {
        runUnitTests = runners.length !== 1; // Don't run unit tests when running only one runner if unit tests were not explicitly asked for
    }
    return false;
}
function beginTests() {
    if (Debug.isDebugging) {
        Debug.enableDebugInfo();
    }
    // run tests in en-US by default.
    let savedUILocale: string | undefined;
    beforeEach(() => {
        savedUILocale = getUILocale();
        setUILocale("en-US");
    });
    afterEach(() => setUILocale(savedUILocale));
    runTests(runners);
    if (!runUnitTests) {
        // patch `describe` to skip unit tests
        (global as any).describe = noop;
    }
}
export let isWorker: boolean;
function startTestEnvironment() {
    isWorker = handleTestConfig();
    if (isWorker) {
        return start();
    }
    else if (taskConfigsFolder && workerCount && workerCount > 1) {
        return Host.start();
    }
    beginTests();
}
startTestEnvironment();
