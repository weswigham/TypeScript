//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarX1FunctionFooYFunctionBarXYFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
var x = 1; function foo(y = function() { bar(x); }) { y(); } foo();

//// [input.ts]
var x = 1; function foo(y = function() { bar(x); }) { y(); } foo();
