//// [tests/cases/conformance/lint/rules/consistent-type-definitions/lintTypescriptConsistentTypeDefinitionsTypeScriptSyntaxUpstreamInvalid117180.ts] ////

//// [input.ts]
interface A extends B, C { x: number; };

//// [input.ts]
type A = { x: number; } & B & C;
