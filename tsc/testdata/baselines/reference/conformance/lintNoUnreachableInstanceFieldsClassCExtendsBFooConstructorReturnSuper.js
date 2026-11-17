//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableInstanceFieldsClassCExtendsBFooConstructorReturnSuper.ts] ////

//// [input.ts]
class C extends B { foo; constructor() { return {}; super(); } }

//// [input.ts]
class C extends B { foo; constructor() { return {}; super(); } }
