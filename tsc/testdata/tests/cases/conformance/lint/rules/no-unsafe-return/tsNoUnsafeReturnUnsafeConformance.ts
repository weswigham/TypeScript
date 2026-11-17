// @strict: true
// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext"},"lint":{"rules":{"@typescript-eslint/no-unsafe-return":"error"}}}
// @filename: input.ts
declare const unsafe: any;
function inferred() { return unsafe; }
function explicit(): any { return unsafe; }
function unknownValue(): unknown { return unsafe; }
function array() { return [] as any[]; }
function unknownArray(): unknown[] { return [] as any[]; }
function generic(): Set<string> { return new Set<any>(); }
const contextual: () => Set<string> = () => new Set<any>();
async function asyncInferred() { return Promise.resolve(unsafe); }
async function asyncExplicit(): Promise<any> { return Promise.resolve(unsafe); }
async function asyncUnknown(): Promise<unknown> { return Promise.resolve(unsafe); }
function nonAsyncPromise() { return Promise.resolve(unsafe); }
function unconstrained<T extends any>(value: T) { return value; }