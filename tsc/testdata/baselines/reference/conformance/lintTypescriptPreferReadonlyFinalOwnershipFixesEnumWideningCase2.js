//// [tests/cases/conformance/lint/rules/prefer-readonly/lintTypescriptPreferReadonlyFinalOwnershipFixesEnumWideningCase2.ts] ////

//// [input.ts]
enum E { A, B } class C { private readonly value: E = E.A; constructor() { this.value = E.B; } }

//// [input.ts]
enum E { A, B } class C { private readonly value: E = E.A; constructor() { this.value = E.B; } }
