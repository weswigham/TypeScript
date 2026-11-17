//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowThisArgument.ts] ////

//// [input.ts]
class A extends B { constructor() { super(this.x); } }

//// [input.ts]
class A extends B { constructor() { super(this.x); } }
