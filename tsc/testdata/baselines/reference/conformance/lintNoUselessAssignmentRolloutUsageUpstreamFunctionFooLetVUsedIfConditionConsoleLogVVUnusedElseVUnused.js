//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetVUsedIfConditionConsoleLogVVUnusedElseVUnused.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
                let v = 'used';
                if (condition) {
                    console.log(v);
                    v = 'unused';
                } else {
                    v = 'unused';
                }
            }

//// [input.ts]
function foo() {
                let v = 'used';
                if (condition) {
                    console.log(v);
                    v = 'unused';
                } else {
                    v = 'unused';
                }
            }
