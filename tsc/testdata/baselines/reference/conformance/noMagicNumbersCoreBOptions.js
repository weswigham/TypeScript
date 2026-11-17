//// [tests/cases/conformance/lint/rules/no-magic-numbers/noMagicNumbersCoreBOptions.ts] ////

//// [input.ts]
let declared = 3;
const object = { value: 4 };
array[0];
call(-1, 100n);
function run(value = 5) {}
class Item { readonly value = 6; field = 7; }
enum Choice { First = 8 }
type Value = 9 | -10;
type Index = Other[11 | 12];

//// [input.ts]
let declared = 3;
const object = { value: 4 };
array[0];
call(-1, 100n);
function run(value = 5) {}
class Item { readonly value = 6; field = 7; }
enum Choice { First = 8 }
type Value = 9 | -10;
type Index = Other[11 | 12];
