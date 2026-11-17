//// [tests/cases/conformance/lint/rules/unbound-method/lintTypescriptUnboundMethodFinalOwnershipOptionsAndEdgesOptionalMethod.ts] ////

//// [input.ts]
class C { method() {} } declare const value: C | null; value?.method;

//// [input.ts]
class C { method() {} } declare const value: C | null; value?.method;
