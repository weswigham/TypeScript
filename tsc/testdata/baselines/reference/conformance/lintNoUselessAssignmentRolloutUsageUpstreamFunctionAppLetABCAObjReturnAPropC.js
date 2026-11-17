//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppLetABCAObjReturnAPropC.ts] ////

//// [globals.d.ts]

//// [input.tsx]
function App() {
				let { a, b: { c = a } = {} } = obj;
				return <A prop={c} />;
			}

//// [input.tsx]
function App() {
				let { a, b: { c = a } = {} } = obj;
				return <A prop={c} />;
			}
