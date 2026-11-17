//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionFooAVarBAA1BarBFooCase1.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo(a) { var b = a += a + 1; bar(b) } foo();

//// [input.ts]
function foo(a) { var b = a += a + 1; bar(b) } foo();
