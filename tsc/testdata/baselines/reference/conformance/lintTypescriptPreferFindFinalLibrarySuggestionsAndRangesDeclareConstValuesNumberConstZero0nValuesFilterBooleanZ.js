//// [tests/cases/conformance/lint/rules/prefer-find/lintTypescriptPreferFindFinalLibrarySuggestionsAndRangesDeclareConstValuesNumberConstZero0nValuesFilterBooleanZ.ts] ////

//// [input.ts]
declare const values: number[]; const zero = -0n; values.filter(Boolean)[zero];

//// [input.ts]
declare const values: number[]; const zero = -0n; values.filter(Boolean)[zero];
