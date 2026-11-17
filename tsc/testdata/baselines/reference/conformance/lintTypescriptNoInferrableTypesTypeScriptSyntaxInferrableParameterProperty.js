//// [tests/cases/conformance/lint/rules/no-inferrable-types/lintTypescriptNoInferrableTypesTypeScriptSyntaxInferrableParameterProperty.ts] ////

//// [input.ts]
class C { constructor(public value: number = 1) {} }

//// [input.ts]
class C { constructor(public value = 1) {} }
