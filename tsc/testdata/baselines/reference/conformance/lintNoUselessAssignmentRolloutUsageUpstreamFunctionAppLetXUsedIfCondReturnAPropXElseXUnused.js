//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppLetXUsedIfCondReturnAPropXElseXUnused.ts] ////

//// [globals.d.ts]

//// [input.tsx]
function App() {
            let x = "used";
            if (cond) {
              return <A prop={x} />;
            } else {
              x = "unused";
            }
            }

//// [input.tsx]
function App() {
            let x = "used";
            if (cond) {
              return <A prop={x} />;
            } else {
              x = "unused";
            }
            }
