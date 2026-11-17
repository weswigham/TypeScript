//// [tests/cases/conformance/lint/rules/consistent-type-definitions/lintTypescriptConsistentTypeDefinitionsTypeScriptSyntaxUpstreamInvalid117190.ts] ////

//// [input.ts]
interface A extends B<T1>, C<T2> { x: number; };

//// [input.ts]
type A = { x: number; } & B<T1> & C<T2>;
