//// [tests/cases/conformance/lint/rules/no-unreachable/lintNoUnreachableInstanceFieldsClassCExtendsBFooConstructorIfReadySuper.ts] ////

//// [input.ts]
class C extends B { foo; constructor() { if (ready) super(); } }

//// [input.ts]
class C extends B { foo; constructor() { if (ready) super(); } }
