//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooFunctionGBazFooYieldSomethingFoo1.ts] ////

//// [globals.d.ts]

//// [input.ts]

                let foo;
                function* g() {
                    baz = foo;
                    yield something;
                    foo = 1;
                }
            

//// [input.ts]

                let foo;
                function* g() {
                    baz = foo;
                    yield something;
                    foo = 1;
                }
            
