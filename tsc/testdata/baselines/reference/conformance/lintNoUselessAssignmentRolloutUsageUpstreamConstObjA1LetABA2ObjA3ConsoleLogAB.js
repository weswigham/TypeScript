//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamConstObjA1LetABA2ObjA3ConsoleLogAB.ts] ////

//// [globals.d.ts]

//// [input.ts]
const obj = { a: 1 };
            let {
                a,
                b = (a = 2)
            } = obj;
            a = 3
            console.log(a, b);

//// [input.ts]
const obj = { a: 1 };
            let {
                a,
                b = (a = 2)
            } = obj;
            a = 3
            console.log(a, b);
