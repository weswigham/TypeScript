//// [tests/cases/conformance/lint/rules/require-await/tsRequireAwaitPromiseDefaults.ts] ////

//// [input.ts]
async function plain(): Promise<number> { return 1; }
async function promised() { return Promise.resolve(1); }
async function empty() {}
async function* plainGenerator() { yield 1; }
async function* promisedGenerator() { yield Promise.resolve(1); }
async function nested() { async function inner() { await 1; } }
export {};

//// [input.ts]
async function plain(): Promise<number> { return 1; }
async function promised() { return Promise.resolve(1); }
async function empty() {}
async function* plainGenerator() { yield 1; }
async function* promisedGenerator() { yield Promise.resolve(1); }
async function nested() { async function inner() { await 1; } }
export {};
