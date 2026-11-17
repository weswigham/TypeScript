//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamInvalid4327200.ts] ////

//// [input.ts]
const a = new Map<string, number>();

//// [input.ts]
const a: Map<string, number> = new Map();
