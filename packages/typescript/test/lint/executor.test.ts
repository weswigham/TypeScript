import { SourceCode } from "eslint";
import { Linter } from "eslint/universal";
import assert from "node:assert/strict";
import path from "node:path";
import {
    after,
    before,
    describe,
    test,
} from "node:test";
import { fileURLToPath } from "node:url";
import { ScriptTarget } from "../../enums/scriptTarget.js";
import { RemoteSourceFile } from "../../src/api/node/node.ts";
import { Wtf8Decoder } from "../../src/api/node/wtf8.ts";
import { API } from "../../src/api/sync/api.ts";
import {
    isSourceFile,
    type SourceFile,
} from "../../src/ast/index.ts";
import { loadConfiguration } from "../../src/lint/config.ts";
import { executeWork } from "../../src/lint/testing.ts";
import type {
    LintRequest,
    NativeAPIContext,
    Rules,
} from "../../src/lint/types.ts";
import { createVirtualFileSystem } from "../testUtils.ts";

const text = "/* 😀 */ /* global external:writable */\n/* eslint-disable missing/native */\nconst ignored = '😀'; external++; providedByNative();\n";
const typedText = "export const value = 42; const result = value + 1;";
const settings = {
    currentDirectory: path.parse(fileURLToPath(new URL("../../../../", import.meta.url))).root,
    plugins: { fixture: fileURLToPath(new URL("./fixtures/plugin.mjs", import.meta.url)) },
    compilerOptions: { lib: ["lib.esnext.d.ts"], alwaysStrict: true },
    globals: { providedByNative: "readonly" as const },
};
let api: API;
let nativeContext: NativeAPIContext;
let sourceFile: SourceFile;
let bomSourceFile: SourceFile;
let typedSourceFile: SourceFile;
let jsxSourceFile: SourceFile;
let brokenSourceFile: SourceFile;
let formatContext: NativeAPIContext;

before(() => {
    api = new API({
        cwd: settings.currentDirectory,
        tsserverPath: fileURLToPath(new URL(`../../../../built/local/tsc${process.platform === "win32" ? ".exe" : ""}`, import.meta.url)),
        fs: createVirtualFileSystem({
            "/tsconfig.json": JSON.stringify({ compilerOptions: { moduleDetection: "legacy" } }),
            "/src/input.ts": text,
            "/src/bom.ts": `\uFEFF${text}`,
            "/src/typed.ts": typedText,
            "/src/component.tsx": "export const component = <div />;",
            "/src/broken.ts": "const missing = ;",
            "/formats/tsconfig.json": JSON.stringify({ compilerOptions: { module: "nodenext" } }),
            "/formats/package.json": JSON.stringify({ type: "module" }),
            "/formats/common.cts": "const common = 1;",
            "/formats/module.mts": "const esm = 1;",
            "/formats/package.ts": "const packaged = 1;",
        }),
    });
    const snapshot = api.createSnapshot({ openProjects: ["/tsconfig.json", "/formats/tsconfig.json"] });
    const project = snapshot.getConfiguredProject("/tsconfig.json")!;
    nativeContext = { api, snapshot, project };
    formatContext = { api, snapshot, project: snapshot.getConfiguredProject("/formats/tsconfig.json")! };
    sourceFile = project.program.getSourceFile("/src/input.ts")!;
    typedSourceFile = project.program.getSourceFile("/src/typed.ts")!;
    jsxSourceFile = project.program.getSourceFile("/src/component.tsx")!;
    brokenSourceFile = project.program.getSourceFile("/src/broken.ts")!;
    const remoteBOM = project.program.getSourceFile("/src/bom.ts")!;
    assert.ok(remoteBOM instanceof RemoteSourceFile);
    const decodedBOM = new RemoteSourceFile(
        new Uint8Array(remoteBOM.view.buffer, remoteBOM.view.byteOffset, remoteBOM.view.byteLength),
        new Wtf8Decoder("utf-8", { ignoreBOM: true }),
    );
    assert.ok(isSourceFile(decodedBOM));
    bomSourceFile = decodedBOM;
});

after(() => api?.[Symbol.dispose]());

function request(rules: Rules, files: readonly SourceFile[] = [sourceFile]): LintRequest {
    return { kind: "lint", ...settings, rules, files: files.map(file => ({ fileName: file.fileName })) };
}

describe("pure native lint executor", () => {
    test("executes supplied native files in order with prototype reports, selectors, scope globals, defaults, and UTF-16 fixes", async () => {
        const files = [sourceFile, bomSourceFile];
        const result = await executeWork(request({ "fixture/prototype": "warn", "fixture/rename": "error", "fixture/scope": "error" }, files), files);
        assert.deepEqual(result.files.map(file => file.fileName), files.map(file => file.fileName));
        for (const [index, file] of result.files.entries()) {
            assert.equal(file.messages.length, 3);
            assert.equal(file.messages.find(message => message.ruleId === "fixture/prototype")!.message, `default|${file.fileName}|${file.fileName}`);
            const start = text.indexOf("ignored") + index;
            assert.deepEqual(file.messages.find(message => message.ruleId === "fixture/rename"), {
                ruleId: "fixture/rename",
                severity: 2,
                message: "Rename ignored",
                messageId: "rename",
                start,
                end: start + 7,
                fix: { range: [start, start + 7], text: "aignoredz" },
                suggestions: [{ desc: "Use a different name", fix: { range: [start, start + 7], text: "renamed" } }],
            });
            for (const key of ["decode", "conversion", "scope", "verify"] as const) assert.ok(file.timings[key] >= 0);
        }
    });

    test("makes real supplied API, snapshot, project, program, checker, and mapped semantic queries available to typed rules", async () => {
        const result = await executeWork(request({ "fixture/typed": "error" }, [typedSourceFile]), [typedSourceFile], nativeContext);
        assert.deepEqual(result.files[0].messages.map(message => message.message), ["42|value", "42|value"]);
    });

    test("does not cache a typed context with reusable rule metadata or fabricate one when none is supplied", async () => {
        const work = request({ "fixture/typed": "error" }, [typedSourceFile]);
        await executeWork(work, [typedSourceFile], nativeContext);
        assert.match((await executeWork(work, [typedSourceFile])).files[0].error!, /native API context|checker.*not supplied|hasFullTypeInformation/i);
        const again = await executeWork(work, [typedSourceFile], nativeContext);
        assert.equal(again.files[0].messages.length, 2);
    });

    test("inspects modules and reuses their state without prior project/config registration", async () => {
        const inspected = await executeWork({ kind: "inspectPlugins", ...settings }, []);
        assert.ok(inspected.ruleNames.includes("fixture/prototype"));
        const first = await executeWork(request({ "fixture/state": "error" }), [sourceFile]);
        const second = await executeWork(request({ "fixture/state": "error" }), [sourceFile]);
        assert.equal(Number(second.files[0].messages[0].message), Number(first.files[0].messages[0].message) + 1);
    });

    test("preserves validated nested-option identities without reusing per-file option arrays", async () => {
        const run = async (rules: Rules) => {
            const result = await executeWork(request(rules), [sourceFile]);
            return result.files[0].messages.find(message => message.ruleId === "fixture/cached-options")!.message;
        };
        const configured: Rules = { "fixture/cached-options": ["error", { label: "configured" }] };
        const first = await run(configured);
        assert.equal(await run(configured), first);
        assert.equal(await run({ ...configured, "fixture/prototype": "warn" }), first);
        const defaults = await run({ "fixture/cached-options": "error" });
        assert.match(defaults, /^default\|/);
        assert.equal(await run({ "fixture/cached-options": "warn" }), defaults);
        assert.notEqual(defaults, first);
        await run({ "fixture/cached-options": ["error", { label: "update-default" }] });
        assert.match(await run({ "fixture/cached-options": "error" }), /^updated\|/);
        assert.match((await executeWork(request({ "fixture/cached-options": ["error", { label: 123 }] }), [sourceFile])).files[0].error!, /should be string/i);
        const work = request({ "fixture/metadata-absent": "error" });
        const configuration = await loadConfiguration(work);
        assert.equal("meta" in configuration.plugins.fixture.rules!["metadata-absent"], false);
        assert.equal((await executeWork(work, [sourceFile])).files[0].messages[0].message, "no metadata");
    });

    test("reports file errors but rejects invalid settings and mismatched native file batches", async () => {
        assert.match((await executeWork(request({ "fixture/failure": "error" }), [sourceFile])).files[0].error!, /intentional rule failure/);
        assert.match((await executeWork(request({ "fixture/prototype": ["error", { label: 123 }] }), [sourceFile])).files[0].error!, /label|schema|type/i);
        await assert.rejects(executeWork(request({ "missing/rule": "error" }), [sourceFile]), /unknown.*missing\/rule/i);
        await assert.rejects(executeWork(request({}), []), /file.*count|source.*files/i);
    });

    test("isolates failed creates, visitors and invalid reports while retaining healthy diagnostics across the batch", async () => {
        const files = [sourceFile, typedSourceFile];
        const result = await executeWork(
            request({
                "fixture/prototype": "warn",
                "fixture/failure": "error",
                "fixture/visitor-failure": "error",
                "fixture/invalid-report": "error",
                "fixture/invalid-fix": "error",
                "fixture/code-path-failure": "error",
            }, files),
            files,
        );
        for (const file of result.files) {
            assert.deepEqual(file.messages.map(message => message.ruleId), ["fixture/prototype"]);
            assert.match(file.error!, /intentional rule failure/);
            assert.match(file.error!, /intentional visitor failure/);
            assert.match(file.error!, /line|location|range/i);
            assert.match(file.error!, /fixture\/invalid-fix/);
            assert.match(file.error!, /intentional code-path failure/);
        }
        assert.equal((await executeWork(request({ "fixture/prototype": "warn" }), [sourceFile])).files[0].error, undefined);
    });

    test("continues after unsupported native syntax and cooperatively cancels between files", async () => {
        const files = [brokenSourceFile, sourceFile];
        const result = await executeWork(request({ "fixture/prototype": "warn" }, files), files);
        assert.ok(result.files[0].error);
        assert.equal(result.files[1].messages.length, 1);
        let checks = 0;
        await assert.rejects(executeWork(request({}, files), files, undefined, () => ++checks === 4), /Lint work cancelled/);
    });

    test("uses each native file's JSX format independently of compiler JSX emit settings", async () => {
        const files = [sourceFile, jsxSourceFile];
        const work = request({ "fixture/format": "warn" }, files);
        const result = await executeWork({ ...work, compilerOptions: { jsx: 4, lib: ["lib.es2015.d.ts"], alwaysStrict: false } }, files);
        assert.deepEqual(result.files.map(file => JSON.parse(file.messages[0].message)), [
            { jsx: false, sourceType: "script", strict: false, promise: true, window: false, bigint: false },
            { jsx: true, sourceType: "module", strict: false, promise: true, window: false, bigint: false },
        ]);
        const withoutEmitOption = await executeWork({ ...work, compilerOptions: { lib: ["lib.es2015.d.ts"], alwaysStrict: false } }, files);
        assert.deepEqual(withoutEmitOption.files.map(file => JSON.parse(file.messages[0].message).jsx), [false, true]);
    });

    test("uses the supplied program's resolved libraries and per-file Node module format", async () => {
        const files = ["/formats/common.cts", "/formats/module.mts", "/formats/package.ts"].map(name => formatContext.project.program.getSourceFile(name)!);
        const work = request({ "fixture/format": "warn" }, files);
        const result = await executeWork({ ...work, compilerOptions: undefined }, files, formatContext);
        assert.deepEqual(result.files.map(file => file.error), [undefined, undefined, undefined]);
        const formats = result.files.map(file => JSON.parse(file.messages[0].message));
        assert.deepEqual(formats.map(format => format.sourceType), ["commonjs", "module", "module"]);
        assert.ok(formats.every(format => format.promise && format.window && format.bigint));
    });

    test("uses effective strict defaults and noLib or target-specific scope libraries", async () => {
        const work = request({ "fixture/format": "warn" });
        const defaults = await executeWork({ ...work, compilerOptions: { target: ScriptTarget.ES2015 } }, [sourceFile]);
        assert.deepEqual(JSON.parse(defaults.files[0].messages[0].message), { jsx: false, sourceType: "script", strict: true, promise: true, window: true, bigint: false });
        const noLib = await executeWork({ ...work, compilerOptions: { noLib: true, strict: false } }, [sourceFile]);
        assert.deepEqual(JSON.parse(noLib.files[0].messages[0].message), { jsx: false, sourceType: "script", strict: false, promise: false, window: false, bigint: false });
    });

    test("keeps BOM-free SourceCode text, comments, tokens and locations aligned and translates BOM removal fixes", async () => {
        const result = await executeWork(request({ "fixture/bom-text": "error", "fixture/rename": "error" }, [bomSourceFile]), [bomSourceFile]);
        assert.equal(result.files[0].error, undefined);
        assert.deepEqual(result.files[0].messages.find(message => message.ruleId === "fixture/bom-text")!.fix, { range: [0, 1], text: "" });
        assert.equal(result.files[0].messages.find(message => message.ruleId === "fixture/rename")!.start, text.indexOf("ignored") + 1);
    });

    test("preserves all code-path listener arguments through rule isolation", async () => {
        const result = await executeWork(request({ "fixture/code-path": "warn" }), [sourceFile]);
        assert.equal(result.files[0].error, undefined);
        assert.deepEqual(result.files[0].messages.map(message => message.message), ["code path"]);
    });

    test("reports unsupported compiler scope libraries explicitly on every request", async () => {
        const work = { ...request({ "fixture/prototype": "warn" }), compilerOptions: { lib: ["lib.esnext.json.d.ts"] } };
        for (let index = 0; index < 2; index++) {
            const result = await executeWork(work, [sourceFile]);
            assert.deepEqual(result.files[0].messages, []);
            assert.match(result.files[0].error!, /does not support compiler library "esnext\.json"/);
        }
        const target = await executeWork({ ...work, compilerOptions: { target: ScriptTarget.ES2026 } }, [sourceFile]);
        assert.equal(target.files[0].error, undefined);
        assert.equal((await executeWork(request({ "fixture/prototype": "warn" }), [sourceFile])).files[0].error, undefined);
    });

    test("uses host-resolved libraries ahead of compiler option names or program discovery", async () => {
        const work = { ...request({ "fixture/format": "warn" }), compilerOptions: { lib: ["lib.esnext.json.d.ts"] } };
        const result = await executeWork(work, [sourceFile], { ...nativeContext, defaultLibraries: ["lib.es2015.d.ts"] });
        assert.equal(result.files[0].error, undefined);
        const format = JSON.parse(result.files[0].messages[0].message);
        assert.equal(format.promise, true);
        assert.equal(format.window, false);
        assert.equal(format.bigint, false);
        const unsupported = await executeWork(request({ "fixture/format": "warn" }), [sourceFile], { ...nativeContext, defaultLibraries: ["lib.esnext.json.d.ts"] });
        assert.match(unsupported.files[0].error!, /does not support compiler library "esnext\.json"/);
    });

    test("reuses the batch Linter and configuration identities without sharing option arrays or failures between files", async t => {
        const original = Linter.prototype.verify;
        const linters: Linter[] = [];
        const configurations: (Linter.Config | Linter.Config[])[] = [];
        t.mock.method(Linter.prototype, "verify", function (this: Linter, ...args: Parameters<typeof original>) {
            linters.push(this);
            configurations.push(args[1]);
            return Reflect.apply(original, this, args);
        });
        const files = [bomSourceFile, sourceFile, typedSourceFile];
        const rules: Rules = { "fixture/batch-options": "warn", "fixture/fail-on-bom": "warn" };
        const result = await executeWork(request(rules, files), files);
        assert.match(result.files[0].error!, /BOM-only failure/);
        assert.equal(result.files[1].error, undefined);
        assert.equal(result.files[2].error, undefined);
        assert.ok(result.files.every(file => file.messages.find(message => message.ruleId === "fixture/batch-options")!.message === "default"));
        assert.equal(linters[0], linters[1]);
        assert.equal(linters[1], linters[2]);
        assert.equal(configurations[0], configurations[1], "same file variants should reuse the configuration array");
        assert.notEqual(configurations[0], configurations[2], "source-type variants must retain distinct configuration arrays");
        assert.ok(Array.isArray(configurations[0]) && Array.isArray(configurations[2]));
        const firstPlugins = configurations[0].find(config => config.plugins)!.plugins;
        assert.equal(firstPlugins, configurations[2].find(config => config.plugins)!.plugins);
        const again = await executeWork(request(rules), [sourceFile]);
        assert.equal(again.files[0].messages.find(message => message.ruleId === "fixture/batch-options")!.message, "default");
        assert.notEqual(linters[0], linters[3], "a later batch must have a fresh Linter");
        assert.notEqual(configurations[1], configurations[3], "a later batch must have fresh configuration bindings");
    });

    test("code-path requirements are determined by each file's actual listeners, not retained from the previous file", async t => {
        const original = SourceCode.prototype.traverse;
        let stockCalls = 0;
        t.mock.method(SourceCode.prototype, "traverse", function (this: SourceCode) {
            stockCalls++;
            return original.call(this);
        });
        const files = [bomSourceFile, sourceFile];
        const result = await executeWork(request({ "fixture/conditional-code-path": "warn" }, files), files);
        assert.deepEqual(result.files.map(file => file.error), [undefined, undefined]);
        assert.deepEqual(result.files.map(file => file.messages[0].message), ["code path", "node only"]);
        assert.equal(stockCalls, 1);
    });

    test("completed batches do not retain their SourceCode or converted AST", async t => {
        const gc = global.gc;
        if (!gc) {
            t.skip("Run with --expose-gc to verify released batch source objects");
            return;
        }
        const references: WeakRef<SourceCode>[] = [];
        const asts: WeakRef<SourceCode["ast"]>[] = [];
        const original = SourceCode.prototype.getScope;
        SourceCode.prototype.getScope = function (this: SourceCode, ...args: Parameters<typeof original>) {
            references.push(new WeakRef(this));
            asts.push(new WeakRef(this.ast));
            return Reflect.apply(original, this, args);
        };
        const files = [bomSourceFile, sourceFile];
        try {
            await executeWork(request({ "fixture/rename": "warn" }, files), files);
        }
        finally {
            SourceCode.prototype.getScope = original;
        }
        assert.ok(references.length >= files.length);
        for (let attempt = 0; attempt < 10; attempt++) {
            await new Promise<void>(resolve => setImmediate(resolve));
            gc();
        }
        assert.ok(references.every(reference => reference.deref() === undefined));
        assert.ok(asts.every(reference => reference.deref() === undefined));
    });
});
