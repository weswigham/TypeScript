//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream11.ts] ////

//// [input.ts]
class A extends (B ||= 5) { constructor() { super(); } }

//// [input.ts]
class A extends (B ||= 5) { constructor() { super(); } }
