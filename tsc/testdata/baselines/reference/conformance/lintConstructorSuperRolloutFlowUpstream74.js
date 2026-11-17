//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream74.ts] ////

//// [input.ts]
class A extends B { constructor() { switch (a) { case 0: super(); default: super(); } } }

//// [input.ts]
class A extends B { constructor() { switch (a) { case 0: super(); default: super(); } } }
