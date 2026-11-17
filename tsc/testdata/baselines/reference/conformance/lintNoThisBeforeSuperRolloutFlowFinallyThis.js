//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowFinallyThis.ts] ////

//// [input.ts]
class A extends B { constructor() { try { super(); } finally { this.x; } } }

//// [input.ts]
class A extends B { constructor() { try { super(); } finally { this.x; } } }
