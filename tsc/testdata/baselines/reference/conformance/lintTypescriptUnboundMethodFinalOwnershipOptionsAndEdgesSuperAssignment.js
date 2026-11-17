//// [tests/cases/conformance/lint/rules/unbound-method/lintTypescriptUnboundMethodFinalOwnershipOptionsAndEdgesSuperAssignment.ts] ////

//// [input.ts]
class C { method() {} } class D extends C { other: unknown; constructor() { super(); this.other = super.method; } }

//// [input.ts]
class C { method() {} } class D extends C { other: unknown; constructor() { super(); this.other = super.method; } }
