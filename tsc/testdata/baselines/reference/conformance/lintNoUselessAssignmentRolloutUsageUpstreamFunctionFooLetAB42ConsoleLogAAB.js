//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetAB42ConsoleLogAAB.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
            let a = { b: 42 };
            console.log(a);
            a.b++;
        }

//// [input.ts]
function foo() {
            let a = { b: 42 };
            console.log(a);
            a.b++;
        }
