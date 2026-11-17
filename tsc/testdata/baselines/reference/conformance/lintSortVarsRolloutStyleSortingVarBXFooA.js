//// [tests/cases/conformance/lint/rules/sort-vars/lintSortVarsRolloutStyleSortingVarBXFooA.ts] ////

//// [input.ts]
var b, {x} = foo(), a;

//// [input.ts]
var a, {x} = foo(), b;
