//// [tests/cases/conformance/lint/rules/prefer-readonly/lintTypescriptPreferReadonlyFinalOwnershipFixesHashCase1.ts] ////

//// [input.ts]
class C { #value = 1; }

//// [input.ts]
class C { readonly #value = 1; }
