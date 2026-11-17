//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppLetX0FooXX1ReturnAPropX.ts] ////

//// [globals.d.ts]

//// [input.tsx]
function App() {
				let x = 0;
				foo(x);
				x = 1;
				return <A prop={x} />;
			}

//// [input.tsx]
function App() {
				let x = 0;
				foo(x);
				x = 1;
				return <A prop={x} />;
			}
