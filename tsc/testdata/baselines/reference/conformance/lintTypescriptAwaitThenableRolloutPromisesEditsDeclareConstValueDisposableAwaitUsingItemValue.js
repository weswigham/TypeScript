//// [tests/cases/conformance/lint/rules/await-thenable/lintTypescriptAwaitThenableRolloutPromisesEditsDeclareConstValueDisposableAwaitUsingItemValue.ts] ////

//// [input.ts]
declare const value: Disposable; await using item = value;
export {};

//// [input.ts]
declare const value: Disposable; await using item = value;
export {};
