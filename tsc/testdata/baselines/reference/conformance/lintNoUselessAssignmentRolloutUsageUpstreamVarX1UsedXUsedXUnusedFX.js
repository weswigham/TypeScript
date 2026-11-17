//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamVarX1UsedXUsedXUnusedFX.ts] ////

//// [globals.d.ts]

//// [input.ts]

            var x = 1; // used
            x = // used
                x++; // unused
            f(x);

//// [input.ts]

            var x = 1; // used
            x = // used
                x++; // unused
            f(x);
