//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream132.ts] ////

//// [input.ts]
class A extends B { constructor() { class C extends D { constructor() { this.e(); super(); } } super(); this.f(); } }

//// [input.ts]
class A extends B { constructor() { class C extends D { constructor() { this.e(); super(); } } super(); this.f(); } }
