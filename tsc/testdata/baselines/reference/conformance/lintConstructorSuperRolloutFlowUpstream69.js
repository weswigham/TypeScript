//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream69.ts] ////

//// [input.ts]
class A extends B { constructor() { try { a; } catch (err) { super(); } } }

//// [input.ts]
class A extends B { constructor() { try { a; } catch (err) { super(); } } }
