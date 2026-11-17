//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamExportDefaultClassFooConsoleLogFooFooUnusedLikeButExported.ts] ////

//// [globals.d.ts]

//// [input.ts]
export default class foo {};
        console.log(foo);
        foo = 'unused like but exported';

//// [input.ts]
export default class foo {};
        console.log(foo);
        foo = 'unused like but exported';
