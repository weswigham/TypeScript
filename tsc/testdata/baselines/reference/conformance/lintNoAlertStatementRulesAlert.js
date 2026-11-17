//// [tests/cases/conformance/lint/rules/no-alert/lintNoAlertStatementRulesAlert.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
alert(); confirm(); prompt();

//// [input.ts]
alert(); confirm(); prompt();
