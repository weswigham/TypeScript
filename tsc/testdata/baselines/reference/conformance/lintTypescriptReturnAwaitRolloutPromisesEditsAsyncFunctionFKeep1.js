//// [tests/cases/conformance/lint/rules/return-await/lintTypescriptReturnAwaitRolloutPromisesEditsAsyncFunctionFKeep1.ts] ////

//// [input.ts]
async function f() { return await /* keep */ 1; }
export {};

//// [input.ts]
async function f() { return /* keep */ 1; }
export {};
