//// [tests/cases/conformance/lint/rules/prefer-find/lintTypescriptPreferFindFinalLibraryCasesDeclareConstArrNumberArrFilterBooleanAt1nArrFilterBooleanAt1n.ts] ////

//// [input.ts]
declare const arr: number[]; arr.filter(Boolean).at(1n); arr.filter(Boolean).at(-1n);

//// [input.ts]
declare const arr: number[]; arr.filter(Boolean).at(1n); arr.filter(Boolean).at(-1n);
