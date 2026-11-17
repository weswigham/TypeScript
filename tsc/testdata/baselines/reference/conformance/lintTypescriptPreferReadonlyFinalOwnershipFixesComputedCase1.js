//// [tests/cases/conformance/lint/rules/prefer-readonly/lintTypescriptPreferReadonlyFinalOwnershipFixesComputedCase1.ts] ////

//// [input.ts]
class C { private [Symbol.iterator] = 1; }

//// [input.ts]
class C { private readonly [Symbol.iterator] = 1; }
