//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionFooFunctionFooXReturnXReturnFunctionReturnFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {function foo(x) {
return x; }; return function() {return foo; }; }

//// [input.ts]
function foo() {function foo(x) {
return x; }; return function() {return foo; }; }
