//// [tests/cases/conformance/lint/rules/no-alert/lintNoAlertStatementRulesAlertThis.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
this.alert(); function test() { this.alert(); } { this.alert(); } (() => this.alert())();

//// [input.ts]
this.alert(); function test() { this.alert(); } { this.alert(); } (() => this.alert())();
