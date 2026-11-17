//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionAIfFooFooAwaitSomething.ts] ////

//// [globals.d.ts]

//// [input.ts]

                let foo;
                async function a() {
                    if (foo) {
                        foo = await something;
                    }
                }
            

//// [input.ts]

                let foo;
                async function a() {
                    if (foo) {
                        foo = await something;
                    }
                }
            
