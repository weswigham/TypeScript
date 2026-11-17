//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream60.ts] ////

//// [input.ts]
class A extends B { constructor() { var C = class extends D { constructor() { super(); } } } }

//// [input.ts]
class A extends B { constructor() { var C = class extends D { constructor() { super(); } } } }
