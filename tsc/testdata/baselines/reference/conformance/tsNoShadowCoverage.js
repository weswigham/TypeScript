//// [tests/cases/conformance/lint/rules/no-shadow/tsNoShadowCoverage.ts] ////

//// [input.ts]
export {};
const outer = 1;
function parameterShadow(outer: number) { return outer; }
function blockShadow() {
    const outer = 2;
    return outer;
}
type TypeOnly = number;
function differentNamespace() {
    const TypeOnly = 1;
    return TypeOnly;
}
function firstSibling() { const sibling = 1; return sibling; }
function secondSibling() { const sibling = 2; return sibling; }

//// [input.ts]
export {};
const outer = 1;
function parameterShadow(outer: number) { return outer; }
function blockShadow() {
    const outer = 2;
    return outer;
}
type TypeOnly = number;
function differentNamespace() {
    const TypeOnly = 1;
    return TypeOnly;
}
function firstSibling() { const sibling = 1; return sibling; }
function secondSibling() { const sibling = 2; return sibling; }
