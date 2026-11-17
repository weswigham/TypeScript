//// [tests/cases/conformance/lint/rules/no-alert/lintNoAlertStatementRulesAlertShadowed.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
function test(alert, confirm, prompt, window, globalThis) { alert(); confirm(); prompt(); window.alert(); globalThis.alert(); }

//// [input.ts]
function test(alert, confirm, prompt, window, globalThis) { alert(); confirm(); prompt(); window.alert(); globalThis.alert(); }
