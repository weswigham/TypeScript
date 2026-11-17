//// [tests/cases/conformance/lint/rules/id-denylist/lintIdDenylistRolloutBindingsRulesDenyPrivate.ts] ////

//// [input.ts]
class C { #bad; method() { this.#bad; this.#bad = 1; } }

//// [input.ts]
class C { #bad; method() { this.#bad; this.#bad = 1; } }
