//// [tests/cases/conformance/lint/rules/require-await/lintTypescriptRequireAwaitRolloutPromisesDefaults.ts] ////

//// [input.ts]
async function f() { return 1; } async function g() { return Promise.resolve(1); }
export {};

//// [input.ts]
async function f() { return 1; } async function g() { return Promise.resolve(1); }
export {};
