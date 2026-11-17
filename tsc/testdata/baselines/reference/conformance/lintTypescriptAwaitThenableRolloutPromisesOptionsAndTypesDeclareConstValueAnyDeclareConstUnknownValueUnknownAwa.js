//// [tests/cases/conformance/lint/rules/await-thenable/lintTypescriptAwaitThenableRolloutPromisesOptionsAndTypesDeclareConstValueAnyDeclareConstUnknownValueUnknownAwa.ts] ////

//// [input.ts]
declare const value: any; declare const unknownValue: unknown; await value; await unknownValue;
export {};

//// [input.ts]
declare const value: any; declare const unknownValue: unknown; await value; await unknownValue;
export {};
