//// [tests/cases/conformance/lint/rules/require-await/lintTypescriptRequireAwaitRolloutPromisesOptionsAndTypesAsyncFunctionFAsyncFunctionOuterAsyncFunctionInnerAwait.ts] ////

//// [input.ts]
async function f() {} async function outer() { async function inner() { await 1; } }
export {};

//// [input.ts]
async function f() {} async function outer() { async function inner() { await 1; } }
export {};
