//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamVarFooFunctionLetVUsedConsoleLogVVUnused.ts] ////

//// [globals.d.ts]

//// [input.ts]
var foo = function () {
                let v = 'used';
                console.log(v);
                v = 'unused'
            }

//// [input.ts]
var foo = function () {
                let v = 'used';
                console.log(v);
                v = 'unused'
            }
