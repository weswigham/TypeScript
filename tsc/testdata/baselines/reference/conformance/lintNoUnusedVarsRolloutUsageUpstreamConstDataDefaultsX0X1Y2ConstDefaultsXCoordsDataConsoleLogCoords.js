//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstDataDefaultsX0X1Y2ConstDefaultsXCoordsDataConsoleLogCoords.ts] ////

//// [globals.d.ts]

//// [input.ts]
const data = { defaults: { x: 0 }, x: 1, y: 2 };
const { defaults: { x }, ...coords } = data;
 console.log(coords)

//// [input.ts]
const data = { defaults: { x: 0 }, x: 1, y: 2 };
const { defaults: { x }, ...coords } = data;
 console.log(coords)
