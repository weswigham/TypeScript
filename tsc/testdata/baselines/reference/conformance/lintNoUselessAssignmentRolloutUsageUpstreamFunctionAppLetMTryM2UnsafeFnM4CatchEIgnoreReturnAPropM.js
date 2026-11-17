//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppLetMTryM2UnsafeFnM4CatchEIgnoreReturnAPropM.ts] ////

//// [globals.d.ts]

//// [input.tsx]
function App() {
				let m;
				try {
				  m = 2;
				  unsafeFn();
				  m = 4;
				} catch (e) {
				  // ignore
				}
				return <A prop={m} />;
			}

//// [input.tsx]
function App() {
				let m;
				try {
				  m = 2;
				  unsafeFn();
				  m = 4;
				} catch (e) {
				  // ignore
				}
				return <A prop={m} />;
			}
