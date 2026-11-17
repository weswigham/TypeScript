//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppConstObjA1LetABA2ObjReturnAPropA.ts] ////

//// [globals.d.ts]

//// [input.tsx]
function App() {
				const obj = { a: 1 };
				let {
				  a,
				  b = (a = 2)
				} = obj;
				return <A prop={a} />;
			}

//// [input.tsx]
function App() {
				const obj = { a: 1 };
				let {
				  a,
				  b = (a = 2)
				} = obj;
				return <A prop={a} />;
			}
