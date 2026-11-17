//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetA42ConsoleLogAAConsoleLogACase1.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
            let a = 42;
            console.log(a);
            a--;
            console.log(a);
        }

//// [input.ts]
function foo() {
            let a = 42;
            console.log(a);
            a--;
            console.log(a);
        }
