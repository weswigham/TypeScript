//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetOutcomeUnknownTryNewFooOutcomeSuccessCatchErrNewBarOut.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
			let outcome = 'unknown';

			try {
				new Foo();
				outcome = 'success';
			} catch (err) {
				new Bar();
				outcome = 'exception'; 
			} finally {
				console.log(outcome);
			}
		}

//// [input.ts]
function foo() {
			let outcome = 'unknown';

			try {
				new Foo();
				outcome = 'success';
			} catch (err) {
				new Bar();
				outcome = 'exception'; 
			} finally {
				console.log(outcome);
			}
		}
