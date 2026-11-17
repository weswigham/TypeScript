//// [tests/cases/conformance/lint/rules/no-self-compare/lintNoSelfCompareCoreCClassCFieldFooThisFieldThisU0066ield.ts] ////

//// [input.ts]
class C { #field; foo() { this.#field === this.#\u0066ield; } }

//// [input.ts]
class C { #field; foo() { this.#field === this.#\u0066ield; } }
