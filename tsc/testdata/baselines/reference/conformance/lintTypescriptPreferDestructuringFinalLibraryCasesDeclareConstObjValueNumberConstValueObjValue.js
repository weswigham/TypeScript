//// [tests/cases/conformance/lint/rules/prefer-destructuring/lintTypescriptPreferDestructuringFinalLibraryCasesDeclareConstObjValueNumberConstValueObjValue.ts] ////

//// [input.ts]
declare const obj: { value: number }; const value = obj.value;

//// [input.ts]
declare const obj: { value: number }; const {value} = obj;
