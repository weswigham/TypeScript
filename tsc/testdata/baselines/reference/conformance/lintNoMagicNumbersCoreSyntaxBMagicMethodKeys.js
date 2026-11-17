//// [tests/cases/conformance/lint/rules/no-magic-numbers/lintNoMagicNumbersCoreSyntaxBMagicMethodKeys.ts] ////

//// [input.ts]
const object = { 1() {}, [2]() {} }; class Item { 3() {} [4]() {} }

//// [input.ts]
const object = { 1() {}, [2]() {} }; class Item { 3() {} [4]() {} }
