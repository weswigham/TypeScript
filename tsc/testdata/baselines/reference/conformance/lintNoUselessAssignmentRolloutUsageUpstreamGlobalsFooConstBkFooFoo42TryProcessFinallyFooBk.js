//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamGlobalsFooConstBkFooFoo42TryProcessFinallyFooBk.ts] ////

//// [globals.d.ts]

//// [input.ts]
/* globals foo */
        const bk = foo;
        foo = 42;
        try {
            // process
        } finally {
            foo = bk;
        }

//// [input.ts]
/* globals foo */
        const bk = foo;
        foo = 42;
        try {
            // process
        } finally {
            foo = bk;
        }
