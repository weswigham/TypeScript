//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstXLetYZYXFooY.ts] ////

//// [globals.d.ts]

//// [input.ts]
const x = []; let y; ({z: [y] = x} = {}); foo(y);

//// [input.ts]
const x = []; let y; ({z: [y] = x} = {}); foo(y);
