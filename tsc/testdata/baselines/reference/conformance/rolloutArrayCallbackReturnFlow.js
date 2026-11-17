//// [tests/cases/conformance/lint/rules/array-callback-return/rolloutArrayCallbackReturnFlow.ts] ////

//// [input.ts]
declare const values: number[], ready: boolean;
values.map(value => { if (ready) return value; });
values.filter(function callback(value) { return; });
values.some(value => { try { return value > 0; } finally { console.log(value); } });
values.every(value => { while (true) { if (ready) return true; } });
Array.fromAsync(values, async value => { console.log(value); });
values.forEach(value => console.log(value));
values.forEach(value => { return value + 1; });
values.forEach(value => void console.log(value));

//// [input.ts]
declare const values: number[], ready: boolean;
values.map(value => { if (ready) return value; });
values.filter(function callback(value) { return; });
values.some(value => { try { return value > 0; } finally { console.log(value); } });
values.every(value => { while (true) { if (ready) return true; } });
Array.fromAsync(values, async value => { console.log(value); });
values.forEach(value => console.log(value));
values.forEach(value => { return value + 1; });
values.forEach(value => void console.log(value));
