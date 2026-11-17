//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxGenericExemptions.ts] ////

//// [input.ts]
const a: Other<string> = new Box(); const b: Box<string> = new Box<string>(); const c: Box = new Box(); const d: Box<string> = Box();

//// [input.ts]
const a: Other<string> = new Box(); const b: Box<string> = new Box<string>(); const c: Box = new Box(); const d: Box<string> = Box();
