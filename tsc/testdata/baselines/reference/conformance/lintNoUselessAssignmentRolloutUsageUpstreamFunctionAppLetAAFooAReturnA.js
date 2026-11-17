//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppLetAAFooAReturnA.ts] ////

//// [globals.d.ts]

//// [input.tsx]

                function App() {
					let A = "a";
                    foo(A);
                    return <A/>;
                }
            

//// [input.tsx]

                function App() {
					let A = "a";
                    foo(A);
                    return <A/>;
                }
            
