//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream131.ts] ////

//// [input.ts]
class A extends B { constructor() { class C extends D { constructor() { super(); this.e(); } } this.f(); super(); } }

//// [input.ts]
class A extends B { constructor() { class C extends D { constructor() { super(); this.e(); } } this.f(); super(); } }
