//// [tests/cases/conformance/lint/rules/prefer-optional-chain/lintTypescriptPreferOptionalChainFinalBooleanOptionalDeclareConstValueAStringNullValueValueACase1.ts] ////

//// [input.ts]
declare const value: { a: string } | null; !value || !value.a;

//// [input.ts]
declare const value: { a: string } | null; !value?.a;
