// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-unused-vars/var_unregisterFooWatcher;_//_..._unregisterFooWatcher_=_$scope.$watch(_"foo",_function()_{_____//_...some_code.._____unregisterFooWatcher();_}); (invocation 1).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "moduleDetection": "legacy",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-unused-vars": "error"
        }
    },
    "files": [
        "/input.ts",
        "globals.d.ts"
    ]
}
// @filename: /globals.d.ts

// @filename: /input.ts
var unregisterFooWatcher;
// ...
unregisterFooWatcher = $scope.$watch( "foo", function() {
    // ...some code..
    unregisterFooWatcher();
});