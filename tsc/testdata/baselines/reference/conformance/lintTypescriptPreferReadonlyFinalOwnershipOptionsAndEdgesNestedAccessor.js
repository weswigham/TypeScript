//// [tests/cases/conformance/lint/rules/prefer-readonly/lintTypescriptPreferReadonlyFinalOwnershipOptionsAndEdgesNestedAccessor.ts] ////

//// [input.ts]
class C { private value = 1; constructor() { const self = this; const object = { get value() { return self.value++; } }; } }

//// [input.ts]
class C { private value = 1; constructor() { const self = this; const object = { get value() { return self.value++; } }; } }
