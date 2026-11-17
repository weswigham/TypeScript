//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionFooRestAAlertAFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo ({...rest}, a) { alert(a); } foo();

//// [input.ts]
function foo ({...rest}, a) { alert(a); } foo();
