//// [tests/cases/conformance/lint/rules/unbound-method/lintTypescriptUnboundMethodFinalOwnershipOptionsAndEdgesGlobalShadow.ts] ////

//// [input.ts]
class Collator { compare() {} } const method = new Collator().compare;

//// [input.ts]
class Collator { compare() {} } const method = new Collator().compare;
