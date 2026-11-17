//// [tests/cases/conformance/lint/rules/no-unnecessary-type-assertion/lintTypescriptNoUnnecessaryTypeAssertionFinalSimplifyAssertionFunctionFTExtendsAnyValueTUndefinedTReturnValue.ts] ////

//// [input.ts]
function f<T extends any>(value: T | undefined): T { return value!; }

//// [input.ts]
function f<T extends any>(value: T | undefined): T { return value!; }
