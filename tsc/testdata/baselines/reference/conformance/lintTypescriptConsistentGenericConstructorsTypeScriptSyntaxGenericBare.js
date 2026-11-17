//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxGenericBare.ts] ////

//// [input.ts]
const value: Box<number> = new Box;

//// [input.ts]
const value = new Box<number>();
