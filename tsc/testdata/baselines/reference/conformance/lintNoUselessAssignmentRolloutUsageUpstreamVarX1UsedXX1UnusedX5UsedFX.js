//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamVarX1UsedXX1UnusedX5UsedFX.ts] ////

//// [globals.d.ts]

//// [input.ts]

            var x = 1; // used
            x = x + 1; // unused
            x = 5; // used
            f(x);

//// [input.ts]

            var x = 1; // used
            x = x + 1; // unused
            x = 5; // used
            f(x);
