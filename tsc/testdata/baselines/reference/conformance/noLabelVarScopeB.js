//// [tests/cases/conformance/lint/rules/no-label-var/noLabelVarScopeB.ts] ////

//// [input.ts]
let outer;
function run(parameter) {
    outer: while (ready) { break outer; }
    parameter: {}
    fresh: {}
}
function separate() { let fresh; }

//// [input.ts]
let outer;
function run(parameter) {
    outer: while (ready) { break outer; }
    parameter: {}
    fresh: {}
}
function separate() { let fresh; }
