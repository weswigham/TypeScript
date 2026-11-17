//// [tests/cases/conformance/lint/rules/no-new-wrappers/lintNoNewWrappersStatementRulesWrapperBlock.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
new String(); { const String = Custom; new String(); }

//// [input.ts]
new String(); { const String = Custom; new String(); }
