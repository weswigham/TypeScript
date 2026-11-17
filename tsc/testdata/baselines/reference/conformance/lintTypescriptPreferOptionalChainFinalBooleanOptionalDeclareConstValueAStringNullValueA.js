//// [tests/cases/conformance/lint/rules/prefer-optional-chain/lintTypescriptPreferOptionalChainFinalBooleanOptionalDeclareConstValueAStringNullValueA.ts] ////

//// [input.ts]
declare const value: { a: string } | null; (value || {}).a;

//// [input.ts]
declare const value: { a: string } | null; (value || {}).a;
