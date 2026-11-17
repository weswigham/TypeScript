//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamFunctionGFooBazFooBarYieldSomethingFooBar1.ts] ////

//// [globals.d.ts]

//// [input.ts]

                function* g(foo) {
                    baz = foo.bar;
                    yield something;
                    foo.bar = 1;
                }
            

//// [input.ts]

                function* g(foo) {
                    baz = foo.bar;
                    yield something;
                    foo.bar = 1;
                }
            
