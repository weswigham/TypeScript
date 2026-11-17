//// [tests/cases/conformance/lint/rules/prefer-readonly/lintTypescriptPreferReadonlyFinalOwnershipRulesCapture.ts] ////

//// [input.ts]
class C { private value = 1; constructor() { const self = this; (() => self.value++)(); } }

//// [input.ts]
class C { private value = 1; constructor() { const self = this; (() => self.value++)(); } }
