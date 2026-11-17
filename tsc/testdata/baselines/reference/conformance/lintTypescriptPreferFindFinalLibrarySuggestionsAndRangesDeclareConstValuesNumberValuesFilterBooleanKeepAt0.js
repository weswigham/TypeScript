//// [tests/cases/conformance/lint/rules/prefer-find/lintTypescriptPreferFindFinalLibrarySuggestionsAndRangesDeclareConstValuesNumberValuesFilterBooleanKeepAt0.ts] ////

//// [input.ts]
declare const values: number[]; values['filter'](Boolean) /*keep*/ .at(0);

//// [input.ts]
declare const values: number[]; values['filter'](Boolean) /*keep*/ .at(0);
