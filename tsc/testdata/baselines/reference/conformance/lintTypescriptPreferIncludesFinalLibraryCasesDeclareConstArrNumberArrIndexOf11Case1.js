//// [tests/cases/conformance/lint/rules/prefer-includes/lintTypescriptPreferIncludesFinalLibraryCasesDeclareConstArrNumberArrIndexOf11Case1.ts] ////

//// [input.ts]
declare const arr: number[]; arr.indexOf(1) !== -1;

//// [input.ts]
declare const arr: number[]; arr.includes(1);
