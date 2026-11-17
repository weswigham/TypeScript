//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetVIfConditionVUnusedElseIfCondition2VUsed1ElseVUsed2Con.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
                let v;
                if (condition) {
                    v = 'unused';
                } else {
                    //
                }
                if (condition2) {
                    v = 'used-1';
                } else {
                    v = 'used-2';
                }
                console.log(v);
            }

//// [input.ts]
function foo() {
                let v;
                if (condition) {
                    v = 'unused';
                } else {
                    //
                }
                if (condition2) {
                    v = 'used-1';
                } else {
                    v = 'used-2';
                }
                console.log(v);
            }
