//// [tests/cases/conformance/lint/rules/no-floating-promises/lintTypescriptNoFloatingPromisesRolloutPromisesOptionsAndTypesPromiseResolveCatchUndefinedPromiseResolveThenNul.ts] ////

//// [input.ts]
Promise.resolve().catch(undefined); Promise.resolve().then(() => {}, null);
export {};

//// [input.ts]
Promise.resolve().catch(undefined); Promise.resolve().then(() => {}, null);
export {};
