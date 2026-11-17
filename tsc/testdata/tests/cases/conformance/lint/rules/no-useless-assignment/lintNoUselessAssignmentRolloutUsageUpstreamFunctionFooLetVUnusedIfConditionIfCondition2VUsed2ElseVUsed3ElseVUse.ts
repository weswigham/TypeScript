// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-useless-assignment/function_foo()_{_________________let_v_=_'unused';_________________if_(condition)_{_____________________if_(condition2)_{_________________________v_=_'used-2';_____________________}_else_{_________________________v_=_'used-3';_____________________}_________________}_else_{_____________________v_=_'used-4';_________________}_________________console.log(v);_____________} (invocation 1).
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
                let v = 'unused';
                if (condition) {
                    if (condition2) {
                        v = 'used-2';
                    } else {
                        v = 'used-3';
                    }
                } else {
                    v = 'used-4';
                }
                console.log(v);
            }