//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooLetOutcomeUnknownTryObjFooOutcomeSuccessCatchErrObjFooOut.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo() {
			let outcome = 'unknown';

			try {
				obj.foo;
				outcome = 'success';
			} catch (err) {
				obj.foo;
				outcome = 'exception';
			} finally {
				console.log(outcome);
			}
		}

//// [input.ts]
function foo() {
			let outcome = 'unknown';

			try {
				obj.foo;
				outcome = 'success';
			} catch (err) {
				obj.foo;
				outcome = 'exception';
			} finally {
				console.log(outcome);
			}
		}
