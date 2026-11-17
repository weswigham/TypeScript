//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetVUsedConsoleLogVVUnusedThrowNewErrorConsoleLogV.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo () {
                let v = 'used';
                console.log(v);
                v = 'unused';
                throw new Error();
                console.log(v);
            }

//// [input.ts]
function foo () {
                let v = 'used';
                console.log(v);
                v = 'unused';
                throw new Error();
                console.log(v);
            }
