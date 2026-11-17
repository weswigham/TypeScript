//// [tests/cases/conformance/lint/rules/unbound-method/lintTypescriptUnboundMethodFinalOwnershipOptionsAndEdgesDefaultDestructure.ts] ////

//// [input.ts]
class C { method() {} } function f({method}: {method: () => void} = new C()) {}

//// [input.ts]
class C { method() {} } function f({method}: {method: () => void} = new C()) {}
