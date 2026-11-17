//// [tests/cases/conformance/lint/rules/no-delete-var/lintNoDeleteVarStatementRulesDelete.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
delete value; delete (value); delete ((value));

//// [input.ts]
delete value; delete (value); delete ((value));
