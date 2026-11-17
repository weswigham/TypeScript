//// [tests/cases/conformance/lint/rules/consistent-generic-constructors/lintTypescriptConsistentGenericConstructorsTypeScriptSyntaxUpstreamValid286360.ts] ////

//// [input.ts]
const a = new (class C<T> {})<string>();

//// [input.ts]
const a = new (class C<T> {})<string>();
