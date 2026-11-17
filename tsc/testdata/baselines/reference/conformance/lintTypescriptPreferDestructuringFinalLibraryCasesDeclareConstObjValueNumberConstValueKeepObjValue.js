//// [tests/cases/conformance/lint/rules/prefer-destructuring/lintTypescriptPreferDestructuringFinalLibraryCasesDeclareConstObjValueNumberConstValueKeepObjValue.ts] ////

//// [input.ts]
declare const obj: { value: number }; const value /*keep*/ = obj.value;

//// [input.ts]
declare const obj: { value: number }; const value /*keep*/ = obj.value;
