//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream22.ts] ////

//// [input.ts]
class A extends B { constructor() { super(); class C { constructor() { } } } }

//// [input.ts]
class A extends B { constructor() { super(); class C { constructor() { } } } }
