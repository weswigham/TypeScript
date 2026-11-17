//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamAsyncFunctionFLetFooLetBarAwaitGetFooIdFooPropBarProp.ts] ////

//// [globals.d.ts]

//// [input.ts]

            async function f() {
                let foo = {}
                let bar = await get(foo.id);
                foo.prop = bar.prop;
            }
        

//// [input.ts]

            async function f() {
                let foo = {}
                let bar = await get(foo.id);
                foo.prop = bar.prop;
            }
        
