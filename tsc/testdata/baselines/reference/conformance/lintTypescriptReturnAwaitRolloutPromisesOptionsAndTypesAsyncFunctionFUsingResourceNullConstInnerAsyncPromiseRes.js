//// [tests/cases/conformance/lint/rules/return-await/lintTypescriptReturnAwaitRolloutPromisesOptionsAndTypesAsyncFunctionFUsingResourceNullConstInnerAsyncPromiseRes.ts] ////

//// [input.ts]
async function f() { using resource = null; const inner = async () => Promise.resolve(1); }
export {};

//// [input.ts]
async function f() { using resource = null; const inner = async () => Promise.resolve(1); }
export {};
