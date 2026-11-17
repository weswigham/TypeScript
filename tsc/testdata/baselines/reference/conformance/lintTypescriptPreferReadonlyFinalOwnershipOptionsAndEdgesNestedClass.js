//// [tests/cases/conformance/lint/rules/prefer-readonly/lintTypescriptPreferReadonlyFinalOwnershipOptionsAndEdgesNestedClass.ts] ////

//// [input.ts]
class C { private value = 1; method() { return class { private value = 1; method() { this.value++; } }; } }

//// [input.ts]
class C { private readonly value = 1; method() { return class { private value = 1; method() { this.value++; } }; } }
