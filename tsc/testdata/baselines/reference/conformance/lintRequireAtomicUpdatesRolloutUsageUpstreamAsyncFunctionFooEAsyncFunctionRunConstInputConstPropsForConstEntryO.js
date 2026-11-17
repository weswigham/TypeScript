//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamAsyncFunctionFooEAsyncFunctionRunConstInputConstPropsForConstEntryO.ts] ////

//// [globals.d.ts]

//// [input.ts]

            async function foo(e) {
            }

            async function run() {
              const input = [];
              const props = [];

              for(const entry of input) {
                const prop = props.find(a => a.id === entry.id) || null;
                await foo(entry);
              }

              for(const entry of input) {
                const prop = props.find(a => a.id === entry.id) || null;
              }

              for(const entry2 of input) {
                const prop = props.find(a => a.id === entry2.id) || null;
              }
            }
        

//// [input.ts]

            async function foo(e) {
            }

            async function run() {
              const input = [];
              const props = [];

              for(const entry of input) {
                const prop = props.find(a => a.id === entry.id) || null;
                await foo(entry);
              }

              for(const entry of input) {
                const prop = props.find(a => a.id === entry.id) || null;
              }

              for(const entry2 of input) {
                const prop = props.find(a => a.id === entry2.id) || null;
              }
            }
        
