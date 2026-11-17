//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooConstX1ConsoleLogXReturnXFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
            const x = 1;
            console.log(x);
            return;

            x = 'Foo'
        }

//// [input.ts]
function foo() {
            const x = 1;
            console.log(x);
            return;

            x = 'Foo'
        }
