//// [tests/cases/conformance/lint/rules/no-magic-numbers/lintNoMagicNumbersCoreSyntaxBMagicOptions.ts] ////

//// [input.ts]
let declared = 3; const object = { value: 4 }; array[0]; call(-1, 100n); class Item { readonly value = 5; } type Index = Other[1 | 2];

//// [input.ts]
let declared = 3; const object = { value: 4 }; array[0]; call(-1, 100n); class Item { readonly value = 5; } type Index = Other[1 | 2];
