//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarA0BBAFooB.ts] ////

//// [globals.d.ts]

//// [input.ts]
var a = 0, b; b = a++; foo(b);

//// [input.ts]
var a = 0, b; b = a++; foo(b);
