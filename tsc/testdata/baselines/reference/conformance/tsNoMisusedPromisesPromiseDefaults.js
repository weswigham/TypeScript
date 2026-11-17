//// [tests/cases/conformance/lint/rules/no-misused-promises/tsNoMisusedPromisesPromiseDefaults.ts] ////

//// [input.ts]
if (Promise.resolve(true)) {}
const callback: () => void = async () => {};
[1, 2].filter(async () => true);
[1, 2].forEach(async () => {});
const object = { ...Promise.resolve({ value: 1 }) };
interface Base { run(): void; }
class Derived implements Base { async run() {} }
Promise.resolve().finally(async () => {});
export {};

//// [input.ts]
if (Promise.resolve(true)) {}
const callback: () => void = async () => {};
[1, 2].filter(async () => true);
[1, 2].forEach(async () => {});
const object = { ...Promise.resolve({ value: 1 }) };
interface Base { run(): void; }
class Derived implements Base { async run() {} }
Promise.resolve().finally(async () => {});
export {};
