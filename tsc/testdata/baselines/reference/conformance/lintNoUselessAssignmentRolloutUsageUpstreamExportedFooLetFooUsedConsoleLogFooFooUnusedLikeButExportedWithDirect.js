//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamExportedFooLetFooUsedConsoleLogFooFooUnusedLikeButExportedWithDirect.ts] ////

//// [globals.d.ts]

//// [input.ts]
/* exported foo */
            let foo = 'used';
            console.log(foo);
            foo = 'unused like but exported with directive';

//// [input.ts]
/* exported foo */
            let foo = 'used';
            console.log(foo);
            foo = 'unused like but exported with directive';
