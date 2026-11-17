//// [tests/cases/conformance/lint/rules/no-sparse-arrays/noSparseArraysCoreCommas.ts] ////

//// [input.ts]
const first = [,];
const second = [1,,2];
const third = [(( [a,] )),,,];
const fourth = [
    /* keep */, // keep
    ,
];
const dense = [1, 2,];
const [, value] = dense;
[, other] = dense;

//// [input.ts]
const first = [,];
const second = [1,,2];
const third = [(( [a,] )),,,];
const fourth = [
    /* keep */, // keep
    ,
];
const dense = [1, 2,];
const [, value] = dense;
[, other] = dense;
