//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableInstanceFieldsClassBExtendsAXConstructorClassCExtendsDSuperXConstructor.ts] ////

//// [input.ts]
class B extends A { x; constructor() { class C extends D { [super().x]; constructor() {} } } }

//// [input.ts]
class B extends A { x; constructor() { class C extends D { [super().x]; constructor() {} } } }
