//// [tests/cases/conformance/lint/rules/no-func-assign/lintNoFuncAssignCoreScopeBFunctionWrites.ts] ////

//// [input.ts]
function run() {} run = other; [run] = values; const callback = function named() { named++; };

//// [input.ts]
function run() {} run = other; [run] = values; const callback = function named() { named++; };
