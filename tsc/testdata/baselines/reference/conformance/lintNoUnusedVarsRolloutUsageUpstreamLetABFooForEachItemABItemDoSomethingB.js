//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamLetABFooForEachItemABItemDoSomethingB.ts] ////

//// [globals.d.ts]

//// [input.ts]

            let _a, b;
            foo.forEach(item => {
                [_a, b] = item;
                doSomething(b);
            });
            

//// [input.ts]

            let _a, b;
            foo.forEach(item => {
                [_a, b] = item;
                doSomething(b);
            });
            
