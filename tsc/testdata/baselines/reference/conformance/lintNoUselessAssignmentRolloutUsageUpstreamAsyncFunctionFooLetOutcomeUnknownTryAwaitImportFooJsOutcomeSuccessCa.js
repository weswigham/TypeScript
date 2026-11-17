//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamAsyncFunctionFooLetOutcomeUnknownTryAwaitImportFooJsOutcomeSuccessCa.ts] ////

//// [globals.d.ts]

//// [input.ts]
async function foo() {
			let outcome = 'unknown';

			try {
				await import("./foo.js");
				outcome = 'success';
			} catch (err) {
				await import("./bar.js");
				outcome = 'exception';
			} finally {
				console.log(outcome);
			}
		}

//// [input.ts]
async function foo() {
			let outcome = 'unknown';

			try {
				await import("./foo.js");
				outcome = 'success';
			} catch (err) {
				await import("./bar.js");
				outcome = 'exception';
			} finally {
				console.log(outcome);
			}
		}
