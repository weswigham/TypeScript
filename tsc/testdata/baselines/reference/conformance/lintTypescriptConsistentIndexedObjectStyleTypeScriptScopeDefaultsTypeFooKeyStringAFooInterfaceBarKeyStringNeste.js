//// [tests/cases/conformance/lint/rules/consistent-indexed-object-style/lintTypescriptConsistentIndexedObjectStyleTypeScriptScopeDefaultsTypeFooKeyStringAFooInterfaceBarKeyStringNeste.ts] ////

//// [input.ts]
type Foo = { [key: string]: A.Foo }; interface Bar { [key: string]: { nested: Bar } }

//// [input.ts]
type Foo = Record<string, A.Foo>; type Bar = Record<string, { nested: Bar }>;
