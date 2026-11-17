//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetA42ConsoleLogAA10AA1ConsoleLogA.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
            let a = 42;
            console.log(a);
            a = 10;
            a = a + 1;
            console.log(a);
        }

//// [input.ts]
function foo() {
            let a = 42;
            console.log(a);
            a = 10;
            a = a + 1;
            console.log(a);
        }
