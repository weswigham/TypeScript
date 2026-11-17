//// [tests/cases/conformance/lint/rules/no-new-wrappers/lintNoNewWrappersStatementRulesWrapperImport.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
import String from './custom'; new String();

//// [custom.ts]
export default class Custom {}
//// [input.ts]
import String from './custom'; new String();
