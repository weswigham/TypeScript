//// [tests/cases/conformance/lint/rules/unbound-method/lintTypescriptUnboundMethodFinalOwnershipRulesExplicitThis.ts] ////

//// [input.ts]
class C { method(this: C) {} } const method = new C().method;

//// [input.ts]
class C { method(this: C) {} } const method = new C().method;
