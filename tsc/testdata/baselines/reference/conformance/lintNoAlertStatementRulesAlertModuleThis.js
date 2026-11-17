//// [tests/cases/conformance/lint/rules/no-alert/lintNoAlertStatementRulesAlertModuleThis.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
export {}; this.alert(); window.alert();

//// [input.ts]
export {}; this.alert(); window.alert();
