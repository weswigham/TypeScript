//// [tests/cases/conformance/lint/rules/no-func-assign/lintNoFuncAssignCoreScopeBFunctionShadowing.ts] ////

//// [input.ts]
function run(run) { run = other; } const callback = function() {}; callback = other;

//// [input.ts]
function run(run) { run = other; } const callback = function() {}; callback = other;
