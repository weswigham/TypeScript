//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream25.ts] ////

//// [input.ts]
class A extends B { constructor() { switch (a) { case 0: super(); break; default: super(); } } }

//// [input.ts]
class A extends B { constructor() { switch (a) { case 0: super(); break; default: super(); } } }
