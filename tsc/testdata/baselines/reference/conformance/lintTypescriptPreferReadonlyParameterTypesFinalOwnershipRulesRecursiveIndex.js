//// [tests/cases/conformance/lint/rules/prefer-readonly-parameter-types/lintTypescriptPreferReadonlyParameterTypesFinalOwnershipRulesRecursiveIndex.ts] ////

//// [input.ts]
interface R { readonly [key: string]: R } function f(value: R) {}

//// [input.ts]
interface R { readonly [key: string]: R } function f(value: R) {}
