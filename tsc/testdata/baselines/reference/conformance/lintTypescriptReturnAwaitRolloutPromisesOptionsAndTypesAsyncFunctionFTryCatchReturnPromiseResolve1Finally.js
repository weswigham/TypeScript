//// [tests/cases/conformance/lint/rules/return-await/lintTypescriptReturnAwaitRolloutPromisesOptionsAndTypesAsyncFunctionFTryCatchReturnPromiseResolve1Finally.ts] ////

//// [input.ts]
async function f() { try {} catch { return Promise.resolve(1); } finally {} }
export {};

//// [input.ts]
async function f() { try {} catch { return Promise.resolve(1); } finally {} }
export {};
