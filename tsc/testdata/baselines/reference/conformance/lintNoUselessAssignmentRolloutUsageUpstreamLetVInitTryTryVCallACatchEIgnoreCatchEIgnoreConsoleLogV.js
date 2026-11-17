//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamLetVInitTryTryVCallACatchEIgnoreCatchEIgnoreConsoleLogV.ts] ////

//// [globals.d.ts]

//// [input.ts]
let v = 'init';
        try {
            try {
                v = callA();
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
            try {
                v = callA();
            } catch (e) {
                // ignore
            }
        } catch (e) {
            // ignore
        }
        console.log(v)
