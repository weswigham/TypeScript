//// [tests/cases/conformance/lint/rules/prefer-destructuring/lintPreferDestructuringRolloutDeclarationsDestructurePrivate.ts] ////

//// [input.ts]
class A { #x; f() { const x = this.#x; } }

//// [input.ts]
class A { #x; f() { const x = this.#x; } }
