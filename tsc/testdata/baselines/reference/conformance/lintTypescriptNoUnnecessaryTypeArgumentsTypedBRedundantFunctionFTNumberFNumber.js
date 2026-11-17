//// [tests/cases/conformance/lint/rules/no-unnecessary-type-arguments/lintTypescriptNoUnnecessaryTypeArgumentsTypedBRedundantFunctionFTNumberFNumber.ts] ////

//// [input.ts]
function f<T = number>() {} f<number>();

//// [input.ts]
function f<T = number>() {} f();
