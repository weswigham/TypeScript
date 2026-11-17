//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppLetPropsA1FooPropsPropsB2ReturnAProps.ts] ////

//// [globals.d.ts]

//// [input.tsx]
function App() {
				let props = { a: 1 };
				foo(props);
				props = { b: 2 };
				return <A {...props} />;
			}

//// [input.tsx]
function App() {
				let props = { a: 1 };
				foo(props);
				props = { b: 2 };
				return <A {...props} />;
			}
