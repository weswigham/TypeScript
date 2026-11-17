//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppLetXInitFooXXUsedReturnAXA.ts] ////

//// [globals.d.ts]

//// [input.tsx]
function App() {
				let x = "init";
				foo(x);
				x = "used";
				return <A>{x}</A>;
			}

//// [input.tsx]
function App() {
				let x = "init";
				foo(x);
				x = "used";
				return <A>{x}</A>;
			}
