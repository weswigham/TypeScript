//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppLetAUnusedAUsedReturnAB.ts] ////

//// [globals.d.ts]

//// [input.tsx]
function App() {
            let A = "unused";
            A = "used";
            return <A.B />;
            }

//// [input.tsx]
function App() {
            let A = "unused";
            A = "used";
            return <A.B />;
            }
