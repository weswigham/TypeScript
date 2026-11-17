//// [tests/cases/conformance/lint/rules/prefer-find/lintTypescriptPreferFindFinalLibraryCasesDeclareConstArrReadonlyNumberArrFilterBooleanAtNonsenseAsAny.ts] ////

//// [input.ts]
declare const arr: readonly number[]; arr.filter(Boolean).at('nonsense' as any);

//// [input.ts]
declare const arr: readonly number[]; arr.filter(Boolean).at('nonsense' as any);
