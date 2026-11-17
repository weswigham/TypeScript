//// [tests/cases/conformance/lint/rules/require-array-sort-compare/tsRequireArraySortCompareTypedC.ts] ////

//// [input.ts]
[1, 2].sort();
['a', 'b'].sort();
[1, 2].sort((left, right) => left - right);
declare const tuple: readonly [string, ...number[]];
tuple.toSorted();
function sortNumbers<Values extends number[]>(values: Values) {
    values.sort();
}
declare const custom: { sort(): void };
custom.sort();

//// [input.ts]
[1, 2].sort();
['a', 'b'].sort();
[1, 2].sort((left, right) => left - right);
declare const tuple: readonly [string, ...number[]];
tuple.toSorted();
function sortNumbers<Values extends number[]>(values: Values) {
    values.sort();
}
declare const custom: { sort(): void };
custom.sort();
