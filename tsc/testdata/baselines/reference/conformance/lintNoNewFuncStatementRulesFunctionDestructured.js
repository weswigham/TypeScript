//// [tests/cases/conformance/lint/rules/no-new-func/lintNoNewFuncStatementRulesFunctionDestructured.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
function test({Function}) { Function(); }

//// [input.ts]
function test({Function}) { Function(); }
