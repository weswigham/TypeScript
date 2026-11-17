//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooReturnConstX1IfYBarX.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
            return;

            const x = 1;
            if (y) {
                bar(x);
            }
        }

//// [input.ts]
function foo() {
            return;

            const x = 1;
            if (y) {
                bar(x);
            }
        }
