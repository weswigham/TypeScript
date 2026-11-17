// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-unused-vars/function_someFunction()_{_____var_a_=_0,_i;_____for_(i_=_0;_i_<_2;_i++)_{_________a_=_myFunction(a);_____}_}_someFunction(); (invocation 1).
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
function someFunction() {
    var a = 0, i;
    for (i = 0; i < 2; i++) {
        a = myFunction(a);
    }
}
someFunction();