//// [tests/cases/conformance/lint/rules/no-inferrable-types/lintTypescriptNoInferrableTypesTypeScriptSyntaxInferrableProperty.ts] ////

//// [input.ts]
class C { readonly a: number = 1; b?: number = 1; c!: number = 1; accessor d: number = 1; }

//// [input.ts]
class C { readonly a: number = 1; b?: number = 1; c = 1; accessor d = 1; }
