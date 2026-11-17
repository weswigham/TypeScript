//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionGeneratorLetDoneFalseYield1DoneTrueConsoleLogDone.ts] ////

//// [globals.d.ts]

//// [input.ts]
function* generator() {
                let done = false;
                yield 1;
                done = true;
                console.log(done);
            }

//// [input.ts]
function* generator() {
                let done = false;
                yield 1;
                done = true;
                console.log(done);
            }
