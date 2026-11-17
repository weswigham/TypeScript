//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionFooAVarBABarBFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo(a) { var b = a++; bar(b) } foo();

//// [input.ts]
function foo(a) { var b = a++; bar(b) } foo();
