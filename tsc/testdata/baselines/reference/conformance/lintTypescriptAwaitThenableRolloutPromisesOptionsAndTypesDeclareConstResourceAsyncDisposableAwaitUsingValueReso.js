//// [tests/cases/conformance/lint/rules/await-thenable/lintTypescriptAwaitThenableRolloutPromisesOptionsAndTypesDeclareConstResourceAsyncDisposableAwaitUsingValueReso.ts] ////

//// [input.ts]
declare const resource: AsyncDisposable; await using value = resource;
export {};

//// [input.ts]
declare const resource: AsyncDisposable; await using value = resource;
export {};
