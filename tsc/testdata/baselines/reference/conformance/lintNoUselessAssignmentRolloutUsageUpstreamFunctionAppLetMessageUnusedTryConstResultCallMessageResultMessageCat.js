//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionAppLetMessageUnusedTryConstResultCallMessageResultMessageCat.ts] ////

//// [globals.d.ts]

//// [input.tsx]
function App() {
            let message = 'unused';
            try {
              const result = call();
              message = result.message;
            } catch (e) {
              message = 'used';
            }
            return <A prop={message} />;
            }

//// [input.tsx]
function App() {
            let message = 'unused';
            try {
              const result = call();
              message = result.message;
            } catch (e) {
              message = 'used';
            }
            return <A prop={message} />;
            }
