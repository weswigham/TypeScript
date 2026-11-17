//// [tests/cases/conformance/lint/rules/no-duplicate-enum-values/lintTypescriptNoDuplicateEnumValuesTypeScriptSyntaxEnumLiterals.ts] ////

//// [input.ts]
enum E { A = 0x10, B = 16, C = 'x', D = `x` }

//// [input.ts]
enum E { A = 0x10, B = 16, C = 'x', D = `x` }
