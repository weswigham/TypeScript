//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamTryCatchABDoSomethingAB.ts] ////

//// [globals.d.ts]

//// [input.ts]
try {} catch ([_a, _b]) { doSomething(_a, _b); }

//// [input.ts]
try {} catch ([_a, _b]) { doSomething(_a, _b); }
