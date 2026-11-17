// @strict: true
// @target: esnext
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{"compilerOptions":{"strict":true,"target":"esnext"},"lint":{"rules":{"@typescript-eslint/no-unsafe-call":"error"}}}
// @filename: input.ts
declare const unsafe: any;
declare const broad: Function;
declare const safe: () => void;
interface Callable extends Function { (): string; }
interface VoidCallable extends Function { (): void; }
declare const callable: Callable;
declare const voidCallable: VoidCallable;
unsafe();
unsafe?.();
new unsafe();
unsafe`text`;
broad();
new voidCallable();
new callable();
safe();
missing();
function generic<T extends any>(value: T) { value(); }