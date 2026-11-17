//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppLetAUnusedAUsedReturnA.ts] ////

//// [globals.d.ts]

//// [input.tsx]
function App() {
            let A = "unused";
            A = "used";
            return <A/>;
            }

//// [input.tsx]
function App() {
            let A = "unused";
            A = "used";
            return <A/>;
            }
