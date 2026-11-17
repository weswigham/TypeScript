//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxGenericDefault.ts] ////

//// [input.ts]
const value: Box<string> = new Box();

//// [input.ts]
const value = new Box<string>();
