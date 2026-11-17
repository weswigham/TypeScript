//// [tests/cases/conformance/lint/rules/prefer-optional-chain/lintTypescriptPreferOptionalChainFinalBooleanOptionalDeclareConstValueAStringUndefinedValueValueA.ts] ////

//// [input.ts]
declare const value: { a: string } | undefined; value && value.a;

//// [input.ts]
declare const value: { a: string } | undefined; value?.a;
