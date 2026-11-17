//// [tests/cases/conformance/lint/rules/require-await/lintTypescriptRequireAwaitRolloutPromisesOptionsAndTypesAsyncFunctionFYieldPromiseResolve1AsyncFunctionGYield1.ts] ////

//// [input.ts]
async function* f() { yield Promise.resolve(1); } async function* g() { yield 1; }
export {};

//// [input.ts]
async function* f() { yield Promise.resolve(1); } async function* g() { yield 1; }
export {};
