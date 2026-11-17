//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppLetX1XX1X5ReturnAPropX.ts] ////

//// [globals.d.ts]

//// [input.tsx]
function App() {
            let x = 1;
            x = x + 1;
            x = 5;
            return <A prop={x} />;
            }

//// [input.tsx]
function App() {
            let x = 1;
            x = x + 1;
            x = 5;
            return <A prop={x} />;
            }
