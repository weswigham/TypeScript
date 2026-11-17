//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamVarFooLetVUsedConsoleLogVVUnused.ts] ////

//// [globals.d.ts]

//// [input.ts]
var foo = () => {
                let v = 'used';
                console.log(v);
                v = 'unused'
            }

//// [input.ts]
var foo = () => {
                let v = 'used';
                console.log(v);
                v = 'unused'
            }
