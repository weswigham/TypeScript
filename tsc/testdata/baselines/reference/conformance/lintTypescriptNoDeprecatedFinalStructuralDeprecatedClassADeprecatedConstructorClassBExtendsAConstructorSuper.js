//// [tests/cases/conformance/lint/rules/no-deprecated/lintTypescriptNoDeprecatedFinalStructuralDeprecatedClassADeprecatedConstructorClassBExtendsAConstructorSuper.ts] ////

//// [input.ts]
class A { /** @deprecated */ constructor() {} } class B extends A { constructor() { super(); } }

//// [input.ts]
class A { /** @deprecated */ constructor() {} } class B extends A { constructor() { super(); } }
