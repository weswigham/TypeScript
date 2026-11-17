//// [tests/cases/conformance/lint/rules/no-constructor-return/lintNoConstructorReturnCoreScopeAConstructorReturnClassCConstructorValueIfValueReturnValueReturn.ts] ////

//// [input.ts]
class C { constructor(value) { if (value) { return value; } return; } }

//// [input.ts]
class C { constructor(value) { if (value) { return value; } return; } }
