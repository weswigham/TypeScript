//// [tests/cases/conformance/lint/rules/max-lines-per-function/maxLinesPerFunctionCore.ts] ////

//// [input.ts]
function excessive() {
    work();
    other();
}
function valid() {
    // Comment-only line.

    work();
}
(() => {
    work();
    other();
    last();
})();

//// [input.ts]
function excessive() {
    work();
    other();
}
function valid() {
    // Comment-only line.

    work();
}
(() => {
    work();
    other();
    last();
})();
