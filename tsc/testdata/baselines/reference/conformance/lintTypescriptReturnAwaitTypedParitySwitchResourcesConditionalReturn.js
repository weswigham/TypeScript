//// [tests/cases/conformance/lint/rules/return-await/lintTypescriptReturnAwaitTypedParitySwitchResourcesConditionalReturn.ts] ////

//// [input.ts]
async function f(k: number) { switch(k) { case 0: using r = null; return k ? Promise.resolve(1) : Promise.resolve(2); } }
export {};

//// [input.ts]
async function f(k: number) { switch(k) { case 0: using r = null; return k ? Promise.resolve(1) : Promise.resolve(2); } }
export {};
