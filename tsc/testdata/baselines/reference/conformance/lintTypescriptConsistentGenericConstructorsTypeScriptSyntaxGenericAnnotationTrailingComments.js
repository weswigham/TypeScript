//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxGenericAnnotationTrailingComments.ts] ////

//// [input.ts]
const value: (Box<string> /* trailing */) = new Box();

//// [input.ts]
const value = new Box/* trailing */<string>();
