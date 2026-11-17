//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamConstObjA5ConstABAObjConsoleLogB5.ts] ////

//// [globals.d.ts]

//// [input.ts]
const obj = { a: 5 };
        const { a, b = a } = obj;
        console.log(b); // 5

//// [input.ts]
const obj = { a: 5 };
        const { a, b = a } = obj;
        console.log(b); // 5
