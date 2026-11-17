//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamLetMessageUnusedTryMessageCallCatchEMessageUsedConsoleLogMessage.ts] ////

//// [globals.d.ts]

//// [input.ts]
let message = 'unused';
            try {
                message = call();
            } catch (e) {
                message = 'used';
            }
            console.log(message)

//// [input.ts]
let message = 'unused';
            try {
                message = call();
            } catch (e) {
                message = 'used';
            }
            console.log(message)
