//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream98.ts] ////

//// [input.ts]
class A extends B { constructor() { class B extends C { constructor() { super(); this.d = 0; } } super(); } }

//// [input.ts]
class A extends B { constructor() { class B extends C { constructor() { super(); this.d = 0; } } super(); } }
