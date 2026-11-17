//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream107.ts] ////

//// [input.ts]
class A extends B { constructor() { if (a) super(); else super(); this.a(); } }

//// [input.ts]
class A extends B { constructor() { if (a) super(); else super(); this.a(); } }
