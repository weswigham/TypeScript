//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppConstArr6ConstCDCArrReturnAPropD.ts] ////

//// [globals.d.ts]

//// [input.tsx]
function App() {
				const arr = [6];
				const [c, d = c] = arr;
				return <A prop={d} />;
			}

//// [input.tsx]
function App() {
				const arr = [6];
				const [c, d = c] = arr;
				return <A prop={d} />;
			}
