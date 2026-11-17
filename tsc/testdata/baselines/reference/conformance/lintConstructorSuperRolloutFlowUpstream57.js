//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream57.ts] ////

//// [input.ts]
class A extends B { constructor() { var c = class extends D { constructor() { super(); } } } }

//// [input.ts]
class A extends B { constructor() { var c = class extends D { constructor() { super(); } } } }
