//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstDataTypeCoordsX1Y2ConstTypeCoordsDataConsoleLogCoords01.ts] ////

//// [globals.d.ts]

//// [input.ts]
const data = { type: 'coords', x: 1, y: 2 };
const { type, ...coords } = data;
 console.log(coords);

//// [input.ts]
const data = { type: 'coords', x: 1, y: 2 };
const { type, ...coords } = data;
 console.log(coords);
