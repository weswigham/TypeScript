//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstDataTypeCoordsX2Y2ConstTypeCoordsDataConsoleLogType.ts] ////

//// [globals.d.ts]

//// [input.ts]
const data = { type: 'coords', x: 2, y: 2 };
const { type, ...coords } = data;
 console.log(type)

//// [input.ts]
const data = { type: 'coords', x: 2, y: 2 };
const { type, ...coords } = data;
 console.log(type)
