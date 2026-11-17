//// [tests/cases/conformance/lint/rules/no-magic-numbers/lintNoMagicNumbersCoreSyntaxBMagicMethodKeysDetectObjects.ts] ////

//// [input.ts]
const object = { 1() {}, [2]() {} }; class Item { 3() {} [4]() {} }

//// [input.ts]
const object = { 1() {}, [2]() {} }; class Item { 3() {} [4]() {} }
