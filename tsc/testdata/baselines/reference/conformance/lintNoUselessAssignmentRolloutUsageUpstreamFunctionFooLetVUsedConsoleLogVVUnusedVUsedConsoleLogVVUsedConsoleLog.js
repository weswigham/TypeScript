//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetVUsedConsoleLogVVUnusedVUsedConsoleLogVVUsedConsoleLog.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
                let v = 'used';
                console.log(v);
                v = 'unused';
                v = 'used';
                console.log(v);
                v = 'used';
                console.log(v);
            }

//// [input.ts]
function foo() {
                let v = 'used';
                console.log(v);
                v = 'unused';
                v = 'used';
                console.log(v);
                v = 'used';
                console.log(v);
            }
