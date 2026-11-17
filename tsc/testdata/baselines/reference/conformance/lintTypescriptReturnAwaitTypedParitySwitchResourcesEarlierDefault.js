//// [tests/cases/conformance/lint/rules/return-await/lintTypescriptReturnAwaitTypedParitySwitchResourcesEarlierDefault.ts] ////

//// [input.ts]
async function f(k: number) { switch(k) { default: using r = null; case 1: return Promise.resolve(1); } }
export {};

//// [input.ts]
async function f(k: number) { switch(k) { default: using r = null; case 1: return Promise.resolve(1); } }
export {};
