//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream120.ts] ////

//// [input.ts]
class C extends B { field = this.foo(); constructor() { super(); } }

//// [input.ts]
class C extends B { field = this.foo(); constructor() { super(); } }
