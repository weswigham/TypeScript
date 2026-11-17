//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionGeneratorLetDoneFalseTryYield1DoneTrueYield2FinallyIfDoneCon.ts] ////

//// [globals.d.ts]

//// [input.ts]
function* generator() {
            let done = false;
            try {
                yield 1;
                done = true;
                yield 2;
            } finally {
                if (done) {
                    console.log("done is true");
                }
            }
        }

//// [input.ts]
function* generator() {
            let done = false;
            try {
                yield 1;
                done = true;
                yield 2;
            } finally {
                if (done) {
                    console.log("done is true");
                }
            }
        }
