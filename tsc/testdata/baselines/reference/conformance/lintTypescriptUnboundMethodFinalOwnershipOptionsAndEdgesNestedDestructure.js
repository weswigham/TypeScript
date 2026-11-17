//// [tests/cases/conformance/lint/rules/unbound-method/lintTypescriptUnboundMethodFinalOwnershipOptionsAndEdgesNestedDestructure.ts] ////

//// [input.ts]
class C { method() {} } const { nested: {method} } = {nested: new C()};

//// [input.ts]
class C { method() {} } const { nested: {method} } = {nested: new C()};
