//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppLetX1X2ReturnAXA.ts] ////

//// [globals.d.ts]

//// [input.tsx]
function App() {
            let x = 1;
            x = 2;
            return <A>{x}</A>;
            }

//// [input.tsx]
function App() {
            let x = 1;
            x = 2;
            return <A>{x}</A>;
            }
