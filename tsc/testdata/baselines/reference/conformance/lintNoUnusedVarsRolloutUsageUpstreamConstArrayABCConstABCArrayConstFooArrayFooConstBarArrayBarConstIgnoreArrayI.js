//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstArrayABCConstABCArrayConstFooArrayFooConstBarArrayBarConstIgnoreArrayI.ts] ////

//// [globals.d.ts]

//// [input.ts]
const array = ['a', 'b', 'c'];
const [a, _b, c] = array;
const fooArray = ['foo'];
const barArray = ['bar'];
const ignoreArray = ['ignore'];

//// [input.ts]
const array = ['a', 'b', 'c'];
const [a, _b, c] = array;
const fooArray = ['foo'];
const barArray = ['bar'];
const ignoreArray = ['ignore'];
