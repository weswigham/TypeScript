//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream129.ts] ////

//// [input.ts]
class A extends B { constructor() { super(this.c()); } }

//// [input.ts]
class A extends B { constructor() { super(this.c()); } }
