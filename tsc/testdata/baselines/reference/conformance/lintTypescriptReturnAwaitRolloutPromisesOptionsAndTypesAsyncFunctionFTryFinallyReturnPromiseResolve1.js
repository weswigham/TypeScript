//// [tests/cases/conformance/lint/rules/return-await/lintTypescriptReturnAwaitRolloutPromisesOptionsAndTypesAsyncFunctionFTryFinallyReturnPromiseResolve1.ts] ////

//// [input.ts]
async function f() { try {} finally { return Promise.resolve(1); } }
export {};

//// [input.ts]
async function f() { try {} finally { return Promise.resolve(1); } }
export {};
