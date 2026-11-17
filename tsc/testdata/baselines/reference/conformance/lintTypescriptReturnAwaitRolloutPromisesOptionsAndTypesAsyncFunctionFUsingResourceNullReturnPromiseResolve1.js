//// [tests/cases/conformance/lint/rules/return-await/lintTypescriptReturnAwaitRolloutPromisesOptionsAndTypesAsyncFunctionFUsingResourceNullReturnPromiseResolve1.ts] ////

//// [input.ts]
async function f() { using resource = null; return Promise.resolve(1); }
export {};

//// [input.ts]
async function f() { using resource = null; return Promise.resolve(1); }
export {};
