//// [tests/cases/conformance/lint/rules/prefer-find/lintTypescriptPreferFindFinalLibrarySuggestionsAndRangesDeclareConstValuesNumberTrueValuesFilterBooleanValuesFi.ts] ////

//// [input.ts]
declare const values: number[]; (true ? values.filter(Boolean) : values.filter(Boolean))[0];

//// [input.ts]
declare const values: number[]; (true ? values.filter(Boolean) : values.filter(Boolean))[0];
