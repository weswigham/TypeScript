//// [tests/cases/conformance/lint/rules/return-await/lintTypescriptReturnAwaitRolloutPromisesEditsAsyncFunctionFReturnPromiseResolve1.ts] ////

//// [input.ts]
async function f() { return Promise.resolve(1); }
export {};

//// [input.ts]
async function f() { return await Promise.resolve(1); }
export {};
