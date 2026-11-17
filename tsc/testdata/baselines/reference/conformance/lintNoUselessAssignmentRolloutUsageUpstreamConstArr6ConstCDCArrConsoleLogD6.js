//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamConstArr6ConstCDCArrConsoleLogD6.ts] ////

//// [globals.d.ts]

//// [input.ts]
const arr = [6];
        const [c, d = c] = arr;
        console.log(d); // 6

//// [input.ts]
const arr = [6];
        const [c, d = c] = arr;
        console.log(d); // 6
