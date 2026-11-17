//// [tests/cases/conformance/lint/rules/prefer-readonly/lintTypescriptPreferReadonlyFinalOwnershipRulesBracketWrite.ts] ////

//// [input.ts]
class C { private value = 1; method() { this['value'] = 2; } }

//// [input.ts]
class C { private value = 1; method() { this['value'] = 2; } }
