// @target: esnext
// @strict: true
// @lintOnly: true
// @fix: true
// @filename: tsconfig.json
{
    "lint": { "rules": { "@typescript-eslint/no-confusing-void-expression": "error" } }
}
// @filename: input.ts

export {};
declare function nothing(): void;
declare const flag: boolean;
const value = nothing();
const arrow = () => nothing();
const conditional = () => flag ? nothing() : nothing();
function finalReturn() {
    return nothing();
}
function earlyReturn() {
    if (flag) return nothing();
    nothing();
}
nothing();
flag && nothing();
const sequence = (nothing(), 1);