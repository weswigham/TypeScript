//// [tests/cases/conformance/lint/rules/unbound-method/lintTypescriptUnboundMethodFinalOwnershipRulesParameterDestructure.ts] ////

//// [input.ts]
class C { method() {} } function f({method}: C) {}

//// [input.ts]
class C { method() {} } function f({method}: C) {}
