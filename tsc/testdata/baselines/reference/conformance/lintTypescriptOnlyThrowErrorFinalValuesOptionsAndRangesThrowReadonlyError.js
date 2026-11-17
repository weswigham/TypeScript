//// [tests/cases/conformance/lint/rules/only-throw-error/lintTypescriptOnlyThrowErrorFinalValuesOptionsAndRangesThrowReadonlyError.ts] ////

//// [input.ts]
declare const value: Readonly<Error>; throw value;

//// [input.ts]
declare const value: Readonly<Error>; throw value;
