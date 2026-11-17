//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetOutcomeUnknownTryHelper1OutcomeSuccessCatchErrHelper2O.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
			let outcome = 'unknown';

			try {
				helper1();
				outcome = 'success';
			} catch (err) {
				helper2();
				outcome = 'exception'; 
			} finally {
				console.log(outcome);
			}
		}

//// [input.ts]
function foo() {
			let outcome = 'unknown';

			try {
				helper1();
				outcome = 'success';
			} catch (err) {
				helper2();
				outcome = 'exception'; 
			} finally {
				console.log(outcome);
			}
		}
