//// [tests/cases/conformance/lint/rules/no-new-func/lintNoNewFuncStatementRulesFunctionNamedExpression.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
const fn = function Function() { Function(); };

//// [input.ts]
const fn = function Function() { Function(); };
