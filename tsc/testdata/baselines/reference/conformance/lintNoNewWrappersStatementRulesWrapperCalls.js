//// [tests/cases/conformance/lint/rules/no-new-wrappers/lintNoNewWrappersStatementRulesWrapperCalls.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
String('x'); Number(1); Boolean(false); new Object(); new window.String();

//// [input.ts]
String('x'); Number(1); Boolean(false); new Object(); new window.String();
