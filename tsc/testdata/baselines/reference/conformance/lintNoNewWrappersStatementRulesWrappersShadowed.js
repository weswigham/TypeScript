//// [tests/cases/conformance/lint/rules/no-new-wrappers/lintNoNewWrappersStatementRulesWrappersShadowed.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
function test(String, Number, Boolean) { new String(); new Number(); new Boolean(); }

//// [input.ts]
function test(String, Number, Boolean) { new String(); new Number(); new Boolean(); }
