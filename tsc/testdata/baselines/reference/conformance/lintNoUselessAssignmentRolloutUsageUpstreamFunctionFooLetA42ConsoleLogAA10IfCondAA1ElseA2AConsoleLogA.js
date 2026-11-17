//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetA42ConsoleLogAA10IfCondAA1ElseA2AConsoleLogA.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
            let a = 42;
            console.log(a);
            a = 10;
            if (cond) {
                a = a + 1;
            } else {
                a = 2 + a;
            }
            console.log(a);
        }

//// [input.ts]
function foo() {
            let a = 42;
            console.log(a);
            a = 10;
            if (cond) {
                a = a + 1;
            } else {
                a = 2 + a;
            }
            console.log(a);
        }
