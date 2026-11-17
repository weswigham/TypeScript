//// [tests/cases/conformance/lint/rules/no-magic-numbers/lintNoMagicNumbersCoreSyntaxBMagicTypes.ts] ////

//// [input.ts]
enum Item { Value = 2 } type Value = 1 | -2; function run(value = 3) {} class Other { field = 4; }

//// [input.ts]
enum Item { Value = 2 } type Value = 1 | -2; function run(value = 3) {} class Other { field = 4; }
