//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream106.ts] ////

//// [input.ts]
class A extends B { constructor() { if (a) { super(); this.a(); } else { super(); this.b(); } } }

//// [input.ts]
class A extends B { constructor() { if (a) { super(); this.a(); } else { super(); this.b(); } } }
