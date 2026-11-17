//// [tests/cases/conformance/lint/rules/no-empty-object-type/lintTypescriptNoEmptyObjectTypeTypeScriptSyntaxEmptyExemptions.ts] ////

//// [input.ts]
type NonNullable<T> = T & ({}); interface Both extends A, B {} interface Named { name: string }

//// [input.ts]
type NonNullable<T> = T & ({}); interface Both extends A, B {} interface Named { name: string }
