//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream95.ts] ////

//// [input.ts]
class A extends B { constructor() { foo += super().a; this.c(); } }

//// [input.ts]
class A extends B { constructor() { foo += super().a; this.c(); } }
