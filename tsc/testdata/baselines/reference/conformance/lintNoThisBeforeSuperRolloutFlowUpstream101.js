//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream101.ts] ////

//// [input.ts]
class A extends B { constructor() { var c = function c() { this.d(); }; super(); } }

//// [input.ts]
class A extends B { constructor() { var c = function c() { this.d(); }; super(); } }
