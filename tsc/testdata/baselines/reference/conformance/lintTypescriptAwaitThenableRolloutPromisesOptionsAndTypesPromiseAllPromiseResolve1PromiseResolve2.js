//// [tests/cases/conformance/lint/rules/await-thenable/lintTypescriptAwaitThenableRolloutPromisesOptionsAndTypesPromiseAllPromiseResolve1PromiseResolve2.ts] ////

//// [input.ts]
Promise.all([...[Promise.resolve(1), Promise.resolve(2)]]);
export {};

//// [input.ts]
Promise.all([...[Promise.resolve(1), Promise.resolve(2)]]);
export {};
