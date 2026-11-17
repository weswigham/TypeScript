//// [tests/cases/conformance/lint/rules/no-array-constructor/noArrayConstructorScopeA.ts] ////

//// [input.ts]
const empty = new Array();
const values = Array(first, second);
const length = Array(3);
const typed = Array<number>();
const optional = Array?.();
const spread = Array(...items);
const header = new /* keep */ Array();
const commented = Array(/* keep */ first, second);
function shadow(Array: any) { return Array(); }
work()
Array();

//// [input.ts]
const empty = [];
const values = [first, second];
const length = Array(3);
const typed = Array<number>();
const optional = Array?.();
const spread = Array(...items);
const header = new /* keep */ Array();
const commented = [/* keep */ first, second];
function shadow(Array: any) { return Array(); }
work();
[];
