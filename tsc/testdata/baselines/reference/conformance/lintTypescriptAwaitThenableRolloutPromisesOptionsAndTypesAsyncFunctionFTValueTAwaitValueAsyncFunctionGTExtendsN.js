//// [tests/cases/conformance/lint/rules/await-thenable/lintTypescriptAwaitThenableRolloutPromisesOptionsAndTypesAsyncFunctionFTValueTAwaitValueAsyncFunctionGTExtendsN.ts] ////

//// [input.ts]
async function f<T>(value: T) { await value; } async function g<T extends number>(value: T) { await value; }
export {};

//// [input.ts]
async function f<T>(value: T) { await value; } async function g<T extends number>(value: T) { await value; }
export {};
