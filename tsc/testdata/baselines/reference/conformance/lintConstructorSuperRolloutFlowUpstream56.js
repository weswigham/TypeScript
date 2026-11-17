//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream56.ts] ////

//// [input.ts]
class A extends B { constructor() { for (var i = 1; i < 10; i++) super.foo(); } }

//// [input.ts]
class A extends B { constructor() { for (var i = 1; i < 10; i++) super.foo(); } }
