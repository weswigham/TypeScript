//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamAsyncFunctionFFooLetBarAwaitGetFooIdBarPropFooProp.ts] ////

//// [globals.d.ts]

//// [input.ts]

            async function f(foo) {
                let bar = await get(foo.id);
                bar.prop = foo.prop;
            }
        

//// [input.ts]

            async function f(foo) {
                let bar = await get(foo.id);
                bar.prop = foo.prop;
            }
        
