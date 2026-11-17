//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarUnregisterFooWatcherUnregisterFooWatcherScopeWatchFooFunctionSomeCodeUnr.ts] ////

//// [globals.d.ts]

//// [input.ts]
var unregisterFooWatcher;
// ...
unregisterFooWatcher = $scope.$watch( "foo", function() {
    // ...some code..
    unregisterFooWatcher();
});

//// [input.ts]
var unregisterFooWatcher;
// ...
unregisterFooWatcher = $scope.$watch( "foo", function() {
    // ...some code..
    unregisterFooWatcher();
});
