//// [tests/cases/conformance/lint/rules/return-await/lintTypescriptReturnAwaitTypedParitySwitchResourcesLaterDeclaration.ts] ////

//// [input.ts]
async function f(k: number) { switch(k) { case 0: return await Promise.resolve(1); case 1: using r = null; } }
export {};

//// [input.ts]
async function f(k: number) { switch(k) { case 0: return Promise.resolve(1); case 1: using r = null; } }
export {};
