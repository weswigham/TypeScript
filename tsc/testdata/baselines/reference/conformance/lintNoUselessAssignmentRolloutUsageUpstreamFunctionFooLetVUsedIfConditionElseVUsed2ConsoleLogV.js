//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetVUsedIfConditionElseVUsed2ConsoleLogV.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
            let v = 'used';
            if (condition) {
                //
            } else {
                v = 'used-2';
            }
            console.log(v);
        }

//// [input.ts]
function foo() {
            let v = 'used';
            if (condition) {
                //
            } else {
                v = 'used-2';
            }
            console.log(v);
        }
