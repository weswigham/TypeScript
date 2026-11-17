//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionFVarA1ReturnFunctionFA2Case2.ts] ////

//// [globals.d.ts]

//// [input.ts]
function f() { var a = 1; return function(){ f(a = 2); }; }

//// [input.ts]
function f() { var a = 1; return function(){ f(a = 2); }; }
