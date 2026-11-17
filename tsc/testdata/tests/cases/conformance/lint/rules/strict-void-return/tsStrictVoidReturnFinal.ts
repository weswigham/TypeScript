// @target: esnext
// @strict: true
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "@typescript-eslint/strict-void-return": "error" } }
}
// @filename: input.ts

export {};
const literal: () => void = () => 1;
const sideEffect: () => void = () => Math.random();
const asynchronous: () => void = async () => { await Promise.resolve(); };
const block: () => void = () => { return 1; };
const permitted: () => void = () => undefined;
declare function overloaded(callback: () => void): void;
declare function overloaded(callback: () => boolean): void;
overloaded(() => false);
declare function constrained<T extends () => void>(callback: T): void;
constrained(() => 1);
interface Base { method(): void; }
class Derived implements Base {
    method() { return 1; }
}
const contextual: Base = { method() { return 1; } };