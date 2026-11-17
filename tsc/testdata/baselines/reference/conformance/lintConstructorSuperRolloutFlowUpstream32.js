//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream32.ts] ////

//// [input.ts]
class A extends B { constructor(a) { super(); for (b in a) ( foo(b) ); } }

//// [input.ts]
class A extends B { constructor(a) { super(); for (b in a) ( foo(b) ); } }
