//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageUpstreamClassFooExportFooConsoleLogFooFooUnusedLikeButExported.ts] ////

//// [globals.d.ts]

//// [input.ts]
class foo {};
        export { foo };
        console.log(foo);
        foo = 'unused like but exported';

//// [input.ts]
class foo {};
        export { foo };
        console.log(foo);
        foo = 'unused like but exported';
