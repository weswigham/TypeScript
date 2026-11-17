//// [tests/cases/conformance/lint/rules/no-this-before-super/lintNoThisBeforeSuperRolloutFlowUpstream135.ts] ////

//// [input.ts]
class A extends B { constructor() { try { super(); } catch (err) { } this.a; } }

//// [input.ts]
class A extends B { constructor() { try { super(); } catch (err) { } this.a; } }
