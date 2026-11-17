//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableInstanceFieldsClassBExtendsAXConstructorClassCExtendsSuperXYConstructor.ts] ////

//// [input.ts]
class B extends A { x; constructor() { class C extends super().x { y; constructor() {} } } }

//// [input.ts]
class B extends A { x; constructor() { class C extends super().x { y; constructor() {} } } }
