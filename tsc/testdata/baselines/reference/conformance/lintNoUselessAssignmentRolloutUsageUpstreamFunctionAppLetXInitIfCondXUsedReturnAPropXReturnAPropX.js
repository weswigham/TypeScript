//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppLetXInitIfCondXUsedReturnAPropXReturnAPropX.ts] ////

//// [globals.d.ts]

//// [input.tsx]
function App() {
				let x = "init";
				if (cond) {
					x = "used";
					return <A prop={x} />;
				}
				return <A prop={x} />;
			}

//// [input.tsx]
function App() {
				let x = "init";
				if (cond) {
					x = "used";
					return <A prop={x} />;
				}
				return <A prop={x} />;
			}
