//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetOutcomeUnknownTryBarCatchErrNewBazOutcomeExceptionFina.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
				let outcome = 'unknown';

				try {
					bar();
				} catch (err) {
					new Baz();
					outcome = 'exception'; 
				} finally {
					return;
					console.log(outcome);
				}
			}

//// [input.ts]
function foo() {
				let outcome = 'unknown';

				try {
					bar();
				} catch (err) {
					new Baz();
					outcome = 'exception'; 
				} finally {
					return;
					console.log(outcome);
				}
			}
