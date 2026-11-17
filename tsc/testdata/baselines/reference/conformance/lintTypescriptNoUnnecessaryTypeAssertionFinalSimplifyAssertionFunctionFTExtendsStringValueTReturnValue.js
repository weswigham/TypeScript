//// [tests/cases/conformance/lint/rules/no-unnecessary-type-assertion/lintTypescriptNoUnnecessaryTypeAssertionFinalSimplifyAssertionFunctionFTExtendsStringValueTReturnValue.ts] ////

//// [input.ts]
function f<T extends string>(value: T) { return value!; }

//// [input.ts]
function f<T extends string>(value: T) { return value; }
