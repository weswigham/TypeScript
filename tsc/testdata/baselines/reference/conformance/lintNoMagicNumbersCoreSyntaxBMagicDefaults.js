//// [tests/cases/conformance/lint/rules/no-magic-numbers/lintNoMagicNumbersCoreSyntaxBMagicDefaults.ts] ////

//// [input.ts]
let declared = 3; const object = { value: 4 }; object.value = 5; declared = 6; call(7); parseInt(text, 10);

//// [input.ts]
let declared = 3; const object = { value: 4 }; object.value = 5; declared = 6; call(7); parseInt(text, 10);
