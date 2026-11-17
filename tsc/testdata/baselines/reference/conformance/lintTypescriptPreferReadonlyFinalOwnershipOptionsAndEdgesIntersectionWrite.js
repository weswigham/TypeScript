//// [tests/cases/conformance/lint/rules/prefer-readonly/lintTypescriptPreferReadonlyFinalOwnershipOptionsAndEdgesIntersectionWrite.ts] ////

//// [input.ts]
class C { private value = 1; method() { const self = {} as this & {other: string}; self.value = 2; } }

//// [input.ts]
class C { private value = 1; method() { const self = {} as this & {other: string}; self.value = 2; } }
