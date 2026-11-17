//// [tests/cases/conformance/lint/rules/no-floating-promises/lintTypescriptNoFloatingPromisesRolloutPromisesDefaults.ts] ////

//// [input.ts]
Promise.resolve(1); void Promise.resolve(1); Promise.resolve(1).catch(() => {});
export {};

//// [input.ts]
Promise.resolve(1); void Promise.resolve(1); Promise.resolve(1).catch(() => {});
export {};
