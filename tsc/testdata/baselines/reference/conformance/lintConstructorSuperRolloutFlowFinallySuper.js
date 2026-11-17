//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowFinallySuper.ts] ////

//// [input.ts]
class A extends B { constructor() { try { return; } finally { super(); } } }

//// [input.ts]
class A extends B { constructor() { try { return; } finally { super(); } } }
