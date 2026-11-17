//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintTypescriptNoUnusedPrivateClassMembersTypeScriptScopeDefaultsClassCPrivateASetBValueMConstAThisThisB1.ts] ////

//// [input.ts]
class C { private a; set #b(value) {} m() { const { a } = this; this.#b = 1; } }

//// [input.ts]
class C { private a; set #b(value) {} m() { const { a } = this; this.#b = 1; } }
