//// [tests/cases/conformance/lint/rules/no-multi-assign/noMultiAssignCoreB.ts] ////

//// [input.ts]
let first = second = third = 1;
first = second = 1;
class Item { field = second = 1; }
let separate = 1, other = 2;
first = second;

//// [input.ts]
let first = second = third = 1;
first = second = 1;
class Item { field = second = 1; }
let separate = 1, other = 2;
first = second;
