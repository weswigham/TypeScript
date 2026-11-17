//// [tests/cases/conformance/lint/rules/no-duplicate-enum-values/lintTypescriptNoDuplicateEnumValuesTypeScriptSyntaxEnumIgnored.ts] ////

//// [input.ts]
enum E { A = 1, B, C = 1 + 1, D = NaN, F = NaN, G = Infinity, H = Infinity, I = `${'x'}` }

//// [input.ts]
enum E { A = 1, B, C = 1 + 1, D = NaN, F = NaN, G = Infinity, H = Infinity, I = `${'x'}` }
