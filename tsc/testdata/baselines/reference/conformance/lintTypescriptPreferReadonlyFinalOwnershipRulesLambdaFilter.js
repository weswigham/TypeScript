//// [tests/cases/conformance/lint/rules/prefer-readonly/lintTypescriptPreferReadonlyFinalOwnershipRulesLambdaFilter.ts] ////

//// [input.ts]
class C { private value = 1; private callback = () => 1; private delayed: number; }

//// [input.ts]
class C { private value = 1; private readonly callback = () => 1; private readonly delayed: number; }
