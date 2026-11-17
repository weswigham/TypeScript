//// [tests/cases/conformance/lint/rules/prefer-readonly/lintTypescriptPreferReadonlyFinalOwnershipFixesWideningCase2.ts] ////

//// [input.ts]
class C { private readonly value: number = 1; constructor() { this.value = 2; } }

//// [input.ts]
class C { private readonly value: number = 1; constructor() { this.value = 2; } }
