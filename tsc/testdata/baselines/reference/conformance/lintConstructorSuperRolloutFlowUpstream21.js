//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream21.ts] ////

//// [input.ts]
class A extends B { constructor() { super(); class C extends D { constructor() { super(); } } } }

//// [input.ts]
class A extends B { constructor() { super(); class C extends D { constructor() { super(); } } } }
