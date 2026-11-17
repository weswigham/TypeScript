//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamAsyncFunctionFLetRecordsRecordsAwaitARecordsGRecords.ts] ////

//// [globals.d.ts]

//// [input.ts]

            async function f() {
                let records
                records = await a.records
                g(() => { records })
            }
        

//// [input.ts]

            async function f() {
                let records
                records = await a.records
                g(() => { records })
            }
        
