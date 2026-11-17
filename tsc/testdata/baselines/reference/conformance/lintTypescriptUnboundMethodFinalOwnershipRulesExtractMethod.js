//// [tests/cases/conformance/lint/rules/unbound-method/lintTypescriptUnboundMethodFinalOwnershipRulesExtractMethod.ts] ////

//// [input.ts]
class C { method() {} } const method = new C().method;

//// [input.ts]
class C { method() {} } const method = new C().method;
