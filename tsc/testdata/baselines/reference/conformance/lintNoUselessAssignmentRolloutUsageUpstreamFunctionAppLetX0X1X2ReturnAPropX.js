//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppLetX0X1X2ReturnAPropX.ts] ////

//// [globals.d.ts]

//// [input.tsx]
function App() {
            let x = 0;
            x = 1;
            x = 2;
            return <A prop={x} />;
            }

//// [input.tsx]
function App() {
            let x = 0;
            x = 1;
            x = 2;
            return <A prop={x} />;
            }
