//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream102.ts] ////

//// [input.ts]
class A extends B { constructor() { var c = () => this.d(); super(); } }

//// [input.ts]
class A extends B { constructor() { var c = () => this.d(); super(); } }
