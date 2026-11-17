//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionGeneratorLetDoneFalseTryYield1FinallyDoneTrueConsoleLogDone.ts] ////

//// [globals.d.ts]

//// [input.ts]
function* generator() {
                let done = false;
                try {
                    yield 1;
                } finally {
                    done = true;
                    console.log(done);
                }
            }

//// [input.ts]
function* generator() {
                let done = false;
                try {
                    yield 1;
                } finally {
                    done = true;
                    console.log(done);
                }
            }
