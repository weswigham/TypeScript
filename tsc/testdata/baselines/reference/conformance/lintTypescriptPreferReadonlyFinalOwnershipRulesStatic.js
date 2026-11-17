//// [tests/cases/conformance/lint/rules/prefer-readonly/lintTypescriptPreferReadonlyFinalOwnershipRulesStatic.ts] ////

//// [input.ts]
class C { private static value = 1; constructor() { C.value++; } }

//// [input.ts]
class C { private static value = 1; constructor() { C.value++; } }
