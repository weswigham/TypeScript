//// [tests/cases/conformance/lint/rules/no-unsafe-type-assertion/lintTypescriptNoUnsafeTypeAssertionTypedBUnsafeAssertionFunctionFTExtendsStringValueStringReturnValueAsT.ts] ////

//// [input.ts]
function f<T extends string>(value: string) { return value as T; }

//// [input.ts]
function f<T extends string>(value: string) { return value as T; }
