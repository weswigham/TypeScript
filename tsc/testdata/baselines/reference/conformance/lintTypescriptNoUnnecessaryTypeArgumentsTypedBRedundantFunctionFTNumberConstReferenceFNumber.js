//// [tests/cases/conformance/lint/rules/no-unnecessary-type-arguments/lintTypescriptNoUnnecessaryTypeArgumentsTypedBRedundantFunctionFTNumberConstReferenceFNumber.ts] ////

//// [input.ts]
function f<T = number>() {} const reference = f<number>;

//// [input.ts]
function f<T = number>() {} const reference = f<number>;
