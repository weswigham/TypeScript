//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamFunctionFooExportFooConsoleLogFooFooUnusedLikeButExported.ts] ////

//// [globals.d.ts]

//// [input.ts]
function foo () {};
        export { foo };
        console.log(foo);
        foo = 'unused like but exported';

//// [input.ts]
function foo () {};
        export { foo };
        console.log(foo);
        foo = 'unused like but exported';
