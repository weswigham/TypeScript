// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestRolloutUsageUpstream/no-useless-assignment/function_foo()_{_____________let_a_=_42;_____________console.log(a);_____________a_=_10;_____________if_(cond)_{_________________a_=_a_+_1;_____________}_else_{_________________a_=_2_+_a;_____________}_____________console.log(a);_________} (invocation 1).
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
            let a = 42;
            console.log(a);
            a = 10;
            if (cond) {
                a = a + 1;
            } else {
                a = 2 + a;
            }
            console.log(a);
        }