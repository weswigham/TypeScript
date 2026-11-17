//// [tests/cases/conformance/lint/rules/await-thenable/tsAwaitThenablePromiseDefaults.ts] ////

//// [input.ts]
async function check<T>(value: T) {
    await 1;
    await value;
    await Promise.resolve(1);
    await { then(resolve: (value: number) => void) { resolve(1); } };
    for await (const item of [1, 2]) {}
    await using resource = { [Symbol.dispose]() {} };
}
Promise.all([1, Promise.resolve(2)]);
export {};

//// [input.ts]
async function check<T>(value: T) {
    await 1;
    await value;
    await Promise.resolve(1);
    await { then(resolve: (value: number) => void) { resolve(1); } };
    for await (const item of [1, 2]) {}
    await using resource = { [Symbol.dispose]() {} };
}
Promise.all([1, Promise.resolve(2)]);
export {};
