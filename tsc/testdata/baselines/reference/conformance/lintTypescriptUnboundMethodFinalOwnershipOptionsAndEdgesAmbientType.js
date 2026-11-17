//// [tests/cases/conformance/lint/rules/unbound-method/lintTypescriptUnboundMethodFinalOwnershipOptionsAndEdgesAmbientType.ts] ////

//// [input.ts]
class C { method() {} } declare function f({method}: C): void;

//// [input.ts]
class C { method() {} } declare function f({method}: C): void;
