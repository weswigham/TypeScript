//// [tests/cases/conformance/lint/rules/unbound-method/lintTypescriptUnboundMethodFinalOwnershipOptionsAndEdgesAssignmentDestructure.ts] ////

//// [input.ts]
class C { method() {} } let method; ({method} = new C());

//// [input.ts]
class C { method() {} } let method; ({method} = new C());
