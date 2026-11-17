//// [tests/cases/conformance/lint/rules/no-self-assign/lintNoSelfAssignCoreCClassCFieldFooThisFieldThisFieldThisFieldThisField.ts] ////

//// [input.ts]
class C { #field; foo() { this.#field = this.#field; this.#field = this['#field']; } }

//// [input.ts]
class C { #field; foo() { this.#field = this.#field; this.#field = this['#field']; } }
