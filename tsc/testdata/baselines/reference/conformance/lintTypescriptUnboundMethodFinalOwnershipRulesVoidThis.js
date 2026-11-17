//// [tests/cases/conformance/lint/rules/unbound-method/lintTypescriptUnboundMethodFinalOwnershipRulesVoidThis.ts] ////

//// [input.ts]
class C { method(this: void) {} } const method = new C().method;

//// [input.ts]
class C { method(this: void) {} } const method = new C().method;
