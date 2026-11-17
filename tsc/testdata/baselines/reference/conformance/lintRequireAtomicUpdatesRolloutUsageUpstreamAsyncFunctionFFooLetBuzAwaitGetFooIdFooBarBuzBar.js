//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamAsyncFunctionFFooLetBuzAwaitGetFooIdFooBarBuzBar.ts] ////

//// [globals.d.ts]

//// [input.ts]

                async function f(foo) {
                    let buz = await get(foo.id);
                    foo.bar = buz.bar;
                }
            

//// [input.ts]

                async function f(foo) {
                    let buz = await get(foo.id);
                    foo.bar = buz.bar;
                }
            
