//// [tests/cases/conformance/lint/rules/no-deprecated/lintTypescriptNoDeprecatedFinalStructuralDeprecatedClassADeprecatedPCallThisP.ts] ////

//// [input.ts]
class A { /** @deprecated */ #p = () => {}; call() { this.#p(); } }

//// [input.ts]
class A { /** @deprecated */ #p = () => {}; call() { this.#p(); } }
