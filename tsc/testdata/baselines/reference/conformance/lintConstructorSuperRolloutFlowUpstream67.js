//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream67.ts] ////

//// [input.ts]
class A extends B { constructor() { switch (a) { case 0: break; default: super(); } } }

//// [input.ts]
class A extends B { constructor() { switch (a) { case 0: break; default: super(); } } }
