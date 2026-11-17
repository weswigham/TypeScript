//// [tests/cases/conformance/lint/rules/prefer-optional-chain/lintTypescriptPreferOptionalChainFinalBooleanOptionalDeclareConstValueFalseAStringValueValueA.ts] ////

//// [input.ts]
declare const value: false | { a: string }; value && value.a;

//// [input.ts]
declare const value: false | { a: string }; value && value.a;
