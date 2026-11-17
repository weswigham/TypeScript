//// [tests/cases/conformance/lint/rules/no-floating-promises/tsNoFloatingPromisesPromiseDefaults.ts] ////

//// [input.ts]
Promise.resolve(1);
void Promise.resolve(1);
Promise.resolve(1).catch(() => {});
Promise.resolve(1).catch(undefined);
[Promise.resolve(1)];
declare const thenable: PromiseLike<number>;
thenable;
export {};

//// [input.ts]
Promise.resolve(1);
void Promise.resolve(1);
Promise.resolve(1).catch(() => {});
Promise.resolve(1).catch(undefined);
[Promise.resolve(1)];
declare const thenable: PromiseLike<number>;
thenable;
export {};
