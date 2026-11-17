//// [tests/cases/conformance/lint/rules/no-floating-promises/lintTypescriptNoFloatingPromisesRolloutPromisesOptionsAndTypesPromiseResolveCatchFinallyCase1.ts] ////

//// [input.ts]
Promise.resolve().catch(() => {}).finally(...[]);
export {};

//// [input.ts]
Promise.resolve().catch(() => {}).finally(...[]);
export {};
