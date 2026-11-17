//// [tests/cases/conformance/lint/rules/no-new-func/lintNoNewFuncStatementRulesFunctionShadowed.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
function test(Function) { new Function(); Function(); Function.call(null); }

//// [input.ts]
function test(Function) { new Function(); Function(); Function.call(null); }
