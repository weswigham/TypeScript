//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamLetATryFooFinallyA5ConsoleLogA.ts] ////

//// [globals.d.ts]

//// [input.ts]
let a;
        try {
            foo();
        } finally {
            a = 5;
        }
        console.log(a);

//// [input.ts]
let a;
        try {
            foo();
        } finally {
            a = 5;
        }
        console.log(a);
