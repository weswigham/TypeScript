//// [tests/cases/conformance/lint/rules/no-delete-var/lintNoDeleteVarStatementRulesDeleteValid.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
delete value.prop; delete value['prop']; delete value?.prop; delete (0, value);

//// [input.ts]
delete value.prop; delete value['prop']; delete value?.prop; delete (0, value);
