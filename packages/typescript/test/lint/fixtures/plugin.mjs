import assert from "node:assert/strict";
import { threadId } from "node:worker_threads";

console.log("lint fixture plugin loaded");
let invocations = 0;
let state = 0;

class PrototypeRule {
    meta = {
        schema: [{ type: "object", properties: { label: { type: "string" } }, additionalProperties: false }],
        defaultOptions: [{ label: "default" }],
        messages: { created: "{{label}}|{{filename}}|{{physical}}" },
    };

    create(context) {
        assert.ok(this instanceof PrototypeRule);
        context.report({
            loc: { line: 1, column: 0 },
            messageId: "created",
            data: {
                label: context.options[0].label,
                filename: context.filename,
                physical: context.physicalFilename,
            },
        });
        return {};
    }
}

class CachedOptionsRule {
    #meta = {
        schema: [{ type: "object", properties: { label: { type: "string" } }, additionalProperties: false }],
        defaultOptions: [{ label: "default" }],
        messages: { cached: "{{label}}|{{compilation}}" },
    };
    #cache = new WeakMap();
    #compilations = 0;
    #lastOptions;

    get meta() {
        return this.#meta;
    }

    create(context) {
        assert.ok(this instanceof CachedOptionsRule);
        assert.notEqual(context.options, this.#lastOptions);
        this.#lastOptions = context.options;
        const options = context.options[0];
        let compiled = this.#cache.get(options);
        if (!compiled) {
            compiled = { label: options.label, compilation: ++this.#compilations };
            this.#cache.set(options, compiled);
        }
        if (options.label === "update-default") this.meta.defaultOptions = [{ label: "updated" }];
        context.report({ loc: { line: 1, column: 0 }, messageId: "cached", data: compiled });
        return {};
    }
}

export default {
    rules: {
        "prototype": new PrototypeRule(),
        "cached-options": new CachedOptionsRule(),
        "metadata-absent": {
            create(context) {
                context.report({ loc: { line: 1, column: 0 }, message: "no metadata" });
                return {};
            },
        },
        "rename": {
            meta: {
                schema: [{ type: "object", properties: { label: { type: "string" } }, additionalProperties: false }],
                fixable: "code",
                hasSuggestions: true,
                messages: { rename: "Rename {{name}}", suggestion: "Use a different name" },
            },
            create(context) {
                const source = context.sourceCode;
                return {
                    "Identifier[name='ignored']"(node) {
                        assert.equal(source.getText(node), "ignored");
                        assert.ok(source.getFirstToken(node));
                        assert.ok(source.getCommentsBefore(source.ast.body[0]).length);
                        assert.ok(source.getScope(node));
                        assert.ok(source.parserServices.esTreeNodeToTSNodeMap.has(node));
                        context.report({
                            node,
                            messageId: "rename",
                            data: { name: node.name },
                            fix(fixer) {
                                return [fixer.insertTextBefore(node, "a"), fixer.insertTextAfter(node, "z")];
                            },
                            suggest: [{
                                messageId: "suggestion",
                                fix: fixer => fixer.replaceText(node, "renamed"),
                            }],
                        });
                    },
                };
            },
        },
        "scope": {
            meta: { schema: [], messages: { ok: "globals resolved" } },
            create(context) {
                return {
                    "Program:exit"(node) {
                        const global = context.sourceCode.scopeManager.globalScope;
                        assert.ok(global.set.has("external"));
                        assert.equal(global.set.get("external").writeable, true);
                        assert.ok(global.set.has("providedByNative"));
                        assert.equal(global.set.get("providedByNative").writeable, false);
                        assert.equal(global.isStrict, true);
                        const reference = global.through.find(reference => reference.identifier.name === "external");
                        assert.equal(reference, undefined);
                        context.report({ node, messageId: "ok" });
                    },
                };
            },
        },
        "pool": {
            meta: { schema: [], messages: { worker: "{{thread}}:{{invocations}}:{{start}}:{{end}}" } },
            create(context) {
                ++invocations;
                const start = Date.now();
                Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 60);
                context.report({
                    loc: { line: 1, column: 0 },
                    messageId: "worker",
                    data: { thread: threadId, invocations, start, end: Date.now() },
                });
                return {};
            },
        },
        "typed": {
            meta: { schema: [], messages: { typed: "{{type}}|{{symbol}}" } },
            create(context) {
                const services = context.sourceCode.parserServices;
                assert.equal(services.program, services.project.program);
                assert.equal(services.checker, services.project.checker);
                assert.equal(services.api, services.project.api);
                assert.equal(services.snapshot, services.nativeAPIContext.snapshot);
                assert.equal(services.hasFullTypeInformation, true);
                const nativeFile = services.esTreeNodeToTSNodeMap.get(context.sourceCode.ast);
                assert.equal(services.program.getSourceFile(nativeFile.fileName), nativeFile);
                return {
                    "Identifier[name='value']"(node) {
                        const type = services.getTypeAtLocation(node);
                        const symbol = services.getSymbolAtLocation(node);
                        context.report({
                            node,
                            messageId: "typed",
                            data: { type: services.checker.typeToString(type), symbol: symbol.name },
                        });
                    },
                };
            },
        },
        "state": {
            meta: { schema: [], messages: { state: "{{state}}" } },
            create(context) {
                context.report({ loc: { line: 1, column: 0 }, messageId: "state", data: { state: ++state } });
                return {};
            },
        },
        "failure": {
            meta: { schema: [] },
            create() {
                throw new Error("intentional rule failure");
            },
        },
        "visitor-failure": {
            meta: { schema: [] },
            create(context) {
                return {
                    Identifier(node) {
                        context.report({ node, message: "must be discarded" });
                        throw new Error("intentional visitor failure");
                    },
                };
            },
        },
        "invalid-report": {
            meta: { schema: [] },
            create(context) {
                return {
                    Program() {
                        context.report({ loc: { start: { line: 1, column: 0 }, end: { line: 9999, column: 0 } }, message: "invalid location" });
                    },
                };
            },
        },
        "invalid-fix": {
            meta: { schema: [], fixable: "code" },
            create(context) {
                return {
                    Program(node) {
                        context.report({ node, message: "invalid fix", fix: () => ({ range: [0, context.sourceCode.text.length + 1], text: "" }) });
                    },
                };
            },
        },
        "format": {
            meta: { schema: [] },
            create(context) {
                return {
                    Program(node) {
                        const global = context.sourceCode.scopeManager.globalScope;
                        context.report({
                            node,
                            message: JSON.stringify({
                                jsx: context.languageOptions.parserOptions.ecmaFeatures.jsx,
                                sourceType: context.languageOptions.sourceType,
                                strict: global.isStrict,
                                promise: global.set.has("PromiseConstructor"),
                                window: global.set.has("Window"),
                                bigint: global.set.has("BigIntConstructor"),
                            }),
                        });
                    },
                };
            },
        },
        "bom-text": {
            meta: { schema: [], fixable: "code" },
            create(context) {
                const source = context.sourceCode;
                assert.equal(source.hasBOM, true);
                assert.equal(source.text.startsWith("\uFEFF"), false);
                return {
                    Identifier(node) {
                        assert.equal(source.getText(node), node.name);
                        assert.equal(source.getFirstToken(node).value, node.name);
                        assert.deepEqual(source.getLocFromIndex(node.range[0]), node.loc.start);
                    },
                    Program(node) {
                        const comment = source.getAllComments()[0];
                        assert.ok(source.getText(comment).startsWith("/*"));
                        context.report({ node, message: "remove BOM", fix: () => ({ range: [-1, 0], text: "" }) });
                    },
                };
            },
        },
        "crash": {
            meta: { schema: [] },
            create() {
                process.exit(17);
            },
        },
        "code-path-failure": {
            meta: { schema: [] },
            create() {
                return {
                    onCodePathStart() {
                        throw new Error("intentional code-path failure");
                    },
                };
            },
        },
        "code-path": {
            meta: { schema: [] },
            create(context) {
                return {
                    onCodePathStart(path, node) {
                        assert.ok(path.id);
                        assert.equal(node.type, "Program");
                        context.report({ node, message: "code path" });
                    },
                };
            },
        },
        "batch-options": {
            meta: {
                schema: [{ type: "object", properties: { label: { type: "string" } }, additionalProperties: false }],
                defaultOptions: [{ label: "default" }],
            },
            previousOptions: undefined,
            previousSource: undefined,
            create(context) {
                assert.notEqual(context.options, this.previousOptions);
                assert.notEqual(context.sourceCode, this.previousSource?.deref());
                this.previousOptions = context.options;
                this.previousSource = new WeakRef(context.sourceCode);
                const label = context.options[0].label;
                context.options[0] = { label: "polluted" };
                return {
                    Program(node) {
                        context.report({ node, message: label });
                    },
                };
            },
        },
        "fail-on-bom": {
            meta: { schema: [] },
            create(context) {
                if (context.sourceCode.hasBOM) throw new Error("BOM-only failure");
                return {
                    Program(node) {
                        context.report({ node, message: "healthy" });
                    },
                };
            },
        },
        "conditional-code-path": {
            meta: { schema: [] },
            create(context) {
                return context.sourceCode.hasBOM ? {
                    onCodePathStart(path, node) {
                        assert.equal(path.origin, "program");
                        context.report({ node, message: "code path" });
                    },
                } : {
                    Program(node) {
                        context.report({ node, message: "node only" });
                    },
                };
            },
        },
    },
};
