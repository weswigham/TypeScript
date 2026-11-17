//// [tests/cases/conformance/lint/rules/unbound-method/lintTypescriptUnboundMethodFinalOwnershipRulesUnionMember.ts] ////

//// [input.ts]
class C { method() {} } declare const value: C | {method: number}; value.method;

//// [input.ts]
class C { method() {} } declare const value: C | {method: number}; value.method;
