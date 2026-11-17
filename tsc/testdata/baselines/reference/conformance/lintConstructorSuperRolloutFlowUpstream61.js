//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream61.ts] ////

//// [input.ts]
class A extends B { constructor() { super(); class C extends D { constructor() { } } } }

//// [input.ts]
class A extends B { constructor() { super(); class C extends D { constructor() { } } } }
