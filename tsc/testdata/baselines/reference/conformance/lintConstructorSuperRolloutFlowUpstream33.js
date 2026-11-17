//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream33.ts] ////

//// [input.ts]
class Foo extends Object { constructor(method) { super(); this.method = method || function() {}; } }

//// [input.ts]
class Foo extends Object { constructor(method) { super(); this.method = method || function() {}; } }
