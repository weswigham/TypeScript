//// [tests/cases/conformance/lint/rules/no-deprecated/lintTypescriptNoDeprecatedFinalStructuralDeprecatedInterfaceADeprecatedOldPVoidDeclareConstAAAP.ts] ////

//// [input.ts]
interface A { /** @deprecated Old. */ p: () => void } declare const a: A; a.p();

//// [input.ts]
interface A { /** @deprecated Old. */ p: () => void } declare const a: A; a.p();
