//// [tests/cases/conformance/lint/rules/no-alert/lintNoAlertStatementRulesAlertOptional.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
alert?.(); window?.alert(); (window?.alert)();

//// [input.ts]
alert?.(); window?.alert(); (window?.alert)();
