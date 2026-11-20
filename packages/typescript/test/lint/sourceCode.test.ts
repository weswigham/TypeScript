import type { TSESTree } from "@typescript-eslint/types";
import { parse } from "@typescript-eslint/typescript-estree";
import { visitorKeys } from "@typescript-eslint/visitor-keys";
import {
    type AST,
    type Linter as LinterTypes,
    type Rule,
    type Scope,
    SourceCode,
} from "eslint";
import { Linter } from "eslint/universal";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
    type FileRuleState,
    isolateRules,
} from "../../src/lint/ruleIsolation.ts";
import { analyzeScopes } from "../../src/lint/scope.ts";
import { NativeSourceCode } from "../../src/lint/sourceCode.ts";

function assertProgram(value: unknown): asserts value is AST.Program {
    assert.ok(value && typeof value === "object" && "type" in value && value.type === "Program");
}

function assertScopeManager(value: unknown): asserts value is Scope.ScopeManager {
    assert.ok(value && typeof value === "object" && "scopes" in value && "addGlobals" in value);
}

function source(text: string, native: boolean, needsCodePaths: () => boolean): SourceCode {
    const root: TSESTree.Program = parse(text.replace(/^\uFEFF/u, ""), { range: true, loc: true, tokens: true, comment: true });
    const ast: unknown = root;
    assertProgram(ast);
    const scopeManager: unknown = analyzeScopes(root, { sourceType: "module", lib: ["es2026"], childVisitorKeys: visitorKeys });
    assertScopeManager(scopeManager);
    const keys: SourceCode.VisitorKeys = {};
    for (const [name, children] of Object.entries(visitorKeys)) {
        if (children) keys[name] = [...children];
    }
    const config: SourceCode.Config = { text, ast, scopeManager, visitorKeys: keys };
    return native ? new NativeSourceCode(config, root, needsCodePaths) : new SourceCode(config);
}

function verify(text: string, rule: Rule.RuleModule, native: boolean, needsCodePaths: () => boolean): LinterTypes.LintMessage[] {
    const code = source(text, native, needsCodePaths);
    return new Linter().verify(code, [{
        files: ["**"],
        plugins: { trace: { rules: { trace: rule } } },
        rules: { "trace/trace": "error" },
        languageOptions: { sourceType: "module" },
    }], { filename: "input.ts", allowInlineConfig: false });
}

test("lazy native traversal preserves stock code-path ordering and completed branch, loop, and unreachable segments", () => {
    const traces: string[][] = [];
    let needsCodePaths = false;
    const rule: Rule.RuleModule = {
        meta: { schema: [] },
        create() {
            needsCodePaths = true;
            const events: string[] = [];
            traces.push(events);
            const record = (event: string, node: { type: string; range?: readonly [number, number] | undefined; }, detail = "") => events.push(`${event}:${node.type}:${node.range?.[0]}:${detail}`);
            return {
                "Program"(node) {
                    record("enter", node);
                },
                "Program:exit"(node) {
                    record("exit", node);
                },
                "onCodePathStart"(path, node) {
                    record("start", node, `${path.origin}/${path.childCodePaths.length}`);
                },
                "onCodePathEnd"(path, node) {
                    record("end", node, `${path.finalSegments.length}/${path.returnedSegments.length}/${path.thrownSegments.length}`);
                },
                "onCodePathSegmentStart"(segment, node) {
                    record("segment-start", node, `${segment.reachable}/${segment.allPrevSegments.length}/${segment.allNextSegments.length}`);
                },
                "onCodePathSegmentEnd"(segment, node) {
                    record("segment-end", node, String(segment.reachable));
                },
                "onUnreachableCodePathSegmentStart"(segment, node) {
                    record("unreachable-start", node, String(segment.reachable));
                },
                "onUnreachableCodePathSegmentEnd"(segment, node) {
                    record("unreachable-end", node, String(segment.reachable));
                },
                "onCodePathSegmentLoop"(from, to, node) {
                    record("loop", node, `${from.reachable}/${to.reachable}`);
                },
            };
        },
    };
    const text = "function f(x) { if (x) return 1; else x++; while (x) { if (x === 2) break; x--; } throw x; x++; } f(0);";
    assert.deepEqual(verify(text, rule, false, () => needsCodePaths), []);
    needsCodePaths = false;
    assert.deepEqual(verify(text, rule, true, () => needsCodePaths), []);
    assert.deepEqual(traces[1], traces[0]);
    assert.ok(traces[1].some(event => event.startsWith("unreachable-start:")));
    assert.ok(traces[1].some(event => event.startsWith("loop:")));
    assert.ok(traces[1].filter(event => event.startsWith("start:")).length >= 2);
});

test("node-only traversal skips stock analysis while preserving selectors, ancestors, scopes, tokens, fixes, and BOM", t => {
    const original = SourceCode.prototype.traverse;
    let stockCalls = 0;
    t.mock.method(SourceCode.prototype, "traverse", function (this: SourceCode) {
        stockCalls++;
        return original.call(this);
    });
    const traces: string[][] = [];
    const rule: Rule.RuleModule = {
        meta: { schema: [], fixable: "code", hasSuggestions: true },
        create(context) {
            const events: string[] = [];
            traces.push(events);
            const code = context.sourceCode;
            assert.equal(code.hasBOM, true);
            return {
                "Program"(node) {
                    events.push(`enter:${node.range?.[0]}`);
                },
                ":function"(node: Rule.Node) {
                    events.push(`function:${node.type}`);
                },
                "VariableDeclarator > Identifier.id"(node: Rule.Node) {
                    events.push(`child:${code.getText(node)}`);
                },
                "Identifier[name='value']"(node: Rule.Node) {
                    assert.equal(code.getText(node), "value");
                    assert.equal(code.getFirstToken(node)!.value, "value");
                    events.push(`${code.getScope(node).type}:${code.getAncestors(node).map(parent => parent.type).join("/")}`);
                    context.report({
                        node,
                        message: "rename",
                        fix: fixer => fixer.replaceText(node, "renamed"),
                        suggest: [{ desc: "another", fix: fixer => fixer.replaceText(node, "another") }],
                    });
                },
                "Identifier[name='value']:exit"(node: Rule.Node) {
                    events.push(`exit:${node.range?.[0]}`);
                },
                "Program:exit"(node) {
                    events.push(`program-exit:${node.range?.[1]}`);
                },
            };
        },
    };
    const text = "\uFEFF/* 😀 */\nexport const value = (a => a + 1)(1); value;";
    const expected = verify(text, rule, false, () => false);
    assert.equal(stockCalls, 1);
    const actual = verify(text, rule, true, () => false);
    assert.equal(stockCalls, 1, "node-only traversal must not construct stock code paths");
    assert.deepEqual(actual, expected);
    assert.deepEqual(traces[1], traces[0]);
});

test("isolated listeners forward their receiver and every code-path argument", () => {
    type LoopArguments = Parameters<NonNullable<Rule.RuleListener["onCodePathSegmentLoop"]>>;
    let context: Rule.RuleContext | undefined;
    let captured: LoopArguments | undefined;
    let received: LoopArguments | undefined;
    let receiver: unknown;
    const rule: Rule.RuleModule = {
        meta: { schema: [] },
        create(input) {
            context = input;
            return {
                onCodePathSegmentLoop: function (this: unknown, ...args: LoopArguments) {
                    captured ??= args;
                    received = args;
                    receiver = this;
                },
            };
        },
    };
    verify("while (condition) { condition--; }", rule, false, () => true);
    assert.ok(context && captured);
    const state: FileRuleState = { failures: new Map(), needsCodePaths: false };
    const plugins = isolateRules({ fixture: { rules: { loop: rule } } }, () => state);
    const isolated = plugins.fixture.rules!.loop;
    assert.ok(isolated && typeof isolated !== "function");
    const listener = isolated.create(context).onCodePathSegmentLoop;
    assert.ok(listener);
    const target = {};
    Reflect.apply(listener, target, captured);
    assert.equal(receiver, target);
    assert.deepEqual(received, captured);
    assert.equal(state.failures.size, 0);
});
