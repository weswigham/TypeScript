//// [tests/cases/conformance/lint/rules/no-misused-promises/lintTypescriptNoMisusedPromisesRolloutPromisesOptionsAndTypesUsingValueAsyncSymbolDispose.ts] ////

//// [input.ts]
using value = { async [Symbol.dispose]() {} };
export {};

//// [input.ts]
using value = { async [Symbol.dispose]() {} };
export {};
