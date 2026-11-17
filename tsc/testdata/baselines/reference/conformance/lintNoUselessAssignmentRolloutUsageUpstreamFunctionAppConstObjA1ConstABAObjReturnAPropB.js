//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppConstObjA1ConstABAObjReturnAPropB.ts] ////

//// [globals.d.ts]

//// [input.tsx]
function App() {
				const obj = { a: 1 };
				const { a, b = a } = obj;
				return <A prop={b} />;
			}

//// [input.tsx]
function App() {
				const obj = { a: 1 };
				const { a, b = a } = obj;
				return <A prop={b} />;
			}
