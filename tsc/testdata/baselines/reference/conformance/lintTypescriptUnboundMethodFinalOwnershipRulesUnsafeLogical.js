//// [tests/cases/conformance/lint/rules/unbound-method/lintTypescriptUnboundMethodFinalOwnershipRulesUnsafeLogical.ts] ////

//// [input.ts]
class C { method() {} } const value = new C(); value.method || 0;

//// [input.ts]
class C { method() {} } const value = new C(); value.method || 0;
