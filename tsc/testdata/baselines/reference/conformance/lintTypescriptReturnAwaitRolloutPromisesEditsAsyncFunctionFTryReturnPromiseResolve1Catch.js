//// [tests/cases/conformance/lint/rules/return-await/lintTypescriptReturnAwaitRolloutPromisesEditsAsyncFunctionFTryReturnPromiseResolve1Catch.ts] ////

//// [input.ts]
async function f() { try { return Promise.resolve(1); } catch {} }
export {};

//// [input.ts]
async function f() { try { return Promise.resolve(1); } catch {} }
export {};
