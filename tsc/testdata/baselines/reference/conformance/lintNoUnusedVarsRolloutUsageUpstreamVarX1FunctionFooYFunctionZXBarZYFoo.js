//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarX1FunctionFooYFunctionZXBarZYFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
var x = 1; function foo(y = function(z = x) { bar(z); }) { y(); } foo();

//// [input.ts]
var x = 1; function foo(y = function(z = x) { bar(z); }) { y(); } foo();
