//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetVUnusedIfConditionVUsedConsoleLogVReturn.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
                let v = 'unused';
                if (condition) {
                    v = 'used';
                    console.log(v);
                    return
                }
            }

//// [input.ts]
function foo() {
                let v = 'unused';
                if (condition) {
                    v = 'used';
                    console.log(v);
                    return
                }
            }
