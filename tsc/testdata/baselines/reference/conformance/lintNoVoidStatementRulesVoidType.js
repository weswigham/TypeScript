//// [tests/cases/conformance/lint/rules/no-void/lintNoVoidStatementRulesVoidType.ts] ////

//// [custom.ts]
export default class Custom {}
//// [input.ts]
type Callback = () => void; function test(): void {} object.void();

//// [input.ts]
type Callback = () => void; function test(): void {} object.void();
