//// [tests/cases/conformance/lint/rules/prefer-find/lintTypescriptPreferFindFinalLibrarySuggestionsAndRangesDeclareConstValuesNumberConstZero0nValuesFilterBooleanA.ts] ////

//// [input.ts]
declare const values: number[]; const zero = -0n; values.filter(Boolean).at(zero);

//// [input.ts]
declare const values: number[]; const zero = -0n; values.filter(Boolean).at(zero);
