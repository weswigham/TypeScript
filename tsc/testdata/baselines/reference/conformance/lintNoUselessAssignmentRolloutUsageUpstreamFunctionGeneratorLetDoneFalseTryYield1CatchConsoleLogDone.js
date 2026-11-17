//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionGeneratorLetDoneFalseTryYield1CatchConsoleLogDone.ts] ////

//// [globals.d.ts]

//// [input.ts]
function* generator() {
            let done = false;
            try {
                yield 1;
            } catch {
                console.log(done);
            }
        }

//// [input.ts]
function* generator() {
            let done = false;
            try {
                yield 1;
            } catch {
                console.log(done);
            }
        }
