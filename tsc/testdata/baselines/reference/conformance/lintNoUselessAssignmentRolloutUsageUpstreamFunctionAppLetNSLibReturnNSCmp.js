//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppLetNSLibReturnNSCmp.ts] ////

//// [globals.d.ts]

//// [input.tsx]
function App() {
				let NS = Lib;
				return <NS.Cmp />;
			}

//// [input.tsx]
function App() {
				let NS = Lib;
				return <NS.Cmp />;
			}
