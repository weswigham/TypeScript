// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-useless-assignment/function_foo()_{_________________let_v;_________________if_(condition)_{_____________________v_=_'unused';_________________}_else_{_____________________//_________________}_________________if_(condition2)_{_____________________v_=_'used-1';_________________}_else_{_____________________v_=_'used-2';_________________}_________________console.log(v);_____________} (invocation 1).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "jsx": "preserve",
        "module": "esnext",
        "moduleDetection": "force",
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "no-useless-assignment": "error"
        }
    },
    "files": [
        "/input.ts",
        "globals.d.ts"
    ]
}
// @filename: /globals.d.ts

// @filename: /input.ts
function foo() {
                let v;
                if (condition) {
                    v = 'unused';
                } else {
                    //
                }
                if (condition2) {
                    v = 'used-1';
                } else {
                    v = 'used-2';
                }
                console.log(v);
            }