//// [tests/cases/conformance/lint/rules/unbound-method/lintTypescriptUnboundMethodFinalOwnershipRulesComputedMember.ts] ////

//// [input.ts]
class C { method() {} } declare const key: 'method'; new C()[key];

//// [input.ts]
class C { method() {} } declare const key: 'method'; new C()[key];
