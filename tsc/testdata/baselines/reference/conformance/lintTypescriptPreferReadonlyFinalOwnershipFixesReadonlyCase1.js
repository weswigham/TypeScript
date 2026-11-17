//// [tests/cases/conformance/lint/rules/prefer-readonly/lintTypescriptPreferReadonlyFinalOwnershipFixesReadonlyCase1.ts] ////

//// [input.ts]
class C { private value = 1; }

//// [input.ts]
class C { private readonly value = 1; }
