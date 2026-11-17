//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamLetMessageInitTryMessageCallMessageCatchEIgnoreConsoleLogMessage.ts] ////

//// [globals.d.ts]

//// [input.ts]
let message = 'init';
        try {
            message = call().message;
        } catch (e) {
            // ignore
        }
        console.log(message)

//// [input.ts]
let message = 'init';
        try {
            message = call().message;
        } catch (e) {
            // ignore
        }
        console.log(message)
