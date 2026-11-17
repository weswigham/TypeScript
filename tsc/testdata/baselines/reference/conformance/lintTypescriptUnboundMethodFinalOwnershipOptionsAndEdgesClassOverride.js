//// [tests/cases/conformance/lint/rules/unbound-method/lintTypescriptUnboundMethodFinalOwnershipOptionsAndEdgesClassOverride.ts] ////

//// [input.ts]
class C extends Number { static parseInt = function(value: string) { return 1; } } const method = C.parseInt;

//// [input.ts]
class C extends Number { static parseInt = function(value: string) { return 1; } } const method = C.parseInt;
