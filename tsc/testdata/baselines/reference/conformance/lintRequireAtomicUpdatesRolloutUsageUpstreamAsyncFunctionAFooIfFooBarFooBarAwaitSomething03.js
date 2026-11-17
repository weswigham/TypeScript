//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamAsyncFunctionAFooIfFooBarFooBarAwaitSomething03.ts] ////

//// [globals.d.ts]

//// [input.ts]

                async function a(foo) {
                    if (foo.bar) {
                        foo.bar = await something;
                    }
                }
            

//// [input.ts]

                async function a(foo) {
                    if (foo.bar) {
                        foo.bar = await something;
                    }
                }
            
