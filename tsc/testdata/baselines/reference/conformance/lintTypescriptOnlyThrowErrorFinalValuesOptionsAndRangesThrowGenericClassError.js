//// [tests/cases/conformance/lint/rules/only-throw-error/lintTypescriptOnlyThrowErrorFinalValuesOptionsAndRangesThrowGenericClassError.ts] ////

//// [input.ts]
class Custom<T> extends Error { value!: T } declare const value: Custom<number>; throw value;

//// [input.ts]
class Custom<T> extends Error { value!: T } declare const value: Custom<number>; throw value;
