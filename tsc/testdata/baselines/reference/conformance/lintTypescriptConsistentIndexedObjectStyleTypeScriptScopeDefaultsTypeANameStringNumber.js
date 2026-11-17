//// [tests/cases/conformance/lint/rules/consistent-indexed-object-style/lintTypescriptConsistentIndexedObjectStyleTypeScriptScopeDefaultsTypeANameStringNumber.ts] ////

//// [input.ts]
type A = { [name: string]: number };

//// [input.ts]
type A = Record<string, number>;
