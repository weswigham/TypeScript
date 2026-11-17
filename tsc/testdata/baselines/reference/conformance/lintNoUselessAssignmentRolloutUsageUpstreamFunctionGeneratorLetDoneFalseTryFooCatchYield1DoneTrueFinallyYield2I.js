//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionGeneratorLetDoneFalseTryFooCatchYield1DoneTrueFinallyYield2I.ts] ////

//// [globals.d.ts]

//// [input.ts]
function* generator() {
            let done = false;
            try {
                foo();
            } catch {
                yield 1;
                done = true;
            } finally {
                yield 2;
                if (!done) {
                    console.log(done);
                }
            }
        }

//// [input.ts]
function* generator() {
            let done = false;
            try {
                foo();
            } catch {
                yield 1;
                done = true;
            } finally {
                yield 2;
                if (!done) {
                    console.log(done);
                }
            }
        }
