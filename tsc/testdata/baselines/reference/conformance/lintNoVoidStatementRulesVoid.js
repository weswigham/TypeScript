//// [tests/cases/conformance/lint/rules/no-void/lintNoVoidStatementRulesVoid.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
void 0; const value = void(0); (void work());

//// [input.ts]
void 0; const value = void(0); (void work());
