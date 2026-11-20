import { analyze } from "@typescript-eslint/scope-manager";
import type { TSESTree } from "@typescript-eslint/types";
import { parse } from "@typescript-eslint/typescript-estree";
import assert from "node:assert/strict";
import {
    describe,
    test,
} from "node:test";
import { fileURLToPath } from "node:url";
import { RemoteSourceFile } from "../../src/api/node/node.ts";
import { Wtf8Decoder } from "../../src/api/node/wtf8.ts";
import { API } from "../../src/api/sync/api.ts";
import {
    isSourceFile,
    type Node,
    type SourceFile,
    SyntaxKind,
} from "../../src/ast/index.ts";
import { convertSourceFile } from "../../src/lint/estree/index.ts";
import { analyzeScopes } from "../../src/lint/scope.ts";
import { createVirtualFileSystem } from "../testUtils.ts";

function decodeLocally(text: string, extension = "ts"): SourceFile {
    using api = new API({
        cwd: fileURLToPath(new URL("../../../../", import.meta.url)),
        tsserverPath: fileURLToPath(new URL(`../../../../built/local/tsc${process.platform === "win32" ? ".exe" : ""}`, import.meta.url)),
        fs: createVirtualFileSystem({
            "/tsconfig.json": JSON.stringify({ compilerOptions: { allowJs: true, jsx: "preserve", moduleDetection: "legacy" } }),
            [`/src/input.${extension}`]: text,
        }),
    });
    const snapshot = api.createSnapshot({ openProjects: ["/tsconfig.json"] });
    const remote = snapshot.getConfiguredProject("/tsconfig.json")!.program.getSourceFile(`/src/input.${extension}`)!;
    assert.ok(remote instanceof RemoteSourceFile);
    const { view } = remote;
    const local = new RemoteSourceFile(new Uint8Array(view.buffer, view.byteOffset, view.byteLength), new Wtf8Decoder());
    assert.equal(local.api, undefined);
    assert.ok(isSourceFile(local));
    return local;
}

function normalized(value: unknown): unknown {
    if (typeof value === "bigint") return `${value}n`;
    if (value instanceof RegExp) return String(value);
    if (Array.isArray(value)) return value.map(normalized);
    if (!value || typeof value !== "object") return value;
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
        if (key !== "parent" && child !== undefined) result[key] = normalized(child);
    }
    return result;
}

const fixtures = [
    {
        name: "modern expressions and optional chain boundaries",
        text: `"use strict"; const x = (obj?.method?.<string>("x")!).value ?? 0; const y = obj?.a.b!(); const mod = import("pkg", { with: { type: "json" } }); class C { #x = 0; accessor y = 1; static { this.y++; } }`,
    },
    {
        name: "comments, regex, template tokens and UTF-16 locations",
        text: "#!/usr/bin/env node\r\n// 😀\r\nconst 𐐀 = /[/*]foo\\//giu; /* block */\u2028const s = `😀${𐐀.test('é')}x${1}z`;\nconst n = 0xFF_FFn;",
    },
    {
        name: "binding patterns, functions and control flow",
        text: `const { a: [x = 1, , ...rest], ...other } = value; ({x = 2} = other); async function* f(a: string, ...args: number[]) { "use strict"; for await (const x of args) { if (x) yield x; else continue; } try { throw a; } catch (e: unknown) { return e; } finally { debugger; } }`,
    },
    {
        name: "type declarations and signatures",
        text: `export interface I<in T, out U = T> extends Base<T> { readonly p?: U; new (x: T): I<T>; (x: T): U; get value(): U; set value(x: U); [key: string]: unknown; m<K extends keyof T>(x: K): T[K]; } export type M<T> = { -readonly [K in keyof T as \`x\${K & string}\`]+?: T[K] }; type F = abstract new <T>(x: T) => I<T>; type A = [first?: string, ...rest: number[]]; type B<T> = T extends infer U extends string ? U[] : never; type C = typeof import("pkg").value;`,
    },
    {
        name: "class modifiers, decorators and parameter properties",
        text: `@dec export abstract class C<T> extends Base<T> implements I<T> { @dec abstract p?: string; protected abstract m<U>(x: U): T; abstract get value(): T; abstract accessor a: T; static readonly k = 1; constructor(@dec public readonly x: T = init) { super(); } override method(x?: T): asserts x is T { } }`,
    },
    {
        name: "imports, exports, enums and namespaces",
        text: `import type D from "d"; import { type A, B as C } from "m" with { type: "json" }; import * as ns from "n"; export type { A }; export { C as default }; export * as other from "o"; export const enum E { A = 1, B = A + 1 } declare namespace N.Inner { export function f(): void; } import alias = require("p"); export = alias;`,
    },
    {
        name: "JSX text, entities, names, expressions and generics",
        extension: "tsx",
        text: `const el = <><ns.Component<string> ns:prop="&amp;&#x1f600;" {...props}> text &lt; 😀 {/* comment */}{value}<div data-x='&quot;' /></ns.Component></>;`,
    },
    {
        name: "nested generics, comments and instantiation expressions",
        text: `type F = ReturnType<<const T extends string>(x: T) => T>; const f = fn< /* a */ string, number /* b */ >; const g = <T,>(x: T): T => x; const a = <string>value;`,
    },
    {
        name: "tagged escapes, multiline templates and numeric spellings",
        text: "const a = tag`\\u00xx${1}\\xQz`; const b = `a\r\nb${2}c\r\nd`; const c = 1_000 + .5 + 0b10 + 0o7 + 0xF; const d = 0b1010_1010n;",
    },
    {
        name: "type imports with options, declarations and module augmentations",
        text: `type T = import("pkg", { with: { type: "json" }, }).T<string>; type V = typeof import("pkg", { with: { type: "json" } }); declare global { interface Window { x: T } } declare module "pkg"; module Old.Inner { export let n: number; } export as namespace Global;`,
    },
    {
        name: "loop resources, operators, private methods and anonymous exports",
        text: `using r = acquire(); for (using r of resources) { r.use(); } for (let i = 0; i < 2; i++) { switch(i) { case 0: break; default: continue; } } class A { #m() {} accessor #x = 0; test(o: object) { return #m in o; } } export default class extends (a ?? b) { ; }`,
    },
    {
        name: "JavaScript source with JSDoc and contextual property names",
        extension: "js",
        text: `/** @param {string} x */ function f(x) { return { get value() { return x; }, set value(v) { x = v; }, async *method() { yield* x; }, await: 1, let: true, get: null }; } const q = (a / b) >> 2;`,
    },
    {
        name: "JSDoc-derived declarations, generics, optional parameters and modifiers",
        extension: "js",
        text: `/** @typedef {{ p: string }} Options */\n/** @template T\n * @param {T} [value]\n * @returns {T}\n */ function id(value) { return value; }\nclass C { /** @private @type {number} */ p = 1; /** @type {number=} */ maybe; }\n/** @type {Options} */ const options = { p: "x" }; const asserted = /** @type {number} */ (value); const checked = /** @satisfies {Options} */ ({p:"x"});`,
    },
    {
        name: "assignment targets, grouping and nested optional chains",
        text: `({ a: obj.x = 1, b: obj.y, ...obj.rest } = value); [obj.x = 1, , ...obj.rest] = values; const z = ((a, b), c); const v = (obj?.a)!.b; obj?.a!.b?.();`,
    },
    {
        name: "this and keyword property names in type queries",
        text: `type A = typeof ns.this; class C { m() { type T = typeof this.value; type U = typeof this; } }`,
    },
    {
        name: "ambient declarations, keyword types, predicates and type literals",
        extension: "d.ts",
        text: `export declare function f<T>(x: unknown): x is T; export default function (x: number): void; declare const key: unique symbol; type Shape = { <T>(x: T): T; new (x: any): object; readonly [key: string]: unknown; p?: boolean | bigint | null | undefined; }; type R = readonly [symbol, this]; type Intrinsic = intrinsic;`,
    },
    {
        name: "deferred imports and string export names",
        text: `import defer * as ns from "pkg"; import data from "json" with { type: "json" }; export { "a" as "b" } from "pkg"; export * as "str" from "pkg"; const p = import.defer("pkg");`,
    },
    {
        name: "BOM and trailing comment-only lines",
        text: "\uFEFF// comment 😀\r\nconst x = '𝄞';\r\n/* last */",
    },
    {
        name: "BOM and lone surrogate literal values survive native decoding",
        text: "const bom = '\\uFEFFtext'; const lone = '\\ud800'; const template = `\\uFEFFtext`;",
    },
];

describe("native ESTree conversion", () => {
    test("models native 2026 library globals without widening to ESNext", () => {
        const converted = convertSourceFile(decodeLocally("export {}; type Result = RawJSON; const invalid = RawJSON; type Missing = RawJSONInstance; function f() { const RawJSON = 1; type Inner = RawJSON; return RawJSON; }"));
        const scope = analyzeScopes(converted.ast, { sourceType: "module", lib: ["es2026"], childVisitorKeys: converted.visitorKeys });
        const global = scope.globalScope!;
        const raw = global.set.get("RawJSON")!;
        assert.equal(raw.isTypeVariable, true);
        assert.equal(raw.isValueVariable, false);
        assert.equal(raw.references.length, 2);
        assert.ok(raw.references.every(reference => reference.isTypeReference && reference.resolved === raw));
        assert.deepEqual(global.through.map(reference => reference.identifier.name).sort(), ["RawJSON", "RawJSONInstance"]);
        const local = scope.scopes.find(scope => scope.type === "function")!.set.get("RawJSON")!;
        assert.ok(local.references.every(reference => reference.resolved === local && reference.isValueReference));
        assert.equal(global.set.has("RawJSONInstance"), false);
        assert.equal(global.set.has("Temporal"), false);
        assert.equal(global.set.has("AbstractModuleSource"), false);
        assert.equal(global.set.has("Window"), false);
        const full = analyzeScopes(converted.ast, { sourceType: "module", lib: ["es2026.full"], childVisitorKeys: converted.visitorKeys });
        assert.equal(full.globalScope!.set.has("Window"), true);
    });

    test("models native ESNext module-source types and does not expose module-private library helpers", () => {
        const converted = convertSourceFile(decodeLocally("export {}; type Source = AbstractModuleSource; const invalid = AbstractModuleSource; type Hidden = IteratorZipOptions;"));
        const scope = analyzeScopes(converted.ast, { sourceType: "module", lib: ["esnext"], childVisitorKeys: converted.visitorKeys });
        const global = scope.globalScope!;
        const source = global.set.get("AbstractModuleSource")!;
        assert.equal(source.isTypeVariable, true);
        assert.equal(source.isValueVariable, false);
        assert.equal(source.references.length, 1);
        assert.equal(source.references[0].resolved, source);
        assert.deepEqual(global.through.map(reference => reference.identifier.name).sort(), ["AbstractModuleSource", "IteratorZipOptions"]);
        assert.equal(global.set.has("RawJSON"), true);
        assert.equal(global.set.has("Temporal"), true);
    });

    test("creates BOM-free coordinates directly for SourceCode without changing native ranges", () => {
        for (
            const fixture of fixtures.filter(fixture =>
                [
                    "type declarations and signatures",
                    "imports, exports, enums and namespaces",
                    "comments, regex, template tokens and UTF-16 locations",
                    "JSX text, entities, names, expressions and generics",
                ].includes(fixture.name)
            )
        ) {
            const text = fixture.text.startsWith("#!") ? fixture.text.replace(/^.*?\r?\n/u, "") : fixture.text;
            const native = decodeLocally(`\uFEFF${text}`, fixture.extension);
            const actual = convertSourceFile(native, true);
            const expected = parse(text, { loc: true, range: true, tokens: true, comment: true, jsx: fixture.extension === "tsx" });
            assert.deepEqual(normalized(actual.ast), normalized(expected), fixture.name);
            assert.equal(actual.esTreeNodeToTSNodeMap.get(actual.ast), native);
            assert.equal(native.text, `\uFEFF${text}`);
        }
    });

    for (const fixture of fixtures) {
        test(`matches typescript-eslint: ${fixture.name}`, () => {
            const sourceFile = decodeLocally(fixture.text, fixture.extension);
            const actual = convertSourceFile(sourceFile);
            const expected = parse(fixture.text, { loc: true, range: true, tokens: true, comment: true, jsx: fixture.extension === "tsx" });
            assert.deepEqual(normalized(actual.ast), normalized(expected));
            const scope = analyze(actual.ast, { sourceType: actual.ast.sourceType, lib: ["esnext"], childVisitorKeys: actual.visitorKeys });
            assert.ok(scope.globalScope);
        });
    }

    test("maps native identities and links each ESTree parent without changing the native tree", () => {
        const sourceFile = decodeLocally("export abstract class C { abstract name: string; abstract method(): string; constructor(public x: string) {} m() { return this?.x!.length; } }");
        const nativeParents = new Map<Node, Node>();
        function visitNative(node: Node): void {
            nativeParents.set(node, node.parent);
            for (const child of node.childrenIter()) visitNative(child);
        }
        visitNative(sourceFile);
        const result = convertSourceFile(sourceFile);
        assert.equal(result.esTreeNodeToTSNodeMap.get(result.ast), sourceFile);
        assert.equal(result.tsNodeToESTreeNodeMap.get(sourceFile), result.ast);
        const convertedNodes = new Set<TSESTree.Node>();
        function visit(node: TSESTree.Node): void {
            convertedNodes.add(node);
            assert.ok(result.esTreeNodeToTSNodeMap.has(node), node.type);
            for (const key of result.visitorKeys[node.type]!) {
                const child: unknown = Reflect.get(node, key);
                for (const item of Array.isArray(child) ? child : [child]) {
                    if (!item || typeof item !== "object" || !("type" in item)) continue;
                    const converted = item as TSESTree.Node;
                    assert.equal(converted.parent, node);
                    visit(converted);
                }
            }
        }
        visit(result.ast);
        for (const [native, parent] of nativeParents) {
            assert.equal(native.parent, parent);
            if (native.kind === SyntaxKind.Identifier || native.kind === SyntaxKind.PropertyAccessExpression || native.kind === SyntaxKind.NonNullExpression) {
                assert.ok(convertedNodes.has(result.tsNodeToESTreeNodeMap.get(native)!), `native kind ${native.kind} at ${native.pos}`);
            }
        }
        assert.deepEqual(normalized(convertSourceFile(sourceFile).ast), normalized(result.ast));
    });

    test("does not turn parser recovery into a successful empty program", () => {
        for (const text of ["const = ;", "/* unterminated", "const value = 'unterminated", "const value = `unterminated", "function f( {", "export type T = ;", "function f(...args = value) {}", "const { ...rest = value } = source;", "call() = value;"]) {
            assert.throws(() => convertSourceFile(decodeLocally(text)));
        }
    });

    test("tagged template invalid code-point escapes retain null cooked values", () => {
        const result = convertSourceFile(decodeLocally("tag`\\u{notHex}`;"));
        const statement = result.ast.body[0];
        assert.equal(statement.type, "ExpressionStatement");
        if (statement.type !== "ExpressionStatement" || statement.expression.type !== "TaggedTemplateExpression") assert.fail();
        const quasi = statement.expression.quasi;
        assert.equal(quasi.type, "TemplateLiteral");
        assert.equal(quasi.quasis[0].value.cooked, null);
        assert.equal(quasi.quasis[0].value.raw, "\\u{notHex}");
    });

    test("native private-member type queries retain their private identifier and maps", () => {
        const sourceFile = decodeLocally("class C { #x = 1; m() { type P = typeof this.#x; } }");
        const result = convertSourceFile(sourceFile);
        let queriedPrivate: Node | undefined;
        function visit(node: Node): void {
            if (node.kind === SyntaxKind.PrivateIdentifier && node.parent.kind === SyntaxKind.QualifiedName) queriedPrivate = node;
            for (const child of node.childrenIter()) visit(child);
        }
        visit(sourceFile);
        assert.ok(queriedPrivate);
        const converted = result.tsNodeToESTreeNodeMap.get(queriedPrivate);
        assert.equal(converted?.type, "PrivateIdentifier");
        if (converted?.type === "PrivateIdentifier") assert.equal(converted.name, "x");
        assert.equal(converted?.parent.type, "TSQualifiedName");
        assert.ok(analyze(result.ast, { lib: ["esnext"], childVisitorKeys: result.visitorKeys }).globalScope);
    });

    test("empty and comment-only programs keep comments and their full file range", () => {
        for (const text of ["", "// 😀\r\n/* type T = never; */\n", "#!/usr/bin/env node\n"]) {
            const result = convertSourceFile(decodeLocally(text));
            const expected = parse(text, { range: true, loc: true, comment: true, tokens: true });
            assert.deepEqual(normalized(result.ast), normalized(expected));
        }
    });

    test("large UTF-16 offsets preserve trivia, JSDoc overlays, and binding holes", () => {
        const text = `/*${"😀".repeat(33000)}*/\n/** @param {string} value */ function f(value) { const [first, , ...rest] = value; return {first, rest}; }`;
        const result = convertSourceFile(decodeLocally(text, "js"));
        const expected = parse(text, { range: true, loc: true, comment: true, tokens: true });
        assert.deepEqual(normalized(result.ast), normalized(expected));
    });

    test("escaped identifiers retain decoded names and raw token spellings", () => {
        const text = "const \\u{10400} = 1; const \\u0061 = \\u{10400}; const obj = { \\u0061 };";
        const result = convertSourceFile(decodeLocally(text));
        const expected = parse(text, { range: true, loc: true, comment: true, tokens: true });
        assert.deepEqual(normalized(result.ast), normalized(expected));
    });

    test("frozen nodes and tokens retain lazy, cacheable, writable locations", () => {
        const result = convertSourceFile(decodeLocally("const value = 1;"));
        for (const located of [result.ast.body[0], result.ast.tokens![0]]) {
            Object.freeze(located);
            assert.strictEqual(located.loc, located.loc);
            const replacement = { start: { line: 2, column: 0 }, end: { line: 2, column: 1 } };
            located.loc = replacement;
            assert.strictEqual(located.loc, replacement);
        }
    });

    test("locations are shared-accessor, lazy and cached; aliases retain their identities", () => {
        const result = convertSourceFile(decodeLocally(`import data from "pkg" with { type: "json" }; enum E { A } const p = import("pkg");`));
        const [imported, enumeration, variable] = result.ast.body;
        assert.equal(imported.type, "ImportDeclaration");
        assert.equal(enumeration.type, "TSEnumDeclaration");
        assert.equal(variable.type, "VariableDeclaration");
        assert.equal(Object.getOwnPropertyDescriptor(imported, "loc")!.get, Object.getOwnPropertyDescriptor(enumeration, "loc")!.get);
        assert.equal(imported.loc, imported.loc);
        if (imported.type === "ImportDeclaration") assert.equal(imported.assertions, imported.attributes);
        if (enumeration.type === "TSEnumDeclaration") assert.equal(enumeration.members, enumeration.body.members);
        if (variable.type === "VariableDeclaration") {
            const importedExpression = variable.declarations[0].init;
            assert.equal(importedExpression?.type, "ImportExpression");
            if (importedExpression?.type === "ImportExpression") assert.equal(importedExpression.attributes, importedExpression.options);
        }
        assert.equal(Object.keys(imported).includes("assertions"), false);
    });
});
