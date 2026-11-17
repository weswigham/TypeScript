//// [tests/cases/conformance/lint/rules/no-new-func/lintNoNewFuncStatementRulesFunctionMethods.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
Function.call(null); Function['apply'](null, []); Function[`bind`](null)(); (Function?.call)(null);

//// [input.ts]
Function.call(null); Function['apply'](null, []); Function[`bind`](null)(); (Function?.call)(null);
