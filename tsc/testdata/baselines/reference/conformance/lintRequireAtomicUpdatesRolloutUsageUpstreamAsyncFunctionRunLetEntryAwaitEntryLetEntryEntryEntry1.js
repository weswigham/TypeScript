//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamAsyncFunctionRunLetEntryAwaitEntryLetEntryEntryEntry1.ts] ////

//// [globals.d.ts]

//// [input.ts]

            async function run() {
              {
                let entry;
                await entry;
              }
              {
                let entry;
                () => entry;

                entry = 1;
              }
            }
        

//// [input.ts]

            async function run() {
              {
                let entry;
                await entry;
              }
              {
                let entry;
                () => entry;

                entry = 1;
              }
            }
        
