//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream111.ts] ////

//// [input.ts]
class A extends B { constructor(a) { super(); for (const b of a) { this.a(); } } }

//// [input.ts]
class A extends B { constructor(a) { super(); for (const b of a) { this.a(); } } }
