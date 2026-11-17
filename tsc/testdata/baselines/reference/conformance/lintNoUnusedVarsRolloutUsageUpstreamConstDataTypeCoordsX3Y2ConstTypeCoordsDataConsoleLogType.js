//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstDataTypeCoordsX3Y2ConstTypeCoordsDataConsoleLogType.ts] ////

//// [globals.d.ts]

//// [input.ts]
const data = { type: 'coords', x: 3, y: 2 };
const { type, ...coords } = data;
 console.log(type)

//// [input.ts]
const data = { type: 'coords', x: 3, y: 2 };
const { type, ...coords } = data;
 console.log(type)
