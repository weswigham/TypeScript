//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamExportFunctionFooConsoleLogFooFooUnusedLikeButExported.ts] ////

//// [globals.d.ts]

//// [input.ts]
export function foo () {};
        console.log(foo);
        foo = 'unused like but exported';

//// [input.ts]
export function foo () {};
        console.log(foo);
        foo = 'unused like but exported';
