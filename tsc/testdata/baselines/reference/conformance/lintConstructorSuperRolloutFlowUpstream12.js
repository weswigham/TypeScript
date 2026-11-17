//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream12.ts] ////

//// [input.ts]
class A extends (B ??= 5) { constructor() { super(); } }

//// [input.ts]
class A extends (B ??= 5) { constructor() { super(); } }
