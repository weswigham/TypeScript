//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamLetVUnusedTryVCallATryVCallBCatchEIgnoreCatchEVUsedConsoleLogV.ts] ////

//// [globals.d.ts]

//// [input.ts]
let v = 'unused';
            try {
                v = callA();
                try {
                    v = callB();
                } catch (e) {
                    // ignore
                }
            } catch (e) {
                v = 'used';
            }
            console.log(v)

//// [input.ts]
let v = 'unused';
            try {
                v = callA();
                try {
                    v = callB();
                } catch (e) {
                    // ignore
                }
            } catch (e) {
                v = 'used';
            }
            console.log(v)
