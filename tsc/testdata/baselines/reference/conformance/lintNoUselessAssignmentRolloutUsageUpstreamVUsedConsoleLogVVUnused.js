//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamVUsedConsoleLogVVUnused.ts] ////

//// [globals.d.ts]

//// [input.ts]
v = 'used';
        console.log(v);
        v = 'unused'

//// [input.ts]
v = 'used';
        console.log(v);
        v = 'unused'
