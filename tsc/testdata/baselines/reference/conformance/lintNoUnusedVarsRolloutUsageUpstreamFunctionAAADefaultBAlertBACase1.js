//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionAAADefaultBAlertBACase1.ts] ////

//// [globals.d.ts]

//// [input.ts]
function a([[a = aDefault, b]]) { alert(b); } a();

//// [input.ts]
function a([[a = aDefault, b]]) { alert(b); } a();
