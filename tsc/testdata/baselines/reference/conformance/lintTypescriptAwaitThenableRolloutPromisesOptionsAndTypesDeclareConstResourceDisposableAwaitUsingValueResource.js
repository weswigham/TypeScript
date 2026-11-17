//// [tests/cases/conformance/lint/rules/await-thenable/lintTypescriptAwaitThenableRolloutPromisesOptionsAndTypesDeclareConstResourceDisposableAwaitUsingValueResource.ts] ////

//// [input.ts]
declare const resource: Disposable; await using value = resource;
export {};

//// [input.ts]
declare const resource: Disposable; await using value = resource;
export {};
