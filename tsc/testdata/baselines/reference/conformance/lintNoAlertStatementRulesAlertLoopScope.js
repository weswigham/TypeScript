//// [tests/cases/conformance/lint/rules/no-alert/lintNoAlertStatementRulesAlertLoopScope.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
for (var index = 0; index < 1; index++) this.alert(); for (let index = 0; index < 1; index++) this.alert();

//// [input.ts]
for (var index = 0; index < 1; index++) this.alert(); for (let index = 0; index < 1; index++) this.alert();
