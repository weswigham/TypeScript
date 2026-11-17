//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarC0FunctionFAVarBAReturnBFC.ts] ////

//// [globals.d.ts]

//// [input.ts]
var c = 0; function f(a){ var b = a; return b; }; f(c);

//// [input.ts]
var c = 0; function f(a){ var b = a; return b; }; f(c);
