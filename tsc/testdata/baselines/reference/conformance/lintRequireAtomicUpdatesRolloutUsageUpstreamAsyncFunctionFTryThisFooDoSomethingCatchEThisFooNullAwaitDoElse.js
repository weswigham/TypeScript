//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamAsyncFunctionFTryThisFooDoSomethingCatchEThisFooNullAwaitDoElse.ts] ////

//// [globals.d.ts]

//// [input.ts]

            async function f() {
                try {
                    this.foo = doSomething();
                } catch (e) {
                    this.foo = null;
                    await doElse();
                }
            }
        

//// [input.ts]

            async function f() {
                try {
                    this.foo = doSomething();
                } catch (e) {
                    this.foo = null;
                    await doElse();
                }
            }
        
