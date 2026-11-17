//// [tests/cases/conformance/lint/rules/prefer-readonly/lintTypescriptPreferReadonlyFinalOwnershipFixesComputedCase2.ts] ////

//// [input.ts]
class C { private readonly [Symbol.iterator] = 1; }

//// [input.ts]
class C { private readonly [Symbol.iterator] = 1; }
