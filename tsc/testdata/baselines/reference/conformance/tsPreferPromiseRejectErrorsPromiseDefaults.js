//// [tests/cases/conformance/lint/rules/prefer-promise-reject-errors/tsPreferPromiseRejectErrorsPromiseDefaults.ts] ////

//// [input.ts]
Promise.reject("text");
Promise.reject(new Error("text"));
Promise.reject();
new Promise((resolve, reject) => {
    reject(1);
    function shadowed(reject: (value: number) => void) { reject(1); }
});
class Derived<T> extends Promise<T> {}
Derived.reject(1);
export {};

//// [input.ts]
Promise.reject("text");
Promise.reject(new Error("text"));
Promise.reject();
new Promise((resolve, reject) => {
    reject(1);
    function shadowed(reject: (value: number) => void) { reject(1); }
});
class Derived<T> extends Promise<T> {}
Derived.reject(1);
export {};
