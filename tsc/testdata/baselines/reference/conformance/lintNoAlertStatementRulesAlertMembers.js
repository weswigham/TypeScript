//// [tests/cases/conformance/lint/rules/no-alert/lintNoAlertStatementRulesAlertMembers.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
window.alert(); window['confirm'](); globalThis[`prompt`]();

//// [input.ts]
window.alert(); window['confirm'](); globalThis[`prompt`]();
