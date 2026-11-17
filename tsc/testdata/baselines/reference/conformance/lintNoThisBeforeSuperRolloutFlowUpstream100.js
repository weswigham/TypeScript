//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream100.ts] ////

//// [input.ts]
class A extends B { constructor() { function c() { this.d(); } super(); } }

//// [input.ts]
class A extends B { constructor() { function c() { this.d(); } super(); } }
