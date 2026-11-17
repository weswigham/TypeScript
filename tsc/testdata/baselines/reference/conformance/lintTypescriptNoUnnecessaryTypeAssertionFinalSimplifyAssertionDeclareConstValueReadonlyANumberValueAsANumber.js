//// [tests/cases/conformance/lint/rules/no-unnecessary-type-assertion/lintTypescriptNoUnnecessaryTypeAssertionFinalSimplifyAssertionDeclareConstValueReadonlyANumberValueAsANumber.ts] ////

//// [input.ts]
declare const value: { readonly a: number }; value as { a: number };

//// [input.ts]
declare const value: { readonly a: number }; value as { a: number };
