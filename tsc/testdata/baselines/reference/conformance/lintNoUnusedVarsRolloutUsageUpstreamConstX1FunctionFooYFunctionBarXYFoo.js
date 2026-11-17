//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstX1FunctionFooYFunctionBarXYFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
const x = 1; function foo(y = function() { bar(x); }) { y(); } foo();

//// [input.ts]
const x = 1; function foo(y = function() { bar(x); }) { y(); } foo();
