//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamLetVInitTryVCallATryVCallBCatchEIgnoreCatchEIgnoreConsoleLogV.ts] ////

//// [globals.d.ts]

//// [input.ts]
let v = 'init';
        try {
            v = callA();
            try {
                v = callB();
            } catch (e) {
                // ignore
            }
        } catch (e) {
            // ignore
        }
        console.log(v)

//// [input.ts]
let v = 'init';
        try {
            v = callA();
            try {
                v = callB();
            } catch (e) {
                // ignore
            }
        } catch (e) {
            // ignore
        }
        console.log(v)
