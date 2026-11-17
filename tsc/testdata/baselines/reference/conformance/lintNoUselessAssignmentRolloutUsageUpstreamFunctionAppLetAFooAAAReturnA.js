//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppLetAFooAAAReturnA.ts] ////

//// [globals.d.ts]

//// [input.tsx]

                function App() {
                    let A = "";
                    foo(A);
                    A = "A";
                    return <A/>;
                }
            

//// [input.tsx]

                function App() {
                    let A = "";
                    foo(A);
                    A = "A";
                    return <A/>;
                }
            
