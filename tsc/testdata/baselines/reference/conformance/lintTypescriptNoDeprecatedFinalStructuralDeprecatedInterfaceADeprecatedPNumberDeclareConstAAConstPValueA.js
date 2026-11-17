//// [tests/cases/conformance/lint/rules/no-deprecated/lintTypescriptNoDeprecatedFinalStructuralDeprecatedInterfaceADeprecatedPNumberDeclareConstAAConstPValueA.ts] ////

//// [input.ts]
interface A { /** @deprecated */ p: number } declare const a: A; const {p: value} = a;

//// [input.ts]
interface A { /** @deprecated */ p: number } declare const a: A; const {p: value} = a;
