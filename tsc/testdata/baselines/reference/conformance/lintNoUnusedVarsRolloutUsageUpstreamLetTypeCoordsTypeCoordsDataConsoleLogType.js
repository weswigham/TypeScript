//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamLetTypeCoordsTypeCoordsDataConsoleLogType.ts] ////

//// [globals.d.ts]

//// [input.ts]
let type, coords;
({ type, ...coords } = data);
 console.log(type)

//// [input.ts]
let type, coords;
({ type, ...coords } = data);
 console.log(type)
