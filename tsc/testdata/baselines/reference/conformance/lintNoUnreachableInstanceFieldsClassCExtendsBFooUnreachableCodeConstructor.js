//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableInstanceFieldsClassCExtendsBFooUnreachableCodeConstructor.ts] ////

//// [input.ts]
class C extends B { foo = unreachable + code; constructor() {} }

//// [input.ts]
class C extends B { foo = unreachable + code; constructor() {} }
