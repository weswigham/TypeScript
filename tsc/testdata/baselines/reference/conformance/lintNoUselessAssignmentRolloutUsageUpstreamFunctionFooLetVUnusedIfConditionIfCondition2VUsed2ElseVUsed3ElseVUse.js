//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetVUnusedIfConditionIfCondition2VUsed2ElseVUsed3ElseVUse.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
                let v = 'unused';
                if (condition) {
                    if (condition2) {
                        v = 'used-2';
                    } else {
                        v = 'used-3';
                    }
                } else {
                    v = 'used-4';
                }
                console.log(v);
            }

//// [input.ts]
function foo() {
                let v = 'unused';
                if (condition) {
                    if (condition2) {
                        v = 'used-2';
                    } else {
                        v = 'used-3';
                    }
                } else {
                    v = 'used-4';
                }
                console.log(v);
            }
