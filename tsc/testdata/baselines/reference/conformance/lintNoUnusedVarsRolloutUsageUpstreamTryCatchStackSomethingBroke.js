//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamTryCatchStackSomethingBroke.ts] ////

//// [globals.d.ts]

//// [input.ts]
try {} catch ({ stack: $ }) { $ = 'Something broke: ' + $; }

//// [input.ts]
try {} catch ({ stack: $ }) { $ = 'Something broke: ' + $; }
