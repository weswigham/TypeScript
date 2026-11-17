//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetVUsedConsoleLogVVUnusedVUnusedVUsedConsoleLogV.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
                let v = 'used';
                console.log(v);
                v = 'unused';
                v = 'unused';
                v = 'used';
                console.log(v);
            }

//// [input.ts]
function foo() {
                let v = 'used';
                console.log(v);
                v = 'unused';
                v = 'unused';
                v = 'used';
                console.log(v);
            }
