//// [tests/cases/conformance/lint/rules/no-deprecated/lintTypescriptNoDeprecatedFinalStructuralDeprecatedClassADeprecatedP1ValueThisP.ts] ////

//// [input.ts]
class A { /** @deprecated */ #p = 1; value = this.#p; }

//// [input.ts]
class A { /** @deprecated */ #p = 1; value = this.#p; }
