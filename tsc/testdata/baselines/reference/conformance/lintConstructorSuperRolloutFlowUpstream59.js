//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream59.ts] ////

//// [input.ts]
class A extends B { constructor() { class C extends D { constructor() { super(); } } } }

//// [input.ts]
class A extends B { constructor() { class C extends D { constructor() { super(); } } } }
