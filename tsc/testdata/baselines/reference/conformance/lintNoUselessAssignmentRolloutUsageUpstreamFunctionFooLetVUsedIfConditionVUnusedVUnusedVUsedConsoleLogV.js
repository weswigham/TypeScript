//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetVUsedIfConditionVUnusedVUnusedVUsedConsoleLogV.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
                let v = 'used';
                if (condition) {
                    v = 'unused';
                    v = 'unused';
                    v = 'used';
                }
                console.log(v);
            }

//// [input.ts]
function foo() {
                let v = 'used';
                if (condition) {
                    v = 'unused';
                    v = 'unused';
                    v = 'used';
                }
                console.log(v);
            }
