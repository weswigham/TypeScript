//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxGenericParameters.ts] ////

//// [input.ts]
function f(value: Box<string> = new Box()) {}

//// [input.ts]
function f(value = new Box<string>()) {}
