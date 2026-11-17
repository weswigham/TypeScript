//// [tests/cases/conformance/lint/rules/prefer-destructuring/lintTypescriptPreferDestructuringFinalLibraryCasesDeclareConstObjValueNumberUndefinedConstValueObjValue.ts] ////

//// [input.ts]
declare const obj: { value: number } | undefined; const value = obj?.value;

//// [input.ts]
declare const obj: { value: number } | undefined; const value = obj?.value;
