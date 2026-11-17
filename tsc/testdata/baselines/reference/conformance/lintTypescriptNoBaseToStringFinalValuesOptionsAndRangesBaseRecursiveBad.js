//// [tests/cases/conformance/lint/rules/no-base-to-string/lintTypescriptNoBaseToStringFinalValuesOptionsAndRangesBaseRecursiveBad.ts] ////

//// [input.ts]
type Value = {} | Value[]; declare const value: Value; String(value);

//// [input.ts]
type Value = {} | Value[]; declare const value: Value; String(value);
