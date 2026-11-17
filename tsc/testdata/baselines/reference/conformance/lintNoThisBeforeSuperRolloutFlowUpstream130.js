//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream130.ts] ////

//// [input.ts]
class A extends B { constructor() { super(super.c()); } }

//// [input.ts]
class A extends B { constructor() { super(super.c()); } }
