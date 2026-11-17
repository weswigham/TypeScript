//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamLetFooUsedExportFooConsoleLogFooFooUnusedLikeButExported.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo = 'used';
        export { foo };
        console.log(foo);
        foo = 'unused like but exported';

//// [input.ts]
let foo = 'used';
        export { foo };
        console.log(foo);
        foo = 'unused like but exported';
