//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionGeneratorLetDoneFalseTryYield1DoneTrueCatchDoneTrueFinallyIf.ts] ////

//// [globals.d.ts]

//// [input.ts]
function* generator() {
            let done = false;
            try {
                yield 1;
                done = true;
            } catch {
                done = true;
            } finally {
                if (!done) {
                    console.log("done is false");
                }
            }
        }

//// [input.ts]
function* generator() {
            let done = false;
            try {
                yield 1;
                done = true;
            } catch {
                done = true;
            } finally {
                if (!done) {
                    console.log("done is false");
                }
            }
        }
