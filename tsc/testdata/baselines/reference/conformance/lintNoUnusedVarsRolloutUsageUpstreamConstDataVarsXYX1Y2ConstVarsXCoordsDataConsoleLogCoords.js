//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstDataVarsXYX1Y2ConstVarsXCoordsDataConsoleLogCoords.ts] ////

//// [globals.d.ts]

//// [input.ts]
const data = { vars: ['x','y'], x: 1, y: 2 };
const { vars: [x], ...coords } = data;
 console.log(coords)

//// [input.ts]
const data = { vars: ['x','y'], x: 1, y: 2 };
const { vars: [x], ...coords } = data;
 console.log(coords)
