//// [tests/cases/conformance/lint/rules/array-type/lintTypescriptArrayTypeTypeScriptScopeDefaultsTypeAArrayStringTypeBReadonlyArrayString.ts] ////

//// [input.ts]
type A = Array<string>; type B = ReadonlyArray<string>;

//// [input.ts]
type A = string[]; type B = readonly string[];
