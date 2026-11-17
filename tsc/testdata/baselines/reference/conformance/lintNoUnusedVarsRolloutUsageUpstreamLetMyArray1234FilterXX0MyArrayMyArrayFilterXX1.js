//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamLetMyArray1234FilterXX0MyArrayMyArrayFilterXX1.ts] ////

//// [globals.d.ts]

//// [input.ts]
let myArray = [1,2,3,4].filter((x) => x == 0);
myArray = myArray.filter((x) => x == 1);

//// [input.ts]
let myArray = [1,2,3,4].filter((x) => x == 0);
myArray = myArray.filter((x) => x == 1);
