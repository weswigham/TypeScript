//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppLetAAUnusedIfCondAUsed1ElseAUsed2ReturnA.ts] ////

//// [globals.d.ts]

//// [input.tsx]
function App() {
            let A;
            A = "unused";
            if (cond) {
              A = "used1";
            } else {
              A = "used2";
            }
            return <A/>;
            }

//// [input.tsx]
function App() {
            let A;
            A = "unused";
            if (cond) {
              A = "used1";
            } else {
              A = "used2";
            }
            return <A/>;
            }
