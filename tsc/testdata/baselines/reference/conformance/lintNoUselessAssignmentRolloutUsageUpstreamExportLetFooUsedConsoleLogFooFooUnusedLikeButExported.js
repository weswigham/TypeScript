//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamExportLetFooUsedConsoleLogFooFooUnusedLikeButExported.ts] ////

//// [globals.d.ts]

//// [input.ts]
export let foo = 'used';
        console.log(foo);
        foo = 'unused like but exported';

//// [input.ts]
export let foo = 'used';
        console.log(foo);
        foo = 'unused like but exported';
