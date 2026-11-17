//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarA0BBAA1FooBCase1.ts] ////

//// [globals.d.ts]

//// [input.ts]
var a = 0, b; b = a += a + 1; foo(b);

//// [input.ts]
var a = 0, b; b = a += a + 1; foo(b);
