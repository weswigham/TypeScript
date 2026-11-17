//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetOutcomeUnknownTryHelper1OutcomeSuccessCatchErrOutcomeE.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
			let outcome = 'unknown';

			try {
				helper1();
				outcome = 'success';
			} catch (err) {
			 	outcome = 'exception';
				helper2(); 
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
			 	outcome = 'exception';
				helper2(); 
			} finally {
				console.log(outcome);
			}
		}
