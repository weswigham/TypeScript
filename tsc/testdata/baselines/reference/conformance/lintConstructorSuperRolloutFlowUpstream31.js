//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream31.ts] ////

//// [input.ts]
class A extends B { constructor(a) { super(); for (const b of a) { this.a(); } } }

//// [input.ts]
class A extends B { constructor(a) { super(); for (const b of a) { this.a(); } } }
