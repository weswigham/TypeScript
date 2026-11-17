//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream93.ts] ////

//// [input.ts]
class A extends B { constructor() { if (true) { super(); } else { super(); } this.c(); } }

//// [input.ts]
class A extends B { constructor() { if (true) { super(); } else { super(); } this.c(); } }
