//// [tests/cases/conformance/lint/rules/no-alert/lintNoAlertStatementRulesAlertEscaped.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
window['al\u0065rt']();

//// [input.ts]
window['al\u0065rt']();
