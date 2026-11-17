//// [tests/cases/conformance/lint/rules/require-array-sort-compare/lintTypescriptRequireArraySortCompareTypedCArraySortComputedReassigned.ts] ////

//// [input.ts]
let method = 'sort'; method = 'other'; [1, 2][method]();

//// [input.ts]
let method = 'sort'; method = 'other'; [1, 2][method]();
