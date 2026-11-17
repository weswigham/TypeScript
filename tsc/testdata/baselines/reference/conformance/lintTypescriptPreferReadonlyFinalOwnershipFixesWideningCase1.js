//// [tests/cases/conformance/lint/rules/prefer-readonly/lintTypescriptPreferReadonlyFinalOwnershipFixesWideningCase1.ts] ////

//// [input.ts]
class C { private value = 1; constructor() { this.value = 2; } }

//// [input.ts]
class C { private readonly value: number = 1; constructor() { this.value = 2; } }
