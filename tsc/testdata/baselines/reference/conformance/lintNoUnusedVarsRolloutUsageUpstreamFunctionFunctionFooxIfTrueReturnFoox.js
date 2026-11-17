//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionFunctionFooxIfTrueReturnFoox.ts] ////

//// [globals.d.ts]

//// [input.ts]
(function() { function foox() { if (true) { return foox(); } } }())

//// [input.ts]
(function() { function foox() { if (true) { return foox(); } } }())
