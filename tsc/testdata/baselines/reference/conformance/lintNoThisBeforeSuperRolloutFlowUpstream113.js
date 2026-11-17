//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream113.ts] ////

//// [input.ts]
class A extends B { constructor(a) { super(); this.a = a && function(){} && this.foo; } }

//// [input.ts]
class A extends B { constructor(a) { super(); this.a = a && function(){} && this.foo; } }
