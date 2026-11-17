//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstX1FunctionFooYFunctionZXBarZYFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
const x = 1; function foo(y = function(z = x) { bar(z); }) { y(); } foo();

//// [input.ts]
const x = 1; function foo(y = function(z = x) { bar(z); }) { y(); } foo();
