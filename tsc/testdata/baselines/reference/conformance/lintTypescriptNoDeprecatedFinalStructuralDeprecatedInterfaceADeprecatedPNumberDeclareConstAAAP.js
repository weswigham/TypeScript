//// [tests/cases/conformance/lint/rules/no-deprecated/lintTypescriptNoDeprecatedFinalStructuralDeprecatedInterfaceADeprecatedPNumberDeclareConstAAAP.ts] ////

//// [input.ts]
interface A { /** @deprecated */ p: number } declare const a: A; a['p'];

//// [input.ts]
interface A { /** @deprecated */ p: number } declare const a: A; a['p'];
