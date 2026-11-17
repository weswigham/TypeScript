//// [tests/cases/conformance/lint/rules/no-base-to-string/lintTypescriptNoBaseToStringFinalValuesOptionsAndRangesBaseRecursive.ts] ////

//// [input.ts]
type Value = string | Value[]; declare const value: Value; String(value);

//// [input.ts]
type Value = string | Value[]; declare const value: Value; String(value);
