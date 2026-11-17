//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamExportDefaultFunctionFooConsoleLogFooFooUnusedLikeButExported.ts] ////

//// [globals.d.ts]

//// [input.ts]
export default function foo () {};
        console.log(foo);
        foo = 'unused like but exported';

//// [input.ts]
export default function foo () {};
        console.log(foo);
        foo = 'unused like but exported';
