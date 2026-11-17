//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamLetABCAObjConsoleLogC.ts] ////

//// [globals.d.ts]

//// [input.ts]
let { a, b: {c = a} = {} } = obj;
        console.log(c);

//// [input.ts]
let { a, b: {c = a} = {} } = obj;
        console.log(c);
