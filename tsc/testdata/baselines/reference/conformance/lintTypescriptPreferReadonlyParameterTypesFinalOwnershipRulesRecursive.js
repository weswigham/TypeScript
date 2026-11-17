//// [tests/cases/conformance/lint/rules/prefer-readonly-parameter-types/lintTypescriptPreferReadonlyParameterTypesFinalOwnershipRulesRecursive.ts] ////

//// [input.ts]
interface R { readonly next: R } function f(value: R) {}

//// [input.ts]
interface R { readonly next: R } function f(value: R) {}
