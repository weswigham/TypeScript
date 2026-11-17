//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamExportClassFooConsoleLogFooFooUnusedLikeButExported.ts] ////

//// [globals.d.ts]

//// [input.ts]
export class foo {};
        console.log(foo);
        foo = 'unused like but exported';

//// [input.ts]
export class foo {};
        console.log(foo);
        foo = 'unused like but exported';
