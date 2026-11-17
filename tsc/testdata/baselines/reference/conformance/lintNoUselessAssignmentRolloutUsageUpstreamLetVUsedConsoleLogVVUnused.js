//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamLetVUsedConsoleLogVVUnused.ts] ////

//// [globals.d.ts]

//// [input.ts]
let v = 'used';
            console.log(v);
            v = 'unused'

//// [input.ts]
let v = 'used';
            console.log(v);
            v = 'unused'
