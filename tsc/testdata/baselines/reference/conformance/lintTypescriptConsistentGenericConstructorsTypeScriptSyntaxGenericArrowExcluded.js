//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxGenericArrowExcluded.ts] ////

//// [input.ts]
const fn = (value: Box<string> = new Box()) => value;

//// [input.ts]
const fn = (value: Box<string> = new Box()) => value;
