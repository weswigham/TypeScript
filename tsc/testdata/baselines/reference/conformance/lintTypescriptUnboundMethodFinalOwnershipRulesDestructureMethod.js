//// [tests/cases/conformance/lint/rules/unbound-method/lintTypescriptUnboundMethodFinalOwnershipRulesDestructureMethod.ts] ////

//// [input.ts]
class C { method() {} } const {method: renamed} = new C();

//// [input.ts]
class C { method() {} } const {method: renamed} = new C();
