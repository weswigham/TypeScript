//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxGenericParameterPropertyExcluded.ts] ////

//// [input.ts]
class C { constructor(public value: Box<string> = new Box()) {} }

//// [input.ts]
class C { constructor(public value: Box<string> = new Box()) {} }
