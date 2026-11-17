//// [tests/cases/conformance/lint/rules/no-new-wrappers/lintNoNewWrappersStatementRulesWrapperHoisted.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
if (foo) { new Boolean(); } else { var Boolean; }

//// [input.ts]
if (foo) { new Boolean(); } else { var Boolean; }
