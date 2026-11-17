//// [tests/cases/conformance/lint/rules/unbound-method/lintTypescriptUnboundMethodFinalOwnershipRulesTypeDestructure.ts] ////

//// [input.ts]
class C { method() {} } type F = ({method}: C) => void;

//// [input.ts]
class C { method() {} } type F = ({method}: C) => void;
