//// [tests/cases/conformance/lint/rules/return-await/lintTypescriptReturnAwaitTypedParitySwitchResourcesAwaitUsing.ts] ////

//// [input.ts]
async function f(k: number) { switch(k) { case 0: await using r = null; return Promise.resolve(1); } }
export {};

//// [input.ts]
async function f(k: number) { switch(k) { case 0: await using r = null; return Promise.resolve(1); } }
export {};
