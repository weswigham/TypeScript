//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamTryCatchFooBarConsoleLogBar.ts] ////

//// [globals.d.ts]

//// [input.ts]
try {} catch ({ foo, ...bar }) { console.log(bar); }

//// [input.ts]
try {} catch ({ foo, ...bar }) { console.log(bar); }
