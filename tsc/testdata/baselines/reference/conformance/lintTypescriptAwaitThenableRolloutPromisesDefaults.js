//// [tests/cases/conformance/lint/rules/await-thenable/lintTypescriptAwaitThenableRolloutPromisesDefaults.ts] ////

//// [input.ts]
async function f() { await 1; await Promise.resolve(1); await { then(resolve: (n: number) => void) { resolve(1); } }; }
export {};

//// [input.ts]
async function f() { await 1; await Promise.resolve(1); await { then(resolve: (n: number) => void) { resolve(1); } }; }
export {};
