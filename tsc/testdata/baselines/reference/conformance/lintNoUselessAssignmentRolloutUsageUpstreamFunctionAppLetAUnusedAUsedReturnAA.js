//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppLetAUnusedAUsedReturnAA.ts] ////

//// [globals.d.ts]

//// [input.tsx]
function App() {
            let A = "unused";
            A = "used";
            return <A></A>;
            }

//// [input.tsx]
function App() {
            let A = "unused";
            A = "used";
            return <A></A>;
            }
