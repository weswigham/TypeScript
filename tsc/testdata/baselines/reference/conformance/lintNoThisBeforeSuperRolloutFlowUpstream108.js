//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream108.ts] ////

//// [input.ts]
class A extends B { constructor() { try { super(); } finally {} this.a(); } }

//// [input.ts]
class A extends B { constructor() { try { super(); } finally {} this.a(); } }
