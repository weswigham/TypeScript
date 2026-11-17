//// [tests/cases/conformance/lint/rules/no-alert/lintNoAlertStatementRulesAlertGlobalMemberShadow.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
function test(alert) { window.alert(); }

//// [input.ts]
function test(alert) { window.alert(); }
