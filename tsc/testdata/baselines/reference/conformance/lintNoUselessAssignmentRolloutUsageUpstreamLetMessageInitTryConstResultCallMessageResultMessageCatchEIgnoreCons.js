//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamLetMessageInitTryConstResultCallMessageResultMessageCatchEIgnoreCons.ts] ////

//// [globals.d.ts]

//// [input.ts]
let message = 'init';
        try {
            const result = call();
            message = result.message;
        } catch (e) {
            // ignore
        }
        console.log(message)

//// [input.ts]
let message = 'init';
        try {
            const result = call();
            message = result.message;
        } catch (e) {
            // ignore
        }
        console.log(message)
