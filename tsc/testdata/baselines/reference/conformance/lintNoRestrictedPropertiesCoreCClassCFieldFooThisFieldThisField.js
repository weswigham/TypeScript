//// [tests/cases/conformance/lint/rules/no-restricted-properties/lintNoRestrictedPropertiesCoreCClassCFieldFooThisFieldThisField.ts] ////

//// [input.ts]
class C { #field; foo() { this.#field; this['#field']; } }

//// [input.ts]
class C { #field; foo() { this.#field; this['#field']; } }
