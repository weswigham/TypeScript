//// [tests/cases/conformance/lint/rules/no-new-wrappers/lintNoNewWrappersStatementRulesWrappers.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
new String('x'); new Number(1); new Boolean(false); new (String);

//// [input.ts]
new String('x'); new Number(1); new Boolean(false); new (String);
