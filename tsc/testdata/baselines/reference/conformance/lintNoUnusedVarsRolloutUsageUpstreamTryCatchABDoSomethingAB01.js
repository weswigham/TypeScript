//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamTryCatchABDoSomethingAB01.ts] ////

//// [globals.d.ts]

//// [input.ts]
try {} catch ([_a, _b]) { doSomething(_a, _b); }

//// [input.ts]
try {} catch ([_a, _b]) { doSomething(_a, _b); }
