//// [tests/cases/conformance/lint/rules/await-thenable/lintTypescriptAwaitThenableRolloutPromisesOptionsAndTypesAwaitThenAwaitThenCallbackString.ts] ////

//// [input.ts]
await { then() {} }; await { then(callback: string) {} };
export {};

//// [input.ts]
await { then() {} }; await { then(callback: string) {} };
export {};
