//// [tests/cases/conformance/lint/rules/no-new-func/lintNoNewFuncStatementRulesFunctionReferences.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
use(Function); new Class(Function); foo[Function](); use(Function.bind); Function.toString(); Function[call](); new Function.call(); window.Function();

//// [input.ts]
use(Function); new Class(Function); foo[Function](); use(Function.bind); Function.toString(); Function[call](); new Function.call(); window.Function();
