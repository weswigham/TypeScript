//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppLetAIfCondAFooElseABarReturnA.ts] ////

//// [globals.d.ts]

//// [input.tsx]
function App() {
				let A;
				if (cond) {
				  A = Foo;
				} else {
				  A = Bar;
				}
				return <A />;
			}

//// [input.tsx]
function App() {
				let A;
				if (cond) {
				  A = Foo;
				} else {
				  A = Bar;
				}
				return <A />;
			}
