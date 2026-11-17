//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarX1FunctionFooYXBarYFooCase2.ts] ////

//// [globals.d.ts]

//// [input.ts]
var x = 1; function foo(y = x) { bar(y); } foo();

//// [input.ts]
var x = 1; function foo(y = x) { bar(y); } foo();
