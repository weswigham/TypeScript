//// [tests/cases/conformance/lint/rules/return-await/lintTypescriptReturnAwaitRolloutPromisesDefaults.ts] ////

//// [input.ts]
async function f() { return await 1; } async function g() { try { return Promise.resolve(1); } catch {} }
export {};

//// [input.ts]
async function f() { return 1; } async function g() { try { return Promise.resolve(1); } catch {} }
export {};
