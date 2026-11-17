//// [tests/cases/conformance/lint/rules/no-alert/lintNoAlertStatementRulesAlertOtherObject.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
foo.alert(); window[alert](); window['al' + 'ert']();

//// [input.ts]
foo.alert(); window[alert](); window['al' + 'ert']();
