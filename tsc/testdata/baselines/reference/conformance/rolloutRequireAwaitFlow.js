//// [tests/cases/conformance/lint/rules/require-await/rolloutRequireAwaitFlow.ts] ////

//// [input.ts]
declare const values: AsyncIterable<number>, resource: AsyncDisposable;
async function missing() { return 1; }
const expression = async () => 1;
async function empty() {}
async function* generator() { yield 1; }
async function nested() { const inner = async () => { await Promise.resolve(); }; }
async function awaited() { await Promise.resolve(); }
async function iteration() { for await (const value of values) { console.log(value); } }
async function disposal() { await using value = resource; }
class Item { async method() { return 1; } }

//// [input.ts]
declare const values: AsyncIterable<number>, resource: AsyncDisposable;
async function missing() { return 1; }
const expression = async () => 1;
async function empty() {}
async function* generator() { yield 1; }
async function nested() { const inner = async () => { await Promise.resolve(); }; }
async function awaited() { await Promise.resolve(); }
async function iteration() { for await (const value of values) { console.log(value); } }
async function disposal() { await using value = resource; }
class Item { async method() { return 1; } }
