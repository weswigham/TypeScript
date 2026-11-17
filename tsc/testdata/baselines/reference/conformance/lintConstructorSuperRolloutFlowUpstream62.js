//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream62.ts] ////

//// [input.ts]
class A extends B { constructor() { super(); var C = class extends D { constructor() { } } } }

//// [input.ts]
class A extends B { constructor() { super(); var C = class extends D { constructor() { } } } }
