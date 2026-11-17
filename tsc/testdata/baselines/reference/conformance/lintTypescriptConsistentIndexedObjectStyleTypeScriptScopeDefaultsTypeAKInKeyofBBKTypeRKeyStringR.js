//// [tests/cases/conformance/lint/rules/consistent-indexed-object-style/lintTypescriptConsistentIndexedObjectStyleTypeScriptScopeDefaultsTypeAKInKeyofBBKTypeRKeyStringR.ts] ////

//// [input.ts]
type A = { [K in keyof B]: B[K] }; type R = { [key: string]: R };

//// [input.ts]
type A = { [K in keyof B]: B[K] }; type R = { [key: string]: R };
