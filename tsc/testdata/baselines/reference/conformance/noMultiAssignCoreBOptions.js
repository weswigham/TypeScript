//// [tests/cases/conformance/lint/rules/no-multi-assign/noMultiAssignCoreBOptions.ts] ////

//// [input.ts]
first = second = 1;
let declaration = first = 1;
class Item { field = first = 1; }

//// [input.ts]
first = second = 1;
let declaration = first = 1;
class Item { field = first = 1; }
