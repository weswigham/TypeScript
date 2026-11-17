//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamConstObjA1LetABA2ObjConsoleLogAB.ts] ////

//// [globals.d.ts]

//// [input.ts]
const obj = { a: 1 };
        let {
            a,
            b = (a = 2)
        } = obj;
        console.log(a, b);

//// [input.ts]
const obj = { a: 1 };
        let {
            a,
            b = (a = 2)
        } = obj;
        console.log(a, b);
