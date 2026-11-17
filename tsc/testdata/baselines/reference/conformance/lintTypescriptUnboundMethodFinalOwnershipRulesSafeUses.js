//// [tests/cases/conformance/lint/rules/unbound-method/lintTypescriptUnboundMethodFinalOwnershipRulesSafeUses.ts] ////

//// [input.ts]
class C { method() {} } const value = new C(); value.method(); value.method.bind(value); if (value.method) {} typeof value.method; value.method && 0;

//// [input.ts]
class C { method() {} } const value = new C(); value.method(); value.method.bind(value); if (value.method) {} typeof value.method; value.method && 0;
