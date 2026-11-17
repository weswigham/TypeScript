//// [tests/cases/conformance/lint/rules/no-restricted-properties/lintNoRestrictedPropertiesCoreCConstBarBazBarNestedFooBarFooFunctionFBarFoo.ts] ////

//// [input.ts]
const {bar, baz: {bar: nested}} = foo; ({bar} = foo); function f({bar} = foo) {}

//// [input.ts]
const {bar, baz: {bar: nested}} = foo; ({bar} = foo); function f({bar} = foo) {}
