//// [tests/cases/conformance/lint/rules/return-await/lintTypescriptReturnAwaitTypedParitySwitchResourcesEarlierCase.ts] ////

//// [input.ts]
async function f(k: number) { switch(k) { case 0: using r = null; case 1: return Promise.resolve(1); } }
export {};

//// [input.ts]
async function f(k: number) { switch(k) { case 0: using r = null; case 1: return Promise.resolve(1); } }
export {};
