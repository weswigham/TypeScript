// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-useless-assignment/function_foo()_{_________________let_v_=_'used';_________________if_(condition)_{_____________________let_v_=_'used';_____________________console.log(v);_____________________v_=_'unused';_________________}_________________console.log(v);_________________v_=_'unused';_____________} (invocation 1).
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
                let v = 'used';
                if (condition) {
                    let v = 'used';
                    console.log(v);
                    v = 'unused';
                }
                console.log(v);
                v = 'unused';
            }