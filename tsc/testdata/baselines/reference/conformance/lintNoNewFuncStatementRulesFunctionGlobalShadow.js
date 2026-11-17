//// [tests/cases/conformance/lint/rules/no-new-func/lintNoNewFuncStatementRulesFunctionGlobalShadow.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
Function(); function Function() {}

//// [input.ts]
Function(); function Function() {}
