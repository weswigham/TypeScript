//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamAsyncFunctionFFooLetBarAwaitGetFooIdFooBarProp.ts] ////

//// [globals.d.ts]

//// [input.ts]

            async function f(foo) {
                let bar = await get(foo.id);
                foo = bar.prop;
            }
        

//// [input.ts]

            async function f(foo) {
                let bar = await get(foo.id);
                foo = bar.prop;
            }
        
