//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamLetMessageUnusedTryMessageUsedConsoleLogMessageCatchE.ts] ////

//// [globals.d.ts]

//// [input.ts]
let message = 'unused';
            try {
                message = 'used';
                console.log(message)
            } catch (e) {
            }

//// [input.ts]
let message = 'unused';
            try {
                message = 'used';
                console.log(message)
            } catch (e) {
            }
