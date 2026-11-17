//// [tests/cases/conformance/lint/rules/no-alert/lintNoAlertStatementRulesAlertHoisted.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
alert(); var alert;

//// [input.ts]
alert(); var alert;
