//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamLetMessageUnusedTryConstResultCallMessageResultMessageCatchEMessageU.ts] ////

//// [globals.d.ts]

//// [input.ts]
let message = 'unused';
            try {
                const result = call();
                message = result.message;
            } catch (e) {
                message = 'used';
            }
            console.log(message)

//// [input.ts]
let message = 'unused';
            try {
                const result = call();
                message = result.message;
            } catch (e) {
                message = 'used';
            }
            console.log(message)
