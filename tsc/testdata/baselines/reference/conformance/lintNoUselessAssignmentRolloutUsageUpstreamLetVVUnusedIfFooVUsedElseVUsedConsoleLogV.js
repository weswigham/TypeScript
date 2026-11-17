//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamLetVVUnusedIfFooVUsedElseVUsedConsoleLogV.ts] ////

//// [globals.d.ts]

//// [input.ts]

            let v;
            v = 'unused';
            if (foo) {
                v = 'used';
            } else {
                v = 'used';
            }
            console.log(v);

//// [input.ts]

            let v;
            v = 'unused';
            if (foo) {
                v = 'used';
            } else {
                v = 'used';
            }
            console.log(v);
