//// [tests/cases/conformance/lint/rules/no-alert/lintNoAlertStatementRulesAlertComputedMethodKey.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
const object = { [this.alert()]() { this.alert(); }, get [this.confirm()]() { return this.prompt(); } };

//// [input.ts]
const object = { [this.alert()]() { this.alert(); }, get [this.confirm()]() { return this.prompt(); } };
