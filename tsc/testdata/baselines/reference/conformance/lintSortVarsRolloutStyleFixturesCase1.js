//// [tests/cases/conformance/lint/rules/sort-vars/lintSortVarsRolloutStyleFixturesCase1.ts] ////

//// [input.ts]

var zebra = 1, alpha = 2, middle = 3;
let later = compute(), earlier = 0;
const [last, first] = source;

//// [input.ts]

var alpha = 2, middle = 3, zebra = 1;
let later = compute(), earlier = 0;
const [last, first] = source;
