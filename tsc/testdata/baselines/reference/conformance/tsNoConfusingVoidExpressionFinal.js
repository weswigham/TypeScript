//// [tests/cases/conformance/lint/rules/no-confusing-void-expression/tsNoConfusingVoidExpressionFinal.ts] ////

//// [input.ts]
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

//// [input.ts]
export {};
declare function nothing(): void;
declare const flag: boolean;
const value = nothing();
const arrow = () => { nothing(); };
const conditional = () => { flag ? nothing() : nothing(); };
function finalReturn() {
    nothing();
}
function earlyReturn() {
    if (flag) { nothing(); return; }
    nothing();
}
nothing();
flag && nothing();
const sequence = (nothing(), 1);
