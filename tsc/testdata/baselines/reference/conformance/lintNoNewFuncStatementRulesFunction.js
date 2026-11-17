//// [tests/cases/conformance/lint/rules/no-new-func/lintNoNewFuncStatementRulesFunction.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
new Function(); Function(); (Function)(); Function?.();

//// [input.ts]
new Function(); Function(); (Function)(); Function?.();
