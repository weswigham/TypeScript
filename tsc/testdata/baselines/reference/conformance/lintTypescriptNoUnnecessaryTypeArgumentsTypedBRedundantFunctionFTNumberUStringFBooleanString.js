//// [tests/cases/conformance/lint/rules/no-unnecessary-type-arguments/lintTypescriptNoUnnecessaryTypeArgumentsTypedBRedundantFunctionFTNumberUStringFBooleanString.ts] ////

//// [input.ts]
function f<T = number, U = string>() {} f<boolean, string>();

//// [input.ts]
function f<T = number, U = string>() {} f<boolean>();
