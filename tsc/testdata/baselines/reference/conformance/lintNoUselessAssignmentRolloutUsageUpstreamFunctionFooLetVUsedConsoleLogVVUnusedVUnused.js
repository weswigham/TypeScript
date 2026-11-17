//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetVUsedConsoleLogVVUnusedVUnused.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
                let v = 'used';
                console.log(v);
                v = 'unused';
                v = 'unused';
            }

//// [input.ts]
function foo() {
                let v = 'used';
                console.log(v);
                v = 'unused';
                v = 'unused';
            }
