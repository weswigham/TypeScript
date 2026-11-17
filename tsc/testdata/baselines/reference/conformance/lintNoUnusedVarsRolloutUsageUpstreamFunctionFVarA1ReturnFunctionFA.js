//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionFVarA1ReturnFunctionFA.ts] ////

//// [globals.d.ts]

//// [input.ts]
function f() { var a = 1; return function(){ f(++a); }; }

//// [input.ts]
function f() { var a = 1; return function(){ f(++a); }; }
