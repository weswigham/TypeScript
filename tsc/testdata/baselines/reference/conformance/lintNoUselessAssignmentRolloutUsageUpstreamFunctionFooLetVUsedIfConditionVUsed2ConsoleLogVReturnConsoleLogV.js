//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetVUsedIfConditionVUsed2ConsoleLogVReturnConsoleLogV.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
            let v = 'used';
            if (condition) {
                v = 'used-2';
                console.log(v);
                return
            }
            console.log(v);
        }

//// [input.ts]
function foo() {
            let v = 'used';
            if (condition) {
                v = 'used-2';
                console.log(v);
                return
            }
            console.log(v);
        }
