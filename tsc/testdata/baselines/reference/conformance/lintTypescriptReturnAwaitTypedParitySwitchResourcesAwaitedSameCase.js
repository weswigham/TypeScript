//// [tests/cases/conformance/lint/rules/return-await/lintTypescriptReturnAwaitTypedParitySwitchResourcesAwaitedSameCase.ts] ////

//// [input.ts]
async function f(k: number) { switch(k) { case 0: using r = null; return await Promise.resolve(1); } }
export {};

//// [input.ts]
async function f(k: number) { switch(k) { case 0: using r = null; return await Promise.resolve(1); } }
export {};
